"""
Summary Agent - Layer 2.
Viết Professional Summary 3-4 câu, tailored với JD.
Dùng strong model + RAG examples để học phong cách.
"""
from state import CVAgentState, CVDraft
from llm import LLMFactory, call_text
from data.rag import RAGRetriever


SYSTEM_PROMPT = """You are a professional CV writer with 15 years of experience.

Task: Write a Professional Summary for a CV (3-4 sentences, 50-80 words).

LANGUAGE REQUIREMENT — CRITICAL:
The output MUST be in English ONLY. Even if user input is in Vietnamese or other languages,
TRANSLATE and write the summary in fluent professional English. International CVs are in English.

Mandatory rules:
1. Sentence 1: Position + years of experience + area of expertise
2. Sentence 2: Top 2-3 standout skills/achievements (quantified if possible)
3. Sentence 3: Value proposition / career objective aligned with the JD
4. Use strong verbs: led, architected, optimized, delivered, scaled
5. NO clichés: "hard-working", "team player", "passionate about"
6. Tone: confident, not boastful, no "I/me/my"
7. Naturally weave in 2-3 key keywords from the JD

Output: ONLY the summary paragraph. No explanation, no title."""


def summary_agent_node(state: CVAgentState) -> dict:
    """Viết summary và update vào cv_draft."""
    if not state.user_profile:
        return {"messages": ["[Summary Agent] Thiếu user profile"]}

    llm = LLMFactory.get_llm(tier="strong")

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

    # === RAG: chèn retrieved examples vào prompt nếu có ===
    retrieved_summaries = []
    try:
        retriever = RAGRetriever()
        retrieved_summaries = retriever.retrieve_summary_examples(
            job_title=jd_req.job_title if jd_req else (profile.work_experiences[0].position if profile.work_experiences else ""),
            job_description=state.job_description,
            industry=jd_req.industry if jd_req else None,
            seniority=jd_req.seniority_level if jd_req else None,
        )
    except Exception:
        pass

    if retrieved_summaries:
        examples_block = RAGRetriever.format_examples_for_prompt(
            retrieved_summaries,
            example_type="summary"
        )
        user_msg = examples_block + "\n\n--- THÔNG TIN USER ---\n" + user_msg

    # Nếu đang revision, thêm feedback
    if state.revision_count > 0 and state.quality_score:
        user_msg += f"\n\n--- FEEDBACK CẦN XỬ LÝ ---\n"
        user_msg += "\n".join(state.quality_score.feedback)

    try:
        summary = call_text(llm, SYSTEM_PROMPT, user_msg)

        current_draft = state.cv_draft or CVDraft()
        current_draft.summary = summary.strip()

        rag_msg = f" (dùng {len(retrieved_summaries)} RAG examples)" if retrieved_summaries else ""
        return {
            "cv_draft": current_draft,
            "messages": [f"[Summary Agent] Đã viết summary ({len(summary.split())} từ){rag_msg}"],
        }
    except Exception as e:
        return {"messages": [f"[Summary Agent] Lỗi: {str(e)}"]}