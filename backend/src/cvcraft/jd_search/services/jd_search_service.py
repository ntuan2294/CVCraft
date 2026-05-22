"""
Service layer cho tính năng RAG JD Search.
Orchestrates: vector search (score >= 0.5) -> reconstruct JDDocument -> format JD sections.
"""
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import re
from threading import Lock
import time

from pydantic import BaseModel

from cvcraft.jd_search.core.models import JDDocument, JDRewrittenSections, JDSearchResult, JDSearchResponse, JDCardResult, JDSearchCardResponse, JDFormattedDetail
from cvcraft.jd_search.infrastructure.llm.factory import LLMFactory, call_with_structured_output
from cvcraft.jd_search.rag.vector_store import JDVectorStore
from cvcraft.jd_search.rag.indexing.jd_indexer import index_jd_samples
from cvcraft.jd_search.text_preprocessing import preprocess_jd_text


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
    _search_cache: dict[str, tuple[float, "JDSearchResponse"]] = {}
    _card_cache: dict[str, tuple[float, "JDSearchCardResponse"]] = {}
    _raw_jd_cache: dict[str, dict] = {}
    _formatter_executor = ThreadPoolExecutor(max_workers=2)
    _prefetch_executor = ThreadPoolExecutor(max_workers=1)
    _scheduled_format_keys: set[tuple[str, str, str]] = set()
    _scheduled_format_lock = Lock()
    SEARCH_TIMEOUT_SECONDS = 10
    FORMAT_TIMEOUT_SECONDS = 60
    MAX_RESULTS = 10
    DEFAULT_SCORE_THRESHOLD = 0.5
    SHORT_QUERY_SCORE_THRESHOLD = 0.25
    SEARCH_CACHE_TTL = 30

    def __init__(self):
        self._store = JDVectorStore()

    def search(self, query: str) -> JDSearchResponse:
        cache_entry = self._search_cache.get(query)
        if cache_entry and time.time() - cache_entry[0] < self.SEARCH_CACHE_TTL:
            return cache_entry[1]

        raw_results = self._query_with_timeout(query)
        score_threshold = self._score_threshold_for_query(query)
        filtered_results = []
        for raw in raw_results:
            similarity_score = self._calc_similarity_score(query, raw)
            raw["similarity_score"] = similarity_score
            if similarity_score >= score_threshold:
                filtered_results.append(raw)

        if not filtered_results and self._is_short_query(query):
            filtered_results = raw_results[: self.MAX_RESULTS]

        filtered_results.sort(key=lambda item: item.get("similarity_score", 0.0), reverse=True)
        top_jds = [self._to_search_result(r) for r in filtered_results[: self.MAX_RESULTS]]
        self._format_sections_with_ai(top_jds)
        response = JDSearchResponse(query=query, top_jds=top_jds)
        self._search_cache[query] = (time.time(), response)
        return response

    def _query_with_timeout(self, query: str) -> list[dict]:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._store.query_jds, query, None)
            try:
                return future.result(timeout=self.SEARCH_TIMEOUT_SECONDS)
            except TimeoutError:
                future.cancel()
                return []

    def search_cards(self, query: str) -> JDSearchCardResponse:
        cache_entry = self._card_cache.get(query)
        if cache_entry and time.time() - cache_entry[0] < self.SEARCH_CACHE_TTL:
            return cache_entry[1]

        raw_results = self._query_with_timeout(query)
        score_threshold = self._score_threshold_for_query(query)
        filtered = []
        for raw in raw_results:
            similarity_score = self._calc_similarity_score(query, raw)
            raw["similarity_score"] = similarity_score
            if similarity_score >= score_threshold:
                filtered.append(raw)

        if not filtered and self._is_short_query(query):
            filtered = raw_results[: self.MAX_RESULTS]

        filtered.sort(key=lambda item: item.get("similarity_score", 0.0), reverse=True)

        cards = []
        raw_cards = []
        for raw in filtered[: self.MAX_RESULTS]:
            meta = raw.get("metadata", {})
            jd_id = raw.get("id") or meta.get("title", "unknown").replace(" ", "_").lower()
            self._raw_jd_cache[jd_id] = {"id": jd_id, "metadata": meta, "text": raw.get("text", "")}
            raw_cards.append(raw)
            cards.append(JDCardResult(
                id=jd_id,
                title=meta.get("title", ""),
                company=meta.get("company") or None,
                industry=meta.get("industry") or None,
                seniority=meta.get("seniority") or None,
                similarity_score=raw["similarity_score"],
            ))

        response = JDSearchCardResponse(query=query, results=cards)
        self._card_cache[query] = (time.time(), response)
        self._schedule_format_prefetch(raw_cards)
        return response

    def format_jd(self, jd_id: str) -> JDFormattedDetail:
        raw = self._raw_jd_cache.get(jd_id)
        if not raw:
            return JDFormattedDetail(id=jd_id)

        meta = raw["metadata"]
        job_description = preprocess_jd_text(meta.get("job_description", ""))
        requirements = preprocess_jd_text(meta.get("requirements", ""))
        benefits = preprocess_jd_text(meta.get("benefits", ""))

        cache_key = (job_description, requirements, benefits)
        formatted = self._format_cache.get(cache_key)
        if formatted is None:
            # Return text-parsed result immediately — schedule LLM enrichment in background.
            formatted = self._fallback_format_sections(cache_key)
            self._schedule_format_prefetch([raw])

        quick_info_keys = {"salary", "location", "experience_level", "job_position"}
        quick_info = {k: str(v) for k, v in meta.items() if k in quick_info_keys and v}

        return JDFormattedDetail(
            id=jd_id,
            description_bullets=formatted.job_description,
            requirements_bullets=formatted.requirements,
            benefits_bullets=formatted.benefits,
            quick_info=quick_info,
        )

    def index_jd(self, jd: JDDocument) -> None:
        processed_details = {
            key: preprocess_jd_text(value) if key in {"description", "job_description", "requirements", "benefits"} else value
            for key, value in jd.details.items()
        }
        searchable_text = (
            f"{jd.title} | {jd.company or ''} | {jd.industry or ''} | "
            f"{jd.seniority or ''} | {' '.join(jd.required_skills)} | "
            f"{preprocess_jd_text(jd.description)}"
        )
        metadata = {
            "title": jd.title,
            "company": jd.company or "",
            "industry": jd.industry or "",
            "seniority": jd.seniority or "",
            "required_skills": ", ".join(jd.required_skills),
            "keywords": ", ".join(jd.keywords),
            "description": preprocess_jd_text(jd.description),
            **processed_details,
        }
        self._store.add_jd(doc_id=jd.id, text=searchable_text, metadata=metadata)

    def build_hf_index(self, reset: bool = False, max_records: int = 3000) -> dict:
        return index_jd_samples(reset=reset, max_records=max_records)

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
            job_description = preprocess_jd_text(details.get("job_description", ""))
            requirements = preprocess_jd_text(details.get("requirements", ""))
            benefits = preprocess_jd_text(details.get("benefits", ""))
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

    @classmethod
    def _schedule_format_prefetch(cls, raw_results: list[dict]) -> None:
        pending: list[JDSearchResult] = []
        scheduled_keys: list[tuple[str, str, str]] = []

        with cls._scheduled_format_lock:
            for raw in raw_results:
                result = cls._to_search_result(raw)
                details = result.jd.details
                cache_key = (
                    preprocess_jd_text(details.get("job_description", "")),
                    preprocess_jd_text(details.get("requirements", "")),
                    preprocess_jd_text(details.get("benefits", "")),
                )
                if not any(cache_key):
                    continue
                if cache_key in cls._format_cache or cache_key in cls._scheduled_format_keys:
                    continue
                cls._scheduled_format_keys.add(cache_key)
                scheduled_keys.append(cache_key)
                pending.append(result)

        if not pending:
            return

        future = cls._prefetch_executor.submit(cls._format_sections_with_ai, pending)

        def cleanup(_future) -> None:
            with cls._scheduled_format_lock:
                for cache_key in scheduled_keys:
                    cls._scheduled_format_keys.discard(cache_key)

        future.add_done_callback(cleanup)

    @staticmethod
    def _format_jds_batch(
        pending: list[tuple[JDSearchResult, tuple[str, str, str]]],
    ) -> FormattedJDBatch:
        llm = LLMFactory.get_llm("cheap_large")
        system_prompt = (
            "Bạn là biên tập viên tin tuyển dụng. Nhiệm vụ duy nhất: chuẩn hóa 3 trường "
            "`job_description`, `requirements`, `benefits` thành JSON array of strings, "
            "mỗi string là một ý độc lập.\n\n"

            "## ĐỊNH NGHĨA 'MỘT Ý' (QUAN TRỌNG)\n"
            "Một ý = MỘT nhiệm vụ / MỘT yêu cầu / MỘT phúc lợi cụ thể, độ dài thường 5-25 từ.\n"
            "Nếu một string output dài > 30 từ hoặc chứa nhiều hơn 1 nhiệm vụ/yêu cầu/phúc lợi, "
            "BẮT BUỘC phải tách nhỏ hơn.\n\n"

            "Quy tắc tách (áp dụng theo thứ tự ưu tiên):\n"
            "1. Mỗi dòng (\\n) trong input → tối thiểu một string riêng.\n"
            "2. Trong cùng một dòng, tách tiếp tại các ranh giới sau:\n"
            "   - Dấu '.' giữa hai mệnh đề (vd: 'Quản lý server. Nghiên cứu công nghệ mới' → tách).\n"
            "   - Dấu ';'.\n"
            "   - Dấu ',' KHI vế sau là một ý/phúc lợi/yêu cầu độc lập "
            "(vd: 'Lương tháng 13, thưởng dự án, BHXH' → tách 3. "
            "Nhưng 'Python, FastAPI, Docker' trong cùng yêu cầu kỹ năng → KHÔNG tách).\n"
            "3. KHÔNG gộp nhiều bullet/dòng input vào một string output.\n"
            "4. Ngoại lệ KHÔNG tách: liệt kê tên công nghệ/ngôn ngữ trong cùng yêu cầu kỹ năng, "
            "danh sách trong ngoặc đơn, ngày lễ liệt kê (vd: '1/1, 30/4, 2/9').\n\n"

            "## QUY TẮC NỘI DUNG\n"
            "- KHÔNG thêm thông tin không có trong input.\n"
            "- KHÔNG dịch ngôn ngữ.\n"
            "- KHÔNG suy diễn số liệu, năm kinh nghiệm, công nghệ.\n"
            "- Được phép: sửa chính tả rõ ràng, chuẩn hóa khoảng trắng, viết hoa đầu câu, "
            "bỏ tiêu đề section ('MÔ TẢ CÔNG VIỆC', 'YÊU CẦU', 'PHÚC LỢI', 'QUYỀN LỢI', "
            "'CHẾ ĐỘ ĐÃI NGỘ', 'JOB DESCRIPTION', 'REQUIREMENTS', 'BENEFITS').\n\n"

            "## QUY TẮC ĐỊNH DẠNG\n"
            "- KHÔNG bullet prefix: '-', '*', '+', '●', '•', '▪', '►', '★', '✓'.\n"
            "- KHÔNG số thứ tự đầu dòng: '1.', '1)', '1:'.\n"
            "- KHÔNG ký tự '\\n', '\\r', '\\t' trong string.\n"
            "- KHÔNG string rỗng/whitespace-only.\n"
            "- KHÔNG kết thúc bằng ':' hoặc ','.\n"
            "- KHÔNG trùng lặp string trong cùng array.\n"
            "- Trim whitespace, gộp space liên tiếp.\n\n"

            "## OUTPUT SCHEMA\n"
            "Chỉ trả về JSON object, không markdown fence, không giải thích:\n"
            "{\n"
            '  "<id>": {\n'
            '    "job_description": [...],\n'
            '    "requirements": [...],\n'
            '    "benefits": [...]\n'
            "  }\n"
            "}\n"
            "Field rỗng/null → trả về [].\n\n"

            "## VÍ DỤ\n"
            "Input:\n"
            "{\n"
            '  "job_001": {\n'
            '    "job_description": "Quản lý hệ thống web/app server, Storage. Tối ưu chi phí, performance, scaling ứng dụng. Nghiên cứu công nghệ mới",\n'
            '    "requirements": "Từ 2 năm kinh nghiệm DevOps. Có kinh nghiệm Kubernetes, docker. Hiểu CI/CD",\n'
            '    "benefits": "Lương tháng 13, BHXH, BHYT, BHTN. 12 ngày phép/năm. Du lịch 1 lần/năm"\n'
            "  }\n"
            "}\n\n"
            "Output:\n"
            "{\n"
            '  "job_001": {\n'
            '    "job_description": [\n'
            '      "Quản lý hệ thống web/app server, Storage",\n'
            '      "Tối ưu chi phí, performance, scaling ứng dụng",\n'
            '      "Nghiên cứu công nghệ mới"\n'
            '    ],\n'
            '    "requirements": [\n'
            '      "Từ 2 năm kinh nghiệm DevOps",\n'
            '      "Có kinh nghiệm Kubernetes, docker",\n'
            '      "Hiểu CI/CD"\n'
            '    ],\n'
            '    "benefits": [\n'
            '      "Lương tháng 13",\n'
            '      "BHXH, BHYT, BHTN",\n'
            '      "12 ngày phép/năm",\n'
            '      "Du lịch 1 lần/năm"\n'
            '    ]\n'
            "  }\n"
            "}\n"
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
        normalized = preprocess_jd_text(text)
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
    def _calc_similarity_score(cls, query: str, raw: dict) -> float:
        meta = raw.get("metadata", {})
        distance = raw.get("distance")
        semantic_score = 1 - distance if distance is not None else 0.0
        title_score = cls._title_match_score(query, meta.get("title", ""))

        # Skill and keyword match score
        skill_score = 0.0
        normalized_query = cls._normalize_text(query)
        if normalized_query:
            skills_list = [cls._normalize_text(s) for s in meta.get("required_skills", "").split(",") if s.strip()]
            keywords_list = [cls._normalize_text(k) for k in meta.get("keywords", "").split(",") if k.strip()]
            if normalized_query in skills_list or normalized_query in keywords_list:
                skill_score = 0.90
            else:
                query_tokens = set(re.findall(r"[\w]+", normalized_query))
                for skill in skills_list:
                    skill_tokens = set(re.findall(r"[\w]+", skill))
                    if query_tokens and skill_tokens and query_tokens.issubset(skill_tokens):
                        skill_score = 0.80
                        break

        return round(max(semantic_score, title_score, skill_score), 4)

    @classmethod
    def _score_threshold_for_query(cls, query: str) -> float:
        return cls.SHORT_QUERY_SCORE_THRESHOLD if cls._is_short_query(query) else cls.DEFAULT_SCORE_THRESHOLD

    @classmethod
    def _is_short_query(cls, query: str) -> bool:
        normalized = cls._normalize_text(query)
        return len(normalized.split()) <= 1 or len(normalized) <= 10
