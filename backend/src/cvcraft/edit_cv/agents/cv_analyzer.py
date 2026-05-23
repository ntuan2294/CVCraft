"""
CV Analyzer Agent — mirrors the summary_agent + experience_agent + qc_agent pipeline of gen-cv.

Pipeline:
  1. parse_jd()          → JobRequirement  (job_title, industry, seniority_level, keywords…)
  2. extract_cv_info()   → CVProfile       (candidate background, skills, experiences…)
  3. RAG retrieval       → similar CVs from same industry + seniority (identical filter logic as gen-cv)
  4. LLM analysis        → EditCVAnalysis  (evaluation, suggestions, score)

The RAG retrieval now uses the full 3-field filter (job_title + industry + seniority_level)
exactly as experience_agent_node and summary_agent_node do in gen-cv.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pydantic import BaseModel, Field

from cvcraft.generate_cv.core.state import JobRequirement
from cvcraft.generate_cv.agents.jd_analyzer import parse_jd       # reuse gen-cv agent directly
from cvcraft.generate_cv.rag.retriever import RAGRetriever
from cvcraft.infrastructure.llm.factory import LLMFactory, call_with_structured_output
from cvcraft.edit_cv.agents.cv_info_extractor import CVProfile, extract_cv_info


class EditCVAnalysis(BaseModel):
    evaluation: str = Field(description="Nhận xét tổng thể về CV (2-4 đoạn tiếng Việt)")
    suggestions: list[str] = Field(description="5-8 gợi ý cụ thể, actionable để cải thiện CV")
    score: int = Field(description="Điểm tổng thể 0-100", ge=0, le=100)


_SYSTEM_PROMPT = """Bạn là chuyên gia tuyển dụng và viết CV với 15 năm kinh nghiệm.

Nhiệm vụ: Đánh giá CV của ứng viên dựa trên JD đã được phân tích, thông tin trích xuất từ CV,
và các CV mẫu chất lượng cao từ cùng ngành nghề / cấp độ kinh nghiệm.

Thang điểm (tổng 100):
- Mức độ phù hợp với JD        (30đ): kỹ năng, kinh nghiệm, years of experience
- Chất lượng nội dung           (30đ): STAR method, số liệu cụ thể, động từ mạnh, tránh cliche
- Cấu trúc & trình bày          (20đ): bố cục rõ ràng, thứ tự ưu tiên đúng, dễ scan
- Tính chuyên nghiệp            (20đ): ngôn ngữ nhất quán, tông văn phù hợp, không lỗi

