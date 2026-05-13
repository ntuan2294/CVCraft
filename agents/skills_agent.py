"""
Skills Agent - Layer 2.
Phân loại skills user thành các nhóm và prioritize theo JD.
"""
from pydantic import BaseModel, Field
from state import CVAgentState, CVDraft
from llm import LLMFactory, call_with_structured_output


class SkillsCategorized(BaseModel):
    """Skills phân theo nhóm."""
    categories: dict[str, list[str]] = Field(
        description="Dict với key là tên category, value là list skills",
    )


SYSTEM_PROMPT = """You are a CV writer specializing in categorizing and organizing skills.

LANGUAGE REQUIREMENT — CRITICAL:
All output (category names AND skill names) MUST be in English. International CV standard.

Task:
1. Categorize skills into appropriate categories for the industry
2. Sort skills within each category by priority (JD-matching skills first)
3. Skip overly generic skills ("Microsoft Office", "Internet") unless JD requires

Common categories for tech:
- "Programming Languages"
- "Frameworks & Libraries"  
- "Databases"
- "DevOps & Cloud"
- "Tools & Platforms"
- "Soft Skills"

Common categories for non-tech:
- "Technical Skills"
- "Tools"
- "Languages"
- "Soft Skills"

Rules:
1. Merge equivalent skills: "ReactJS" and "React.js" → keep the JD's spelling if matched
2. Skills in JD's required list → move to top of category
3. Each category has 3-8 skills, not too many
4. Category names in English (international CV standard)"""


def skills_agent_node(state: CVAgentState) -> dict:
    """Phân loại skills."""
    if not state.user_profile:
        return {"messages": ["[Skills Agent] Thiếu profile"]}

    llm = LLMFactory.get_llm(tier="cheap")  # Task này không quá phức tạp

    user_skills = state.user_profile.skills_raw
    if not user_skills:
        return {"messages": ["[Skills Agent] User không cung cấp skills"]}

    user_msg_parts = [
        f"Skills user khai báo: {', '.join(user_skills)}",
    ]

    if state.job_requirement:
        jd = state.job_requirement
        user_msg_parts.append(f"\nNgành: {jd.industry}")
        user_msg_parts.append(f"Vị trí: {jd.job_title}")
        user_msg_parts.append(f"Skills JD yêu cầu: {', '.join(jd.required_skills)}")
        user_msg_parts.append(f"Skills JD ưu tiên: {', '.join(jd.preferred_skills)}")

    user_msg = "\n".join(user_msg_parts)

    try:
        result = call_with_structured_output(
            llm=llm,
            output_schema=SkillsCategorized,
            system_prompt=SYSTEM_PROMPT,
            user_message=user_msg,
        )

        current_draft = state.cv_draft or CVDraft()
        current_draft.skills_categorized = result.categories
        # Cập nhật cả education và projects nguyên xi từ profile
        current_draft.educations = state.user_profile.educations
        current_draft.projects = state.user_profile.projects

        return {
            "cv_draft": current_draft,
            "messages": [f"[Skills Agent] Đã phân loại thành {len(result.categories)} nhóm"],
        }
    except Exception as e:
        return {"messages": [f"[Skills Agent] Lỗi: {str(e)}"]}