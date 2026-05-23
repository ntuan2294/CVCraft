"""
Service layer cho tính năng RAG JD Search.
Orchestrates: vector search (score >= 0.5) -> reconstruct JDDocument -> format JD sections.
"""
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import re
from threading import Lock
import time

from pydantic import BaseModel, Field

from cvcraft.jd_search.core.models import JDDocument, JDRewrittenSections, JDSearchResult, JDSearchResponse, JDCardResult, JDSearchCardResponse, JDFormattedDetail
from cvcraft.jd_search.infrastructure.llm.factory import LLMFactory, call_with_structured_output
from cvcraft.jd_search.rag.vector_store import JDVectorStore
from cvcraft.jd_search.rag.indexing.jd_indexer import index_jd_samples
from cvcraft.jd_search.text_preprocessing import preprocess_jd_text


class FormattedJDSections(BaseModel):
    job_description: list[str] = Field(
        description=(
            "Danh sach cac y rieng trong truong job_description. Moi item la mot nhiem vu, "
            "trach nhiem hoac pham vi cong viec cu the; khong chua bullet prefix, heading, "
            "newline hay thong tin thuoc requirements/benefits."
        ),
    )
    requirements: list[str] = Field(
        description=(
            "Danh sach cac y rieng trong truong requirements. Moi item la mot yeu cau ve "
            "kinh nghiem, hoc van, ky nang, ngon ngu, chung chi, thai do hoac dieu kien lam viec; "
            "giu cum cong nghe lien quan trong cung item khi chung tao thanh mot yeu cau."
        ),
    )
    benefits: list[str] = Field(
        description=(
            "Danh sach cac y rieng trong truong benefits. Moi item la mot phuc loi, che do, "
            "thu nhap, thuong, bao hiem, dao tao, nghi phep, moi truong hoac co hoi phat trien."
        ),
    )


class FormattedJDItem(FormattedJDSections):
    id: str = Field(description="ID cua JD input, phai giu nguyen y het gia tri duoc cung cap.")


