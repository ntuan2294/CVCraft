"""
Agent phân tích Top-K JDs và gợi ý skills, CV keywords, projects cho người dùng.
Dùng gpt-4o-mini (cheap tier) vì task tổng hợp/phân tích không yêu cầu sáng tạo cao.
"""
from cvcraft.core.jd_search_models import JDSearchResult, JDSuggestion
from cvcraft.infrastructure.llm.factory import LLMFactory, call_with_structured_output


_SYSTEM_PROMPT = """You are an expert career coach and CV optimization specialist.
You analyze job descriptions to identify the most important skills, keywords, and project types
that will make a candidate's CV stand out and pass ATS (Applicant Tracking Systems).

Your output must be practical and specific — no generic advice.
Focus on what is COMMON across multiple JDs and what gaps a typical candidate might have.
Always respond in English."""


def generate_jd_suggestions(
    query: str,
    top_jds: list[JDSearchResult],
) -> JDSuggestion:
    if not top_jds:
        return JDSuggestion(
            skills_to_develop=[],
            cv_keywords=[],
            recommended_projects=[],
            summary_tips="No matching job descriptions found. Try broadening your search query.",
        )

    jd_summaries = []
    for i, result in enumerate(top_jds, 1):
        jd = result.jd
        jd_summaries.append(
            f"--- JD {i}: {jd.title} ({jd.seniority or 'N/A'} level, {jd.industry or 'N/A'}) ---\n"
            f"Required Skills: {', '.join(jd.required_skills)}\n"
            f"Key Keywords: {', '.join(jd.keywords)}\n"
            f"Description snippet: {jd.description[:400]}...\n"
        )

    user_message = (
        f"User's search query: \"{query}\"\n\n"
        f"Top {len(top_jds)} matching Job Descriptions:\n\n"
        + "\n".join(jd_summaries)
        + "\n\nBased on these JDs, provide targeted suggestions to help the user optimize their CV."
    )

    llm = LLMFactory.get_llm(tier="cheap")
    return call_with_structured_output(llm, JDSuggestion, _SYSTEM_PROMPT, user_message)
