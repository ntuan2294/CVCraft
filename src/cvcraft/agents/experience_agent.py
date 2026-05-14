"""
Experience Agent - Layer 2.
Viết bullet points STAR cho từng kinh nghiệm.
Dùng strong model + RAG bullets làm few-shot.
"""
from pydantic import BaseModel, Field
from cvcraft.core.state import CVAgentState, CVDraft, WorkExperience
from cvcraft.infrastructure.llm.factory import LLMFactory, call_with_structured_output
from cvcraft.rag import RAGRetriever


class BulletPointsOutput(BaseModel):
    bullets: list[str] = Field(description="3-5 bullet points theo phương pháp STAR")


SYSTEM_PROMPT = """You are a professional CV writer specializing in Experience section bullet points.

LANGUAGE REQUIREMENT — CRITICAL:
Output MUST be in English ONLY. Even if user's raw description is in Vietnamese or other languages,
TRANSLATE and write all bullets in fluent professional English. International CVs are in English.

STAR Method (mandatory for EVERY bullet):
- S/T (Situation/Task): brief context (implicit in the sentence)
- A (Action): specific action with strong verb at the start
- R (Result): QUANTIFIED result (numbers, %, time, scale)

Bullet formula: [Strong verb] + [Specific object] + [Method/Tool] + [Quantified result]

GOOD examples:
✓ "Architected microservices system using Node.js and Kubernetes, reducing API latency by 40% and supporting 2M+ daily requests"
✓ "Led team of 5 engineers to migrate legacy monolith to AWS, completing 3 months ahead of schedule and saving $120K/year in infrastructure cost"

BAD examples (avoid):
✗ "Responsible for backend development" (no strong action, no result)
✗ "Worked on improving system performance" (vague, no quantification)

Additional rules:
1. 3-5 bullets per experience (older jobs = fewer bullets)
2. First bullet is always the most IMPACTFUL achievement
3. Use past tense for past jobs, present tense for current job
4. Naturally weave in keywords from the JD
5. If user doesn't provide specific numbers, ESTIMATE reasonably based on scope
6. DO NOT fabricate specific numbers if user didn't mention them

Strong verbs: Architected, Led, Spearheaded, Optimized, Streamlined, Implemented, Delivered,
Scaled, Orchestrated, Pioneered, Reduced, Increased, Designed, Built, Migrated, Automated."""


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

    updated_experiences = []
    for exp in state.user_profile.work_experiences:
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
            new_exp = WorkExperience(
                company=exp.company,
                position=exp.position,
                start_date=exp.start_date,
                end_date=exp.end_date,
                raw_description=exp.raw_description,
                bullets=result.bullets,
            )
            updated_experiences.append(new_exp)
        except Exception:
            updated_experiences.append(exp)

    current_draft = state.cv_draft or CVDraft()
    current_draft.experiences = updated_experiences

    rag_msg = f" (dùng {len(retrieved_bullets)} RAG examples)" if retrieved_bullets else ""
    return {
        "cv_draft": current_draft,
        "messages": [f"[Experience Agent] Đã viết bullets cho {len(updated_experiences)} kinh nghiệm{rag_msg}"],
    }