class FormattedJDBatch(BaseModel):
    items: list[FormattedJDItem] = Field(
        description=(
            "Danh sach ket qua da format. Moi input JD phai co dung mot item output cung id."
        ),
    )


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
    _ACTION_STARTERS = (
        "Phân tích",
        "Theo dõi",
        "Đánh giá",
        "Đề xuất",
        "Xác định",
        "Đọc hiểu",
        "Phát hiện",
        "Sử dụng",
        "Truy vấn",
        "Xử lý",
        "Làm sạch",
        "Chuẩn hóa",
        "Hạn chế",
        "Kiểm soát",
        "Báo cáo",
        "Hỗ trợ",
        "Xây dựng",
        "Trình bày",
        "Đưa ra",
        "Quản lý",
        "Tối ưu",
        "Nghiên cứu",
        "Tham gia",
        "Phối hợp",
        "Triển khai",
        "Thiết kế",
        "Phát triển",
        "Vận hành",
        "Đảm bảo",
        "Lập",
        "Kênh bán hàng",
        "Chi nhánh/cơ sở",
        "Thời gian",
        "Phân khúc khách hàng",
        "Hành vi mua",
        "Tần suất",
        "Chỉ số mới",
        "Cách thu thập dữ liệu",
        "Hướng phân tích",
    )
    _SECTION_HEADINGS = {
        "mo ta cong viec",
        "mota cong viec",
        "job description",
        "responsibilities",
        "yeu cau",
        "yeu cau cong viec",
        "requirements",
        "phuc loi",
        "quyen loi",
        "benefits",
        "che do dai ngo",
        "de xuat",
    }

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
        system_prompt = """
Bạn là bộ chuẩn hóa dữ liệu tuyển dụng cho dataset `tinixai/vietnamese-job-descriptions`.
Dataset này có các trường nguồn dạng chuỗi dài: `job_description`, `benefits`, `requirements`.
Nội dung có thể là tiếng Việt, tiếng Anh hoặc trộn hai ngôn ngữ; có thể null/rỗng; có thể chứa
heading dính với nội dung như `Nội dung công việc:`, `Phúc lợi:`, `Yêu cầu:`,
`Responsibilities:`, `Qualifications`, `Compensation & Benefits`; có thể dùng bullet `-`, `+`,
`•`; có thể dùng dấu chấm để nối nhiều ý trong một dòng; có thể chứa danh sách công nghệ,
ngày lễ, bảo hiểm hoặc package lương.

Nhiệm vụ duy nhất: chuyển từng JD input thành đúng 3 mảng string:
`job_description`, `requirements`, `benefits`.

## Phân loại trường
- `job_description`: nhiệm vụ, trách nhiệm, phạm vi công việc, hoạt động hằng ngày, sản phẩm/dự án,
  báo cáo, phối hợp, vận hành, thiết kế, phát triển, kiểm thử, phân tích, tối ưu, hỗ trợ.
- `requirements`: kinh nghiệm, học vấn, kỹ năng cứng/mềm, công nghệ, ngôn ngữ, chứng chỉ,
  độ tuổi, giới tính nếu input có, khả năng đi lại/làm thêm giờ, điều kiện ứng tuyển.
- `benefits`: lương, thưởng, bảo hiểm, nghỉ phép, khám sức khỏe, đào tạo, thiết bị làm việc,
  remote/hybrid, teambuilding, du lịch, môi trường, cơ hội thăng tiến, phụ cấp, event công ty.

Không chuyển ý sang mảng khác nếu trường nguồn đã đúng ngữ cảnh. Chỉ di chuyển khi nội dung rõ ràng
bị đặt nhầm trường, ví dụ `requirements` chứa đoạn bắt đầu bằng `Phúc lợi:` hoặc `benefits` chứa
`Yêu cầu:`.

## Quy tắc tách ý
Một item output phải là một ý độc lập, thường 5-25 từ. Bắt buộc tách nếu một string chứa nhiều
nhiệm vụ/yêu cầu/phúc lợi.

Tách tại các ranh giới sau:
1. Bullet hoặc số thứ tự: `-`, `+`, `*`, `•`, `1.`, `1)`, `1:`.
2. Xuống dòng.
3. Dấu chấm, chấm phẩy hoặc dấu hai chấm khi phía sau là một ý mới.
4. Các heading/label: `Mô tả công việc`, `Nội dung công việc`, `Yêu cầu`, `Yêu cầu công việc`,
   `Phúc lợi`, `Quyền lợi`, `Chế độ đãi ngộ`, `Responsibilities`, `Key Responsibilities`,
   `Qualifications`, `Requirements`, `Benefits`, `Compensation & Benefits`.
5. Các cụm bắt đầu bằng động từ hoặc danh từ hành động độc lập, ví dụ: `Tham gia`, `Phối hợp`,
   `Phát triển`, `Thiết kế`, `Xây dựng`, `Bảo trì`, `Tối ưu`, `Quản lý`, `Theo dõi`,
   `Đảm bảo`, `Hỗ trợ`, `Nghiên cứu`, `Báo cáo`, `Đọc hiểu`, `Kiểm soát`.
6. Dấu phẩy chỉ khi vế sau là một phúc lợi/yêu cầu độc lập, ví dụ `Lương tháng 13, thưởng dự án,
   BHXH, BHYT` có thể tách thành các phúc lợi riêng.

Không tách trong các trường hợp sau:
- Thuật ngữ hoặc chức danh có gạch nối: `DevOps`, `Dev-Ops`, `Dev - Ops`, `Full-stack`,
  `Front-end`, `Back-end`, `Wi-Fi`, `CI/CD`, `CI - CD`.
- Danh sách công nghệ thuộc cùng một yêu cầu: `Python / Java / NodeJS / PHP`,
  `ReactJS, Angular, VueJS`, `Docker, Gitlab CI/CD, AWS`.
- Danh sách bảo hiểm đi cùng nhau: `BHXH, BHYT, BHTN`.
- Danh sách trong ngoặc hoặc ví dụ: `(automation, recommendation, data tracking, v.v.)`.
- Mốc ngày/ngày lễ: `1/1, 30/4, 2/9`.
- Cụm lương/thưởng là một package liền mạch: `15 - 35 triệu`, `1,000 ~ 1,400 USD`.

## Quy tắc làm sạch
- Không thêm thông tin không có trong input.
- Không dịch ngôn ngữ; input tiếng Anh thì giữ tiếng Anh, tiếng Việt thì giữ tiếng Việt.
- Không suy diễn số năm kinh nghiệm, công nghệ, mức lương, địa điểm.
- Được phép sửa lỗi chính tả, lỗi viết hoa/viết thường và lỗi spacing rõ ràng do dữ liệu bị tách sai.
- Ghép lại thuật ngữ công nghệ/chức danh bị tách sai, ví dụ `Dev` + `Ops` -> `DevOps`,
  `Dev - Ops` -> `DevOps`, `Front - end` -> `front-end`, `Back - end` -> `back-end`,
  `Full - stack` -> `full-stack`, `Wi - Fi` -> `Wi-Fi`, `CI - CD` -> `CI/CD`,
  `Postgre` + `SQL` -> `PostgreSQL`, `My` + `SQL` -> `MySQL`,
  `No` + `SQL` -> `NoSQL`, `Java` + `Script` -> `JavaScript`.
- Sửa các lỗi gõ phổ biến nhưng không đổi nghĩa, ví dụ `hạ tầng Dev Ops` -> `hạ tầng DevOps`,
  `kĩ thuật` -> `kỹ thuật`, `chuẩn hoá` -> `chuẩn hóa` khi cùng ngôn ngữ.
- Bỏ heading/label section khỏi item output.
- Bỏ bullet prefix và số thứ tự đầu dòng.
- Chuẩn hóa khoảng trắng; không để `\\n`, `\\r`, `\\t` trong string.
- Không để item rỗng, không kết thúc item bằng `:`, `;`, `,`.
- Loại item trùng lặp trong cùng một mảng, giữ thứ tự xuất hiện đầu tiên.

## JSON schema bắt buộc
Trả về đúng schema Pydantic `FormattedJDBatch`:
{
  "items": [
    {
      "id": "giữ nguyên ID input",
      "job_description": ["mỗi item là một nhiệm vụ/trách nhiệm"],
      "requirements": ["mỗi item là một yêu cầu"],
      "benefits": ["mỗi item là một phúc lợi"]
    }
  ]
}

Mỗi input JD phải có đúng một object trong `items`. Trường rỗng/null thì trả về mảng rỗng.
Chỉ trả về JSON hợp lệ theo schema, không markdown, không giải thích.

## Ví dụ
Input:
ID: jd_hf_1
job_description:
Công ty vốn Nhật chuyên cung cấp dịch vụ điện toán đám mây (SaaS) Nội dung công việc:Phát triển hệ thống quản lý chi phí và công tác phí dành cho các doanh nghiệp đang được sử dụng tại Nhật Bản - Nâng cao và cải thiện chất lượng sản phẩm - Nâng cao kỹ năng chuyên môn để có cơ hội thử thách trở thành Team Leader trong tương lai

requirements:
Yêu cầu: - Từ 25 ~ 39 tuổi - Trên 3 năm kinh nghiệm về kiến thức và đam mê lập trình ứng dụng web với: + JavaScript, jQuery. + Các Frameworks như Spring hay Struts, Seasar2, Hibernate,.. + Ngôn ngữ: Java + PostgreSQL, MySQL... - Có khả năng research để giải quyết các vấn đề về kĩ thuật.

benefits:
Lương: 1,000 ~ 1,400 USD (Gross) Phúc lợi: - Bảo Hiểm xã hội đóng trên Full lương Hợp đồng - Du lịch Công ty hàng năm, tài trợ 50% chi phí tour cho gia đình nhân viên - Lương tháng 13+14

Output:
{
  "items": [
    {
      "id": "jd_hf_1",
      "job_description": [
        "Công ty vốn Nhật chuyên cung cấp dịch vụ điện toán đám mây (SaaS)",
        "Phát triển hệ thống quản lý chi phí và công tác phí dành cho các doanh nghiệp đang được sử dụng tại Nhật Bản",
        "Nâng cao và cải thiện chất lượng sản phẩm",
        "Nâng cao kỹ năng chuyên môn để có cơ hội thử thách trở thành Team Leader trong tương lai"
      ],
      "requirements": [
        "Từ 25 ~ 39 tuổi",
        "Trên 3 năm kinh nghiệm lập trình ứng dụng web",
        "Có kinh nghiệm JavaScript, jQuery",
        "Có kinh nghiệm Spring, Struts, Seasar2, Hibernate",
        "Có kinh nghiệm Java",
        "Có kinh nghiệm PostgreSQL, MySQL",
        "Có khả năng research để giải quyết các vấn đề kỹ thuật"
      ],
      "benefits": [
        "Lương 1,000 ~ 1,400 USD (Gross)",
        "Bảo hiểm xã hội đóng trên full lương hợp đồng",
        "Du lịch công ty hàng năm, tài trợ 50% chi phí tour cho gia đình nhân viên",
        "Lương tháng 13+14"
      ]
    }
  ]
}
"""
        blocks = []
        for result, cache_key in pending:
            job_description, requirements, benefits = cache_key
            blocks.append(
                f"ID: {result.jd.id}\n"
                f"job_description:\n{job_description}\n\n"
                f"requirements:\n{requirements}\n\n"
                f"benefits:\n{benefits}"
            )
        user_message = (
            "Format các JD sau thành `FormattedJDBatch`. Giữ nguyên ID, trả về đủ 3 mảng cho "
            "từng JD theo đúng schema.\n\n"
            + "\n\n---\n\n".join(blocks)
        )
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

    @classmethod
    def _split_sentences(cls, text: str) -> list[str]:
        if len(text) < 60:
            return [text]
        parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-Ỹ0-9])", text)
        if len(parts) == 1:
            return cls._split_compound_item(text)
        split_parts: list[str] = []
        for part in parts:
            split_parts.extend(cls._split_compound_item(part))
        return [p.strip() for p in split_parts if p.strip()]

    @classmethod
    def _split_compound_item(cls, text: str) -> list[str]:
        text = cls._normalize_tech_hyphen_terms(text)
        text = re.sub(r"\s+", " ", text).strip(" \t\r\n:;,")
        if not text:
            return []

        starters = "|".join(re.escape(starter) for starter in cls._ACTION_STARTERS)
        text = re.sub(r"\bđể:\s+", "để ", text, flags=re.IGNORECASE)
        text = re.sub(rf"(?<!^)\s+(?=(?:{starters})\b)", "\n", text)
        text = re.sub(r"[:;]\s+(?=[A-ZÀ-Ỹ0-9])", "\n", text)
        text = re.sub(r",\s+(?=(?:thưởng|BHXH|BHYT|BHTN|bảo hiểm|du lịch|nghỉ phép)\b)", "\n", text, flags=re.IGNORECASE)

        items: list[str] = []
        for part in text.split("\n"):
            part = cls._normalize_bullet_item(part)
            if part:
                items.append(part)
        return items or [text]

    @staticmethod
    def _normalize_tech_hyphen_terms(text: str) -> str:
        replacements = (
            (r"\bdev\s*-\s*ops\b", "DevOps"),
            (r"\bdev\s+ops\b", "DevOps"),
            (r"\bdev\s*-\s*sec\s*-\s*ops\b", "DevSecOps"),
            (r"\bdev\s+sec\s+ops\b", "DevSecOps"),
            (r"\bfull\s*-\s*stack\b", "full-stack"),
            (r"\bfull\s+stack\b", "full-stack"),
            (r"\bfront\s*-\s*end\b", "front-end"),
            (r"\bfront\s+end\b", "front-end"),
            (r"\bback\s*-\s*end\b", "back-end"),
            (r"\bback\s+end\b", "back-end"),
            (r"\bwi\s*-\s*fi\b", "Wi-Fi"),
            (r"\bwi\s+fi\b", "Wi-Fi"),
            (r"\bci\s*-\s*cd\b", "CI/CD"),
            (r"\bci\s+cd\b", "CI/CD"),
            (r"\bpostgre\s+sql\b", "PostgreSQL"),
            (r"\bmy\s+sql\b", "MySQL"),
            (r"\bno\s+sql\b", "NoSQL"),
            (r"\bjava\s+script\b", "JavaScript"),
            (r"\btype\s+script\b", "TypeScript"),
        )
        for pattern, replacement in replacements:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text

    @classmethod
    def _normalize_bullet_item(cls, item: str) -> str:
        item = cls._normalize_tech_hyphen_terms(item)
        line = re.sub(r"\s+", " ", item).strip()
        line = re.sub(r"^[-+*•·●▪►★✓✔]+\s*", "", line).strip()
        line = re.sub(r"^\d+[.)]\s*", "", line).strip()
        line = line.strip(" \t\r\n:;,")
        if not line:
            return ""

        heading_key = cls._strip_vietnamese_accents(line.casefold())
        heading_key = re.sub(r"[^a-z0-9 ]+", " ", heading_key)
        heading_key = re.sub(r"\s+", " ", heading_key).strip()
        if heading_key in cls._SECTION_HEADINGS:
            return ""
        return line

    @staticmethod
    def _strip_vietnamese_accents(value: str) -> str:
        chars = {
            "à": "a", "á": "a", "ạ": "a", "ả": "a", "ã": "a",
            "â": "a", "ầ": "a", "ấ": "a", "ậ": "a", "ẩ": "a", "ẫ": "a",
            "ă": "a", "ằ": "a", "ắ": "a", "ặ": "a", "ẳ": "a", "ẵ": "a",
            "è": "e", "é": "e", "ẹ": "e", "ẻ": "e", "ẽ": "e",
            "ê": "e", "ề": "e", "ế": "e", "ệ": "e", "ể": "e", "ễ": "e",
            "ì": "i", "í": "i", "ị": "i", "ỉ": "i", "ĩ": "i",
            "ò": "o", "ó": "o", "ọ": "o", "ỏ": "o", "õ": "o",
            "ô": "o", "ồ": "o", "ố": "o", "ộ": "o", "ổ": "o", "ỗ": "o",
            "ơ": "o", "ờ": "o", "ớ": "o", "ợ": "o", "ở": "o", "ỡ": "o",
            "ù": "u", "ú": "u", "ụ": "u", "ủ": "u", "ũ": "u",
            "ư": "u", "ừ": "u", "ứ": "u", "ự": "u", "ử": "u", "ữ": "u",
            "ỳ": "y", "ý": "y", "ỵ": "y", "ỷ": "y", "ỹ": "y",
            "đ": "d",
        }
        return "".join(chars.get(char, char) for char in value)

    @classmethod
    def _text_to_bullets(cls, text: str) -> list[str]:
        if not text or not text.strip():
            return []
        normalized = preprocess_jd_text(text)
        normalized = cls._normalize_tech_hyphen_terms(normalized)
        normalized = re.sub(r"\s*[•·●]\s*", "\n", normalized)
        normalized = re.sub(r"(?<!\S)[+*]\s+", "\n", normalized)
        normalized = re.sub(r"\s+-\s+", "\n", normalized)
        lines = []
        for raw_line in normalized.splitlines():
            line = cls._normalize_bullet_item(raw_line)
            if not line:
                continue
            if len(line) > 120:
                lines.extend(cls._split_sentences(line))
            else:
                lines.extend(cls._split_compound_item(line))
        return lines

    @classmethod
    def _clean_bullet_items(cls, items: list[str]) -> list[str]:
        cleaned: list[str] = []
        for item in items:
            line = cls._normalize_bullet_item(item)
            if not line:
                continue
            if len(line) > 120:
                cleaned.extend(cls._split_sentences(line))
            else:
                cleaned.extend(cls._split_compound_item(line))
        return cls._merge_split_tech_terms(cleaned)

    @staticmethod
    def _merge_split_tech_terms(items: list[str]) -> list[str]:
        merged: list[str] = []
        index = 0
        while index < len(items):
            current = items[index].strip()
            next_item = items[index + 1].strip() if index + 1 < len(items) else ""
            if current.endswith(" Dev") and next_item.rstrip(".").casefold() == "ops":
                merged.append(f"{current[:-4]} DevOps".strip())
                index += 2
                continue
            if current.casefold() == "dev" and next_item.rstrip(".").casefold() == "ops":
                merged.append("DevOps")
                index += 2
                continue
            if next_item and JDSearchService._should_join_split_tech_fragment(current, next_item):
                current = f"{current}{next_item}"
                index += 2
                while index < len(items) and JDSearchService._should_join_split_tech_fragment(current, items[index].strip()):
                    current = f"{current}{items[index].strip()}"
                    index += 1
                merged.append(JDSearchService._normalize_tech_hyphen_terms(current))
                continue
            merged.append(current)
            index += 1
        return merged

    @staticmethod
    def _should_join_split_tech_fragment(current: str, next_item: str) -> bool:
        current_tail = current.rstrip(" .,:;").casefold()
        next_head = next_item.lstrip(" .,:;").casefold()
        split_pairs = (
            ("postgre", "sql"),
            ("my", "sql"),
            ("no", "sql"),
            ("java", "script"),
            ("type", "script"),
        )
        if any(current_tail.endswith(left) and next_head.startswith(right) for left, right in split_pairs):
            return True
        if current_tail.endswith(("/my", "/no", "/postgre")) and next_head.startswith("sql"):
            return True
        if current_tail.endswith("/java") and next_head.startswith("script"):
            return True
        if current_tail.endswith("/type") and next_head.startswith("script"):
            return True
        return False

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
