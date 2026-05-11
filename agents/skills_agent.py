"""
Skills Agent - Layer 2.
Phân loại skills user thành các nhóm và prioritize theo JD.
"""
from pydantic import BaseModel, Field
from state import CVAgentState, CVDraft
from llm import LLMFactory, call_with_structured_output


class SkillCategory(BaseModel):
    name: str = Field(description="Tên category, e.g. 'Programming Languages'")
    skills: list[str] = Field(description="List skills trong category này")


class SkillsCategorized(BaseModel):
    categories: list[SkillCategory] = Field(
        description="List các category, mỗi category có name và list skills"
    )


SYSTEM_PROMPT = """Bạn là CV writer chuyên phân loại và sắp xếp skills.

Nhiệm vụ:
1. Phân loại skills thành các category phù hợp với ngành nghề
2. Sắp xếp các skill trong mỗi category theo độ ưu tiên (skill match với JD lên đầu)
3. Bỏ qua skills quá generic ("Microsoft Office", "Internet") trừ khi JD yêu cầu

Categories phổ biến cho tech:
- "Programming Languages"
- "Frameworks & Libraries"  
- "Databases"
- "DevOps & Cloud"
- "Tools & Platforms"
- "Soft Skills"

Categories phổ biến cho non-tech:
- "Technical Skills"
- "Tools"
- "Languages"
- "Soft Skills"

Quy tắc:
1. Gộp các skill tương đương: "ReactJS" và "React.js" -> giữ cách viết của JD nếu match
2. Skills có trong JD required -> đưa lên đầu category
3. Mỗi category có 3-8 skills, không quá nhiều
4. Tên category dùng tiếng Anh (CV chuẩn quốc tế)"""


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
        current_draft.skills_categorized = {cat.name: cat.skills for cat in result.categories}
        # Cập nhật cả education và projects nguyên xi từ profile
        current_draft.educations = state.user_profile.educations
        current_draft.projects = state.user_profile.projects

        return {
            "cv_draft": current_draft,
            "messages": [f"[Skills Agent] Đã phân loại thành {len(result.categories)} nhóm"],
        }
    except Exception as e:
        return {"messages": [f"[Skills Agent] Lỗi: {str(e)}"]}
