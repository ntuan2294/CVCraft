"""
User Profile Agent - Layer 1.
Phiên bản này nhận user_input dạng dict (form-based).
Có thể mở rộng thành conversational sau.
"""
from state import CVAgentState, UserProfile, WorkExperience, Education


def user_profile_node(state: CVAgentState) -> dict:
    """
    Parse user_input dict -> UserProfile structured.
    Đây là phiên bản đơn giản, chỉ validate và chuyển đổi.
    """
    if not state.user_input:
        return {"messages": ["[User Profile] Bỏ qua - không có user input"]}

    data = state.user_input

    # Parse work experiences
    experiences = []
    for exp in data.get("work_experiences", []):
        experiences.append(WorkExperience(
            company=exp.get("company", ""),
            position=exp.get("position", ""),
            start_date=exp.get("start_date", ""),
            end_date=exp.get("end_date"),
            raw_description=exp.get("description", ""),
        ))

    # Parse educations
    educations = []
    for edu in data.get("educations", []):
        educations.append(Education(
            school=edu.get("school", ""),
            degree=edu.get("degree", ""),
            major=edu.get("major", ""),
            start_date=edu.get("start_date", ""),
            end_date=edu.get("end_date"),
            gpa=edu.get("gpa"),
        ))

    profile = UserProfile(
        full_name=data.get("full_name", ""),
        email=data.get("email", ""),
        phone=data.get("phone"),
        location=data.get("location"),
        linkedin=data.get("linkedin"),
        github=data.get("github"),
        raw_summary=data.get("summary"),
        work_experiences=experiences,
        educations=educations,
        skills_raw=data.get("skills", []),
        projects=data.get("projects", []),
        template_path=data.get("template_path"),
    )

    template_msg = f", template: {profile.template_path}" if profile.template_path else ""
    return {
        "user_profile": profile,
        "messages": [f"[User Profile] Đã parse profile: {profile.full_name}, {len(experiences)} kinh nghiệm{template_msg}"],
    }