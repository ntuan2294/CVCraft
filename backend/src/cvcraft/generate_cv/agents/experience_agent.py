"""
Experience Agent - Layer 2.
Viết bullet points STAR cho từng kinh nghiệm.
Dùng strong model + RAG bullets làm few-shot.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pydantic import BaseModel, Field
from cvcraft.generate_cv.core.state import CVAgentState, CVDraft, WorkExperience
from cvcraft.generate_cv.infrastructure.llm.factory import LLMFactory, call_with_structured_output
from cvcraft.generate_cv.rag import RAGRetriever


class BulletPointsOutput(BaseModel):
    bullets: list[str] = Field(description="3-5 bullet points theo phương pháp STAR")


SYSTEM_PROMPT = """You are a professional CV writer specializing in Experience section bullet points.

LANGUAGE REQUIREMENT — CRITICAL:
Default output MUST be fluent professional Vietnamese. If output_language is "en",
write all bullets in fluent professional English after translating from the Vietnamese CV intent.

VIETNAMESE WORDING POLICY — CRITICAL:
When output_language is Vietnamese, write complete Vietnamese sentences. Keep English only for
widely used technical terms, product/tool names, acronyms, or role nouns such as backend, frontend,
full-stack, REST API, API, CI/CD, Docker, Git, Java, Spring Boot, PostgreSQL, MySQL, cloud, Agile/Scrum.
Do NOT use English verbs/adjectives as Vietnamese prose, for example: delivered, optimized,
implemented, designed, built, scaled, migrated, improved, maintained. Translate them naturally:
- delivered -> triển khai / hoàn thành / đóng góp vào
- optimized -> tối ưu / cải thiện
- implemented -> triển khai / xây dựng
- designed -> thiết kế
- built -> xây dựng / phát triển
- scaled -> mở rộng
- migrated -> chuyển đổi / di chuyển
- maintained -> bảo trì / duy trì

STAR Method (mandatory for EVERY bullet):
- S/T (Situation/Task): brief context (implicit in the sentence)
- A (Action): specific action with strong verb at the start
- R (Result): result or business/technical outcome grounded in the user's input

Bullet formula: [Strong verb] + [Specific object] + [Method/Tool] + [Result grounded in provided facts]

GOOD examples:
✓ "Thiết kế RESTful API cho hệ thống quản lý đơn hàng bằng Java Spring Boot, giúp frontend tích hợp nghiệp vụ nhất quán và dễ bảo trì hơn"
✓ "Tối ưu truy vấn PostgreSQL cho các màn hình quản lý đơn hàng, cải thiện độ ổn định và khả năng phản hồi của hệ thống"

BAD examples (avoid):
✗ "Responsible for backend development" (no strong action, no result)
✗ "Worked on improving system performance" (vague, no quantification)
✗ "Giảm latency 40% và xử lý 2M requests/ngày" if the user did not explicitly provide those metrics

Additional rules:
1. 3-5 bullets per experience (older jobs = fewer bullets)
2. First bullet is always the most IMPACTFUL achievement
3. Use past tense for past jobs, present tense for current job
4. Naturally weave in keywords from the JD
5. NEVER invent or estimate numbers, percentages, money, time savings, team size, user volume,
   latency, test coverage, daily requests, cloud scale, awards, certifications, leadership scope,
   or business impact if the user did not explicitly provide them.
6. If the input has no metrics, write qualitative results only, e.g. "giúp chuẩn hóa luồng xử lý",
   "cải thiện khả năng bảo trì", "hỗ trợ triển khai ổn định", without adding any numeric value.
7. Do not add technologies, cloud providers, tools, domains, projects, or responsibilities that are
   not present in the user input or JD. JD keywords may be used only when they are compatible with
   the user's actual experience.
8. RAG examples are style references only. Do not copy their metrics, scale, technologies, or outcomes.

