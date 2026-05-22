"""
Summary Agent - Layer 2.
Viết Professional Summary 3-4 câu, tailored với JD.
Dùng strong model + RAG examples để học phong cách.
"""
from cvcraft.generate_cv.core.state import CVAgentState, CVDraft
from cvcraft.generate_cv.infrastructure.llm.factory import LLMFactory, call_text
from cvcraft.generate_cv.rag import RAGRetriever


SYSTEM_PROMPT = """You are a professional CV writer with 15 years of experience.

Task: Write a Professional Summary for a CV (3-4 sentences, 50-80 words).

LANGUAGE REQUIREMENT — CRITICAL:
Default output MUST be fluent professional Vietnamese. If output_language is "en",
write the summary in fluent professional English after translating from the Vietnamese CV intent.

VIETNAMESE WORDING POLICY — CRITICAL:
When output_language is Vietnamese, write complete Vietnamese sentences. Keep English only for
widely used technical terms, product/tool names, acronyms, or role nouns such as backend, frontend,
full-stack, REST API, API, CI/CD, Docker, Git, Java, Spring Boot, PostgreSQL, MySQL, cloud, Agile/Scrum.
Do NOT use English verbs/adjectives as Vietnamese prose, for example: delivered, optimized,
implemented, designed, built, scaled, migrated. Translate them naturally:
- delivered -> triển khai / hoàn thành / đóng góp vào
- optimized -> tối ưu / cải thiện
- implemented -> triển khai / xây dựng
- designed -> thiết kế
- built -> xây dựng / phát triển
- scaled -> mở rộng
- migrated -> chuyển đổi / di chuyển

Mandatory rules:
1. Sentence 1: Position + years of experience + area of expertise
2. Sentence 2: Top 2-3 standout skills/achievements based only on user-provided facts
3. Sentence 3: Value proposition / career objective aligned with the JD
4. Use strong Vietnamese action verbs when output_language is Vietnamese: phát triển, xây dựng,
   thiết kế, triển khai, tối ưu, cải thiện, phối hợp, chuẩn hóa, bảo trì.
5. NO clichés: "hard-working", "team player", "passionate about"
6. Tone: confident, not boastful, no "I/me/my"
7. Naturally weave in 2-3 key keywords from the JD
8. NEVER invent or estimate numbers, percentages, money, time savings, team size, user volume,
   latency, test coverage, daily requests, cloud scale, awards, certifications, leadership scope,
   or business impact if the user did not explicitly provide them.
9. Do not add technologies, cloud providers, domains, projects, or responsibilities that are not
   present in the user input or JD. JD keywords may be used only when they are compatible with the
   user's actual experience.
10. RAG examples are style references only. Do not copy their metrics, scale, technologies, or outcomes.

Output: ONLY the summary paragraph. No explanation, no title."""


def summary_agent_node(state: CVAgentState) -> dict:
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

    if state.revision_count > 0 and state.quality_score:
        user_msg += f"\n\n--- FEEDBACK CẦN XỬ LÝ ---\n"
        user_msg += "\n".join(state.quality_score.feedback)

    try:
        language = state.user_input.get("output_language", "vi")
        language_msg = "Output language: English." if language == "en" else "Output language: Vietnamese."
        summary = call_text(llm, SYSTEM_PROMPT, language_msg + "\n\n" + user_msg)

        current_draft = state.cv_draft.model_copy(deep=True) if state.cv_draft else CVDraft()
        current_draft.summary = summary.strip()

        rag_msg = f" (dùng {len(retrieved_summaries)} RAG examples)" if retrieved_summaries else ""
        return {
            "cv_draft": current_draft,
            "messages": [f"[Summary Agent] Đã viết summary ({len(summary.split())} từ){rag_msg}"],
        }
    except Exception as e:
        return {"messages": [f"[Summary Agent] Lỗi: {str(e)}"]}
