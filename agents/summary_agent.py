"""
Summary Agent - Layer 2.
Viết Professional Summary 3-4 câu, tailored với JD.
Dùng strong model vì cần chất lượng văn phong.
"""
from state import CVAgentState, CVDraft
from llm import LLMFactory, call_text

try:
    from rag import RAGRetriever
    _RAG_AVAILABLE = True
except ImportError:
    _RAG_AVAILABLE = False


SYSTEM_PROMPT = """Bạn là CV writer chuyên nghiệp với 15 năm kinh nghiệm.

Nhiệm vụ: Viết Professional Summary cho CV (3-4 câu, 50-80 từ).

Quy tắc bắt buộc:
1. Câu 1: Vị trí + số năm kinh nghiệm + lĩnh vực chuyên môn
2. Câu 2: Top 2-3 kỹ năng/thành tựu nổi bật (lượng hóa nếu có thể)
3. Câu 3: Giá trị mang lại / mục tiêu nghề nghiệp align với JD
4. Dùng động từ mạnh: led, architected, optimized, delivered, scaled
5. KHÔNG dùng cliché: "hard-working", "team player", "passionate about"
6. Giọng văn: tự tin, không khoe khoang, không xưng "tôi"
7. Lồng ghép tự nhiên 2-3 keywords quan trọng từ JD

Output: CHỈ trả về đoạn summary, không giải thích, không tiêu đề."""


def summary_agent_node(state: CVAgentState) -> dict:
    """Viết summary và update vào cv_draft."""
    if not state.user_profile:
        return {"messages": ["[Summary Agent] Thiếu user profile"]}

    llm = LLMFactory.get_llm(tier="strong")

    # Build context cho prompt
    profile = state.user_profile
    jd_req = state.job_requirement

    context_parts = [
        f"Tên: {profile.full_name}",
        f"Tự giới thiệu của user: {profile.raw_summary or '(không có)'}",
        f"Số năm kinh nghiệm: {len(profile.work_experiences)} công việc",
    ]

    if profile.work_experiences:
        recent = profile.work_experiences[0]
        context_parts.append(f"Vị trí gần nhất: {recent.position} tại {recent.company}")
        context_parts.append(f"Mô tả: {recent.raw_description[:200]}")

    context_parts.append(f"Kỹ năng: {', '.join(profile.skills_raw)}")

    if jd_req:
        context_parts.append(f"\n--- JD đang ứng tuyển ---")
        context_parts.append(f"Vị trí: {jd_req.job_title}")
        context_parts.append(f"Level: {jd_req.seniority_level}")
        context_parts.append(f"Kỹ năng yêu cầu: {', '.join(jd_req.required_skills[:5])}")
        context_parts.append(f"Keywords ATS: {', '.join(jd_req.keywords[:7])}")

    user_msg = "\n".join(context_parts)

    # Nếu có feedback từ revision, thêm vào
    if state.revision_count > 0 and state.quality_score:
        user_msg += f"\n\n--- FEEDBACK CẦN XỬ LÝ ---\n"
        user_msg += "\n".join(state.quality_score.feedback)

    # RAG: prepend few-shot summary examples
    if _RAG_AVAILABLE:
        try:
            retriever = RAGRetriever()
            if not retriever.store.is_empty():
                job_title = (
                    jd_req.job_title if jd_req
                    else (profile.work_experiences[0].position if profile.work_experiences else "")
                )
                seniority = (jd_req.seniority_level or "").lower() if jd_req else None
                examples = retriever.retrieve_summary_examples(
                    job_title=job_title,
                    job_description=state.job_description[:500],
                    industry=jd_req.industry if jd_req else None,
                    seniority=seniority or None,
                )
                rag_block = retriever.format_examples_for_prompt(examples, "summary")
                if rag_block:
                    user_msg = rag_block + "\n" + user_msg
        except Exception:
            pass

    try:
        summary = call_text(llm, SYSTEM_PROMPT, user_msg)

        # Update cv_draft (giữ các field khác nếu đã có)
        current_draft = state.cv_draft or CVDraft()
        current_draft.summary = summary.strip()

        return {
            "cv_draft": current_draft,
            "messages": [f"[Summary Agent] Đã viết summary ({len(summary.split())} từ)"],
        }
    except Exception as e:
        return {"messages": [f"[Summary Agent] Lỗi: {str(e)}"]}