Quy tắc trả lời:
1. evaluation (2-4 đoạn tiếng Việt): điểm mạnh → điểm yếu → tổng kết khuyến nghị
2. suggestions (5-8 mục): mỗi mục bắt đầu bằng động từ hành động, chỉ rõ "phần nào" và "sửa thế nào"
3. score: số nguyên 0-100
4. KHÔNG bịa đặt thông tin không có trong CV hoặc JD
5. Tham khảo CV mẫu để biết tiêu chuẩn chất lượng của ngành — KHÔNG copy nội dung
6. Ưu tiên gợi ý chỉnh sửa nội dung thực có trong CV, không yêu cầu thêm danh sách từ khóa riêng"""


def analyze_cv(cv_text: str, jd_text: str) -> tuple[EditCVAnalysis, JobRequirement, CVProfile]:
    """
    Full analysis pipeline mirroring gen-cv agent flow.

    Returns (analysis, jd_req, cv_profile) so the service can keep useful
    metadata while rewriting CV text with the original format preserved.
    """
    # Step 1: Parse JD and CV in parallel (mirrors jd_analyzer + user_profile running in parallel)
    jd_req: JobRequirement
    cv_profile: CVProfile

    with ThreadPoolExecutor(max_workers=2) as pool:
        f_jd = pool.submit(parse_jd, jd_text)
        f_cv = pool.submit(extract_cv_info, cv_text)
        jd_req = f_jd.result()
        cv_profile = f_cv.result()

    # Step 2: RAG retrieval — same 3-field filter as gen-cv's summary_agent + experience_agent
    rag_context = _retrieve_rag_context(jd_req)

    # Step 3: LLM analysis
    user_message = _build_prompt(jd_req, cv_profile, cv_text, rag_context)
    llm = LLMFactory.get_llm("strong")
    analysis = call_with_structured_output(llm, EditCVAnalysis, _SYSTEM_PROMPT, user_message)

    return analysis, jd_req, cv_profile


def _retrieve_rag_context(jd_req: JobRequirement) -> str:
    """
    RAG retrieval using full 3-field filter: job_title + industry + seniority_level.
    Identical to how summary_agent_node and experience_agent_node work in gen-cv.
    """
    try:
        retriever = RAGRetriever()

        # Retrieve both summary and bullet examples — parallel for speed
        with ThreadPoolExecutor(max_workers=2) as pool:
            f_summaries = pool.submit(
                retriever.retrieve_summary_examples,
                jd_req.job_title,
                " ".join(jd_req.keywords[:5]),
                jd_req.industry,
                jd_req.seniority_level,
                2,  # n_results
            )
            f_bullets = pool.submit(
                retriever.retrieve_bullet_examples,
                jd_req.job_title,
                " ".join(jd_req.required_skills[:5]),
                jd_req.industry,
                jd_req.seniority_level,
                3,  # n_results
            )
            summaries = f_summaries.result()
            bullets = f_bullets.result()

        parts = []
        if summaries:
            parts.append(RAGRetriever.format_examples_for_prompt(summaries, "summary"))
        if bullets:
            parts.append(RAGRetriever.format_examples_for_prompt(bullets, "bullet"))
        return "\n".join(parts)

    except Exception:
        return ""


def _build_prompt(jd_req: JobRequirement, cv_profile: CVProfile, cv_text: str, rag_context: str) -> str:
    parts = []

    if rag_context:
        parts.append(rag_context)

    # Structured JD info (mirrors how jd_req is used in summary_agent)
    parts.append("=== THÔNG TIN JD ĐÃ PHÂN TÍCH ===")
    parts.append(f"Vị trí: {jd_req.job_title}")
    parts.append(f"Ngành: {jd_req.industry or 'không xác định'}")
    parts.append(f"Cấp độ: {jd_req.seniority_level or 'không xác định'}")
    parts.append(f"Yêu cầu kinh nghiệm: {jd_req.years_experience or 'không nêu rõ'} năm")
    parts.append(f"Kỹ năng bắt buộc: {', '.join(jd_req.required_skills) or 'không nêu rõ'}")
    parts.append(f"Kỹ năng ưu tiên: {', '.join(jd_req.preferred_skills) or 'không có'}")
    parts.append(f"Từ khóa/bối cảnh quan trọng trong JD: {', '.join(jd_req.keywords[:15]) or 'không có'}")

    # Structured CV info (mirrors how user_profile is used in summary_agent)
    parts.append("\n=== THÔNG TIN CV ĐÃ TRÍCH XUẤT ===")
    parts.append(f"Ứng viên: {cv_profile.candidate_name or 'không xác định'}")
    parts.append(f"Vị trí hiện tại: {cv_profile.current_position}")
    parts.append(f"Ngành: {cv_profile.industry or 'không xác định'}")
    parts.append(f"Cấp độ: {cv_profile.seniority_level or 'không xác định'}")
    parts.append(f"Tổng kinh nghiệm: {cv_profile.total_years_experience or 'không rõ'} năm")
    parts.append(f"Kỹ năng: {', '.join(cv_profile.skills[:20]) or 'không có'}")
    if cv_profile.notable_achievements:
        parts.append(f"Thành tích nổi bật: {'; '.join(cv_profile.notable_achievements[:5])}")

    # Work experience summary
    if cv_profile.work_experiences:
        parts.append("Kinh nghiệm làm việc:")
        for exp in cv_profile.work_experiences[:4]:
            dur = f" ({exp.duration_years:.1f} năm)" if exp.duration_years else ""
            skills = f" — {', '.join(exp.key_skills[:5])}" if exp.key_skills else ""
            parts.append(f"  • {exp.position} tại {exp.company}{dur}{skills}")

    # Full CV text for context
    parts.append("\n=== NỘI DUNG CV ĐẦY ĐỦ ===")
    parts.append(cv_text[:4000])

    parts.append(
        "\nDựa trên các thông tin trên, hãy đánh giá CV và trả về JSON "
        "với đúng schema (evaluation, suggestions, score)."
    )
    return "\n".join(parts)
