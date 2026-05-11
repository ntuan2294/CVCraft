"""
Experience Agent - Layer 2.
Quan trọng nhất - viết bullet points STAR cho từng kinh nghiệm.
Dùng strong model.
"""
from pydantic import BaseModel, Field
from state import CVAgentState, CVDraft, WorkExperience
from llm import LLMFactory, call_with_structured_output

try:
    from rag import RAGRetriever
    _RAG_AVAILABLE = True
except ImportError:
    _RAG_AVAILABLE = False


class BulletPointsOutput(BaseModel):
    """Schema cho output của agent."""
    bullets: list[str] = Field(description="3-5 bullet points theo phương pháp STAR")


SYSTEM_PROMPT = """Bạn là CV writer chuyên nghiệp, chuyên viết bullet points cho phần Experience.

Phương pháp STAR (bắt buộc áp dụng cho MỖI bullet):
- S/T (Situation/Task): bối cảnh ngắn gọn (ngầm trong câu)
- A (Action): hành động cụ thể với động từ mạnh ở đầu câu
- R (Result): kết quả LƯỢNG HÓA (số liệu, %, thời gian, quy mô)

Công thức bullet point: [Động từ mạnh] + [Object cụ thể] + [Method/Tool] + [Result lượng hóa]

Ví dụ TỐT:
✓ "Architected microservices system using Node.js and Kubernetes, reducing API latency by 40% and supporting 2M+ daily requests"
✓ "Led team of 5 engineers to migrate legacy monolith to AWS, completing 3 months ahead of schedule and saving $120K/year in infrastructure cost"

Ví dụ XẤU (tránh):
✗ "Responsible for backend development" (không có action mạnh, không có result)
✗ "Worked on improving system performance" (chung chung, không lượng hóa)
✗ "Helped team with various tasks" (yếu, mơ hồ)

Quy tắc bổ sung:
1. 3-5 bullets mỗi kinh nghiệm (job càng cũ, bullets càng ít)
2. Bullet đầu tiên luôn là thành tựu IMPACT nhất
3. Dùng quá khứ cho job đã nghỉ, hiện tại cho job đang làm
4. Lồng keywords từ JD một cách tự nhiên
5. Nếu user không cung cấp số liệu cụ thể, ESTIMATE hợp lý dựa trên scope (ví dụ "team of ~5", "improved performance significantly")
6. KHÔNG bịa số liệu cụ thể nếu user không nói (không viết "increased revenue by 47%" nếu user không nói)

Động từ mạnh nên dùng: Architected, Led, Spearheaded, Optimized, Streamlined, Implemented, Delivered, Scaled, Orchestrated, Pioneered, Reduced, Increased, Designed, Built, Migrated, Automated."""


def experience_agent_node(state: CVAgentState) -> dict:
    """
    Viết bullets cho TẤT CẢ work experiences.
    """
    if not state.user_profile or not state.user_profile.work_experiences:
        return {"messages": ["[Experience Agent] Không có kinh nghiệm để xử lý"]}

    llm = LLMFactory.get_llm(tier="strong")
    jd_keywords = []
    if state.job_requirement:
        jd_keywords = state.job_requirement.keywords + state.job_requirement.required_skills

    # Khởi tạo RAG retriever một lần cho cả node
    retriever = None
    if _RAG_AVAILABLE:
        try:
            r = RAGRetriever()
            if not r.store.is_empty():
                retriever = r
        except Exception:
            pass

    updated_experiences = []
    for exp in state.user_profile.work_experiences:
        user_msg_parts = [
            f"Vị trí: {exp.position}",
            f"Công ty: {exp.company}",
            f"Thời gian: {exp.start_date} - {exp.end_date or 'Hiện tại'}",
            f"Mô tả thô từ user:",
            exp.raw_description,
        ]

        if jd_keywords:
            user_msg_parts.append(f"\nKeywords từ JD cần lồng ghép tự nhiên: {', '.join(jd_keywords[:10])}")

        # RAG: thêm bullet examples tương tự vị trí này
        if retriever:
            try:
                seniority = (state.job_requirement.seniority_level or "").lower() if state.job_requirement else None
                bullet_examples = retriever.retrieve_bullet_examples(
                    position=exp.position,
                    position_description=exp.raw_description[:300],
                    industry=state.job_requirement.industry if state.job_requirement else None,
                    seniority=seniority or None,
                )
                rag_block = retriever.format_examples_for_prompt(bullet_examples, "bullet")
                if rag_block:
                    user_msg_parts.insert(0, rag_block)
            except Exception:
                pass

        # Nếu đang revision, thêm feedback
        if state.revision_count > 0 and state.quality_score:
            relevant_feedback = [f for f in state.quality_score.feedback if 'experience' in f.lower() or 'bullet' in f.lower()]
            if relevant_feedback:
                user_msg_parts.append(f"\n--- FEEDBACK CẦN XỬ LÝ ---")
                user_msg_parts.extend(relevant_feedback)

        user_msg = "\n".join(user_msg_parts)

        try:
            result = call_with_structured_output(
                llm=llm,
                output_schema=BulletPointsOutput,
                system_prompt=SYSTEM_PROMPT,
                user_message=user_msg,
            )

            # Tạo experience mới với bullets
            new_exp = WorkExperience(
                company=exp.company,
                position=exp.position,
                start_date=exp.start_date,
                end_date=exp.end_date,
                raw_description=exp.raw_description,
                bullets=result.bullets,
            )
            updated_experiences.append(new_exp)
        except Exception as e:
            # Fallback: giữ nguyên experience không có bullets
            updated_experiences.append(exp)

    # Update cv_draft
    current_draft = state.cv_draft or CVDraft()
    current_draft.experiences = updated_experiences

    return {
        "cv_draft": current_draft,
        "messages": [f"[Experience Agent] Đã viết bullets cho {len(updated_experiences)} kinh nghiệm"],
    }