Vietnamese strong verbs: Phát triển, Xây dựng, Thiết kế, Triển khai, Tối ưu, Cải thiện,
Chuẩn hóa, Bảo trì, Phối hợp, Tích hợp, Xử lý, Viết, Hỗ trợ.
English strong verbs are allowed only when output_language is English."""


def experience_agent_node(state: CVAgentState) -> dict:
    if not state.user_profile or not state.user_profile.work_experiences:
        return {"messages": ["[Experience Agent] Không có kinh nghiệm để xử lý"]}

    llm = LLMFactory.get_llm(tier="strong")
    jd_keywords = []
    if state.job_requirement:
        jd_keywords = state.job_requirement.keywords + state.job_requirement.required_skills

    rag_examples_block = ""
    retrieved_bullets = []
    try:
        retriever = RAGRetriever()
        jd_req = state.job_requirement
        retrieved_bullets = retriever.retrieve_bullet_examples(
            position=jd_req.job_title if jd_req else state.user_profile.work_experiences[0].position,
            position_description=state.job_description,
            industry=jd_req.industry if jd_req else None,
            seniority=jd_req.seniority_level if jd_req else None,
        )
        if retrieved_bullets:
            rag_examples_block = RAGRetriever.format_examples_for_prompt(
                retrieved_bullets,
                example_type="bullet point"
            )
    except Exception:
        pass

    language = state.user_input.get("output_language", "vi")
    language_msg = "Output language: English." if language == "en" else "Output language: Vietnamese."
    revision_feedback = []
    if state.revision_count > 0 and state.quality_score:
        revision_feedback = [f for f in state.quality_score.feedback if 'experience' in f.lower() or 'bullet' in f.lower()]

    def _write_bullets_for_exp(exp: WorkExperience) -> WorkExperience:
        user_msg_parts = []
        if rag_examples_block:
            user_msg_parts.append(rag_examples_block)
            user_msg_parts.append("--- THÔNG TIN JOB CẦN VIẾT ---")
        user_msg_parts.extend([
            f"Vị trí: {exp.position}",
            f"Công ty: {exp.company}",
            f"Thời gian: {exp.start_date} - {exp.end_date or 'Hiện tại'}",
            f"Mô tả thô từ user:",
            exp.raw_description,
        ])
        if jd_keywords:
            user_msg_parts.append(f"\nKeywords từ JD cần lồng ghép tự nhiên: {', '.join(jd_keywords[:10])}")
        if revision_feedback:
            user_msg_parts.append("\n--- FEEDBACK CẦN XỬ LÝ ---")
            user_msg_parts.extend(revision_feedback)
        user_msg = language_msg + "\n\n" + "\n".join(user_msg_parts)
        try:
            result = call_with_structured_output(
                llm=llm,
                output_schema=BulletPointsOutput,
                system_prompt=SYSTEM_PROMPT,
                user_message=user_msg,
            )
            return WorkExperience(
                company=exp.company,
                position=exp.position,
                start_date=exp.start_date,
                end_date=exp.end_date,
                raw_description=exp.raw_description,
                bullets=result.bullets,
            )
        except Exception:
            return exp

    experiences = state.user_profile.work_experiences
    updated_experiences: list[WorkExperience] = [None] * len(experiences)  # type: ignore
    with ThreadPoolExecutor(max_workers=min(len(experiences), 4)) as pool:
        futures = {pool.submit(_write_bullets_for_exp, exp): i for i, exp in enumerate(experiences)}
        for future in as_completed(futures):
            updated_experiences[futures[future]] = future.result()

    current_draft = state.cv_draft.model_copy(deep=True) if state.cv_draft else CVDraft()
    current_draft.experiences = updated_experiences

    rag_msg = f" (dùng {len(retrieved_bullets)} RAG examples)" if retrieved_bullets else ""
    return {
        "cv_draft": current_draft,
        "messages": [f"[Experience Agent] Đã viết bullets cho {len(updated_experiences)} kinh nghiệm{rag_msg}"],
    }
