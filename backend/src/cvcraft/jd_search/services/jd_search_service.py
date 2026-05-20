"""
Service layer cho tính năng RAG JD Search.
Orchestrates: vector search (score >= 0.5) -> reconstruct JDDocument -> format JD sections.
"""
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import re

from pydantic import BaseModel

from cvcraft.jd_search.core.models import JDDocument, JDRewrittenSections, JDSearchResult, JDSearchResponse
from cvcraft.jd_search.infrastructure.llm.factory import LLMFactory, call_with_structured_output
from cvcraft.jd_search.rag.vector_store import JDVectorStore
from cvcraft.jd_search.rag.indexing.jd_indexer import index_jd_samples, index_seed_samples


class FormattedJDSections(BaseModel):
    job_description: list[str]
    requirements: list[str]
    benefits: list[str]


class FormattedJDItem(FormattedJDSections):
    id: str


class FormattedJDBatch(BaseModel):
    items: list[FormattedJDItem]


class JDSearchService:
    _format_cache: dict[tuple[str, str, str], FormattedJDSections] = {}
    _formatter_executor = ThreadPoolExecutor(max_workers=2)
    SEARCH_TIMEOUT_SECONDS = 10
    FORMAT_TIMEOUT_SECONDS = 60
    MAX_RESULTS = 10
    DEFAULT_SCORE_THRESHOLD = 0.5
    SHORT_QUERY_SCORE_THRESHOLD = 0.25

    def __init__(self):
        self._store = JDVectorStore()

    def search(self, query: str) -> JDSearchResponse:
        raw_results = self._query_with_timeout(query)
        score_threshold = self._score_threshold_for_query(query)
        filtered_results = []
        for raw in raw_results:
            meta = raw.get("metadata", {})
            distance = raw.get("distance")
            semantic_score = 1 - distance if distance is not None else 0.0
            title_score = self._title_match_score(query, meta.get("title", ""))
            similarity_score = round(max(semantic_score, title_score), 4)
            raw["similarity_score"] = similarity_score
            if similarity_score >= score_threshold:
                filtered_results.append(raw)

        if not filtered_results and self._is_short_query(query):
            filtered_results = raw_results[: self.MAX_RESULTS]

        filtered_results.sort(key=lambda item: item.get("similarity_score", 0.0), reverse=True)
        top_jds = [self._to_search_result(r) for r in filtered_results[: self.MAX_RESULTS]]
        self._format_sections_with_ai(top_jds)
        return JDSearchResponse(query=query, top_jds=top_jds)

    def _query_with_timeout(self, query: str) -> list[dict]:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._store.query_jds, query, None)
            try:
                return future.result(timeout=self.SEARCH_TIMEOUT_SECONDS)
            except TimeoutError:
                future.cancel()
                return []

    def index_jd(self, jd: JDDocument) -> None:
        searchable_text = (
            f"{jd.title} | {jd.company or ''} | {jd.industry or ''} | "
            f"{jd.seniority or ''} | {' '.join(jd.required_skills)} | "
            f"{jd.description}"
        )
        metadata = {
            "title": jd.title,
            "company": jd.company or "",
            "industry": jd.industry or "",
            "seniority": jd.seniority or "",
            "required_skills": ", ".join(jd.required_skills),
            "keywords": ", ".join(jd.keywords),
            "description": jd.description,
            **jd.details,
        }
        self._store.add_jd(doc_id=jd.id, text=searchable_text, metadata=metadata)

    def build_hf_index(self, reset: bool = False, max_records: int = 3000) -> dict:
        return index_jd_samples(reset=reset, max_records=max_records)

    def build_seed_index(self, reset: bool = False) -> dict:
        return index_seed_samples(reset=reset)

    def get_stats(self) -> dict:
        count = self._store.jd_collection.count()
        return {"job_descriptions": count, "is_empty": count == 0}

    @staticmethod
    def _to_search_result(raw: dict) -> JDSearchResult:
        meta = raw.get("metadata", {})
        distance = raw.get("distance")
        similarity = raw.get("similarity_score")
        if similarity is None:
            similarity = round(1 - distance, 4) if distance is not None else 0.0
        details = {
            key: str(value)
            for key, value in meta.items()
            if key not in {"id", "year"} and value not in (None, "")
        }

        jd = JDDocument(
            id=raw.get("id") or meta.get("title", "unknown").replace(" ", "_").lower(),
            title=meta.get("title", ""),
            company=meta.get("company") or None,
            industry=meta.get("industry") or None,
            seniority=meta.get("seniority") or None,
            description=meta.get("description", raw.get("text", "")),
            required_skills=[s.strip() for s in meta.get("required_skills", "").split(",") if s.strip()],
            keywords=[k.strip() for k in meta.get("keywords", "").split(",") if k.strip()],
            details=details,
        )
        return JDSearchResult(jd=jd, similarity_score=similarity)

    @classmethod
    def _format_sections_with_ai(cls, results: list[JDSearchResult]) -> None:
        pending: list[tuple[JDSearchResult, tuple[str, str, str]]] = []
        for result in results:
            details = result.jd.details
            job_description = details.get("job_description", "")
            requirements = details.get("requirements", "")
            benefits = details.get("benefits", "")
            if not any([job_description, requirements, benefits]):
                continue

            cache_key = (job_description, requirements, benefits)
            formatted = cls._format_cache.get(cache_key)
            if formatted is not None:
                cls._apply_formatted_sections(result, formatted)
            else:
                pending.append((result, cache_key))

        if not pending:
            return

        future = cls._formatter_executor.submit(cls._format_jds_batch, pending)
        try:
            formatted_batch = future.result(timeout=cls.FORMAT_TIMEOUT_SECONDS)
        except Exception:
            for result, cache_key in pending:
                formatted = cls._fallback_format_sections(cache_key)
                cls._apply_formatted_sections(result, formatted)
            return

        formatted_by_id = {item.id: item for item in formatted_batch.items}
        for result, cache_key in pending:
            item = formatted_by_id.get(result.jd.id)
            if item is None:
                cls._apply_formatted_sections(result, cls._fallback_format_sections(cache_key))
                continue
            formatted = FormattedJDSections(
                job_description=cls._clean_bullet_items(item.job_description),
                requirements=cls._clean_bullet_items(item.requirements),
                benefits=cls._clean_bullet_items(item.benefits),
            )
            cls._format_cache[cache_key] = formatted
            cls._apply_formatted_sections(result, formatted)

    @staticmethod
    def _apply_formatted_sections(result: JDSearchResult, formatted: FormattedJDSections) -> None:
        result.jd.rewritten_sections = JDRewrittenSections(
            job_description=formatted.job_description,
            requirements=formatted.requirements,
            benefits=formatted.benefits,
        )
        result.jd.description_bullets = formatted.job_description
        result.jd.requirements_bullets = formatted.requirements
        result.jd.benefits_bullets = formatted.benefits

    @staticmethod
    def _format_jds_batch(
        pending: list[tuple[JDSearchResult, tuple[str, str, str]]],
    ) -> FormattedJDBatch:
        llm = LLMFactory.get_llm("cheap")
        system_prompt = (
            "Bạn là biên tập viên tin tuyển dụng chuyên nghiệp. "
            "Nhiệm vụ: viết lại 3 mục job_description, requirements, benefits dưới dạng JSON array of strings.\n\n"
            "QUY TẮC NỘI DUNG:\n"
            "- Không bịa thêm bất kỳ nội dung nào (nhiệm vụ, yêu cầu, phúc lợi, số liệu, mức lương, tên công nghệ, địa điểm) không có trong input.\n"
            "- Được phép diễn đạt lại cho rõ ràng hơn, gom hoặc tách ý, nhưng phải bám sát ý nghĩa gốc.\n"
            "- Giữ nguyên ngôn ngữ: tiếng Việt giữ tiếng Việt, tiếng Anh giữ tiếng Anh, không dịch.\n"
            "- Loại bỏ các tiêu đề lặp như 'MÔ TẢ CÔNG VIỆC:', 'YÊU CẦU:', 'QUYỀN LỢI:', 'CHẾ ĐỘ ĐÃI NGỘ:'.\n\n"
            "QUY TẮC ĐỊNH DẠNG (bắt buộc):\n"
            "- Mỗi trường (job_description, requirements, benefits) là một JSON array of strings.\n"
            "- Mỗi string trong array là MỘT ý hoàn chỉnh, không có bullet prefix ('- ', '● ', '• ').\n"
            "- Mỗi string không được chứa ký tự xuống dòng (\\n).\n"
            "- Không để string rỗng trong array.\n"
            "Trả về đủ tất cả item theo đúng id input."
        )
        blocks = []
        for result, cache_key in pending:
            job_description, requirements, benefits = cache_key
            blocks.append(
                f"ID: {result.jd.id}\n"
                f"job_description:\n{job_description}\n\n"
                f"requirements:\n{requirements}\n\n"
                f"benefits:\n{benefits}"
            )
        user_message = "Viết lại từng item sau thành JSON arrays theo đúng schema.\n\n" + "\n\n---\n\n".join(blocks)
        return call_with_structured_output(
            llm=llm,
            output_schema=FormattedJDBatch,
            system_prompt=system_prompt,
            user_message=user_message,
        )

    @classmethod
    def _fallback_format_sections(cls, cache_key: tuple[str, str, str]) -> FormattedJDSections:
        job_description, requirements, benefits = cache_key
        return FormattedJDSections(
            job_description=cls._text_to_bullets(job_description),
            requirements=cls._text_to_bullets(requirements),
            benefits=cls._text_to_bullets(benefits),
        )

    @staticmethod
    def _split_sentences(text: str) -> list[str]:
        if len(text) < 60:
            return [text]
        parts = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        return [p.strip() for p in parts if p.strip()]

    @staticmethod
    def _text_to_bullets(text: str) -> list[str]:
        if not text or not text.strip():
            return []
        normalized = text.strip()
        normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
        normalized = re.sub(r"\s*[•·●]\s*", "\n", normalized)
        normalized = re.sub(r"(?<!\S)[+*]\s+", "\n", normalized)
        normalized = re.sub(r"\s+-\s+", "\n", normalized)
        lines = []
        for raw_line in normalized.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            line = re.sub(r"^[+*•·●\-]\s*", "", line).strip()
            line = re.sub(r"^\d+[.)]\s*", "", line).strip()
            if not line:
                continue
            if len(line) > 120:
                lines.extend(JDSearchService._split_sentences(line))
            else:
                lines.append(line)
        return lines

    @classmethod
    def _clean_bullet_items(cls, items: list[str]) -> list[str]:
        cleaned: list[str] = []
        for item in items:
            line = re.sub(r"\s+", " ", item).strip()
            line = re.sub(r"^[-+*•·●]+\s*", "", line).strip()
            line = re.sub(r"^\d+[.)]\s*", "", line).strip()
            if not line:
                continue
            if len(line) > 120:
                cleaned.extend(cls._split_sentences(line))
            else:
                cleaned.append(line)
        return cleaned

    @staticmethod
    def _normalize_text(value: str) -> str:
        return re.sub(r"\s+", " ", value.casefold()).strip()

    @classmethod
    def _title_match_score(cls, query: str, title: str) -> float:
        normalized_query = cls._normalize_text(query)
        normalized_title = cls._normalize_text(title)
        if not normalized_query or not normalized_title:
            return 0.0
        if normalized_query == normalized_title:
            return 1.0
        if normalized_query in normalized_title or normalized_title in normalized_query:
            return 0.95

        query_tokens = set(re.findall(r"[\w]+", normalized_query))
        title_tokens = set(re.findall(r"[\w]+", normalized_title))
        if not query_tokens or not title_tokens:
            return 0.0

        overlap = len(query_tokens & title_tokens) / len(query_tokens)
        return 0.5 + (0.4 * overlap) if overlap >= 0.75 else 0.0

    @classmethod
    def _score_threshold_for_query(cls, query: str) -> float:
        return cls.SHORT_QUERY_SCORE_THRESHOLD if cls._is_short_query(query) else cls.DEFAULT_SCORE_THRESHOLD

    @classmethod
    def _is_short_query(cls, query: str) -> bool:
        return len(cls._normalize_text(query)) <= 2
