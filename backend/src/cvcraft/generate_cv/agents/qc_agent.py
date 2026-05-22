"""
Quality Control Agent - Layer 3.
Chấm điểm CV trên 3 tiêu chí và quyết định có cần revision không.
"""
from cvcraft.generate_cv.core.state import CVAgentState, QualityScore
from cvcraft.generate_cv.infrastructure.llm.factory import LLMFactory, call_with_structured_output


SYSTEM_PROMPT = """Bạn là chuyên gia tuyển dụng senior, chấm điểm CV nghiêm khắc nhưng công bằng.

Chấm 3 tiêu chí trên thang 0-10:

1. ATS_SCORE (compatibility với hệ thống Applicant Tracking System):
   - Mật độ keywords từ JD trong CV (40%)
   - Cấu trúc rõ ràng, dễ parse (30%)
   - Dùng đúng terminology của ngành (30%)

2. JD_MATCH_SCORE (độ phù hợp với JD):
   - Kinh nghiệm match với requirements (40%)
   - Skills cover được JD (30%)
   - Summary thể hiện đúng giá trị JD cần (20%)
   - Level seniority phù hợp (10%)

3. LINGUISTIC_SCORE (chất lượng ngôn ngữ):
   - Bullets có dùng STAR + lượng hóa (40%)
   - Động từ mạnh ở đầu bullet (20%)
   - Ngữ pháp, chính tả (20%)
   - Không có cliché, fluff word (20%)

OVERALL_SCORE = average của 3 điểm trên.

FEEDBACK: Liệt kê 3-5 điểm CỤ THỂ cần cải thiện. Format:
- "[Section] vấn đề cụ thể -> hướng sửa"

NEEDS_REVISION = True nếu overall_score < 7.0, ngược lại False."""


def qc_agent_node(state: CVAgentState) -> dict:
    if not state.cv_draft:
        return {"messages": ["[QC Agent] Không có CV draft để chấm"]}

    llm = LLMFactory.get_llm(tier="cheap")

    draft = state.cv_draft
    cv_parts = []

    if draft.summary:
        cv_parts.append(f"=== SUMMARY ===\n{draft.summary}\n")

    if draft.experiences:
        cv_parts.append("=== EXPERIENCE ===")
        for exp in draft.experiences:
            cv_parts.append(f"\n{exp.position} | {exp.company} | {exp.start_date} - {exp.end_date or 'Present'}")
            for bullet in exp.bullets:
                cv_parts.append(f"  • {bullet}")

    if draft.skills_categorized:
        cv_parts.append("\n=== SKILLS ===")
        for cat, skills in draft.skills_categorized.items():
            cv_parts.append(f"{cat}: {', '.join(skills)}")

    cv_text = "\n".join(cv_parts)

    jd_text = ""
    if state.job_requirement:
        jd = state.job_requirement
        jd_text = f"""
=== JOB DESCRIPTION CONTEXT ===
Position: {jd.job_title}
Level: {jd.seniority_level}
Required skills: {', '.join(jd.required_skills)}
Keywords: {', '.join(jd.keywords)}
"""

    user_msg = f"{jd_text}\n\n=== CV CẦN CHẤM ===\n{cv_text}\n\nChấm điểm và đưa feedback."

    try:
        score = call_with_structured_output(
            llm=llm,
            output_schema=QualityScore,
            system_prompt=SYSTEM_PROMPT,
            user_message=user_msg,
        )

        if state.revision_count >= state.max_revisions:
            score.needs_revision = False

        return {
            "quality_score": score,
            "revision_count": state.revision_count + 1,
            "messages": [
                f"[QC Agent] Overall: {score.overall_score:.1f}/10 "
                f"(ATS: {score.ats_score:.1f}, JD: {score.jd_match_score:.1f}, Ling: {score.linguistic_score:.1f}). "
                f"Revision: {'Yes' if score.needs_revision else 'No'}"
            ],
        }
    except Exception as e:
        return {"messages": [f"[QC Agent] Lỗi: {str(e)}"]}
