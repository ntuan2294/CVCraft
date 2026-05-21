"""
State schema cho multi-agent CV system.
State này được truyền qua tất cả các agent trong graph.
"""
from typing import Optional, Annotated
from pydantic import BaseModel, Field
from operator import add


# ============ INPUT MODELS ============

class JobRequirement(BaseModel):
    """Output của JD Analyzer Agent."""
    job_title: str = Field(description="Chức danh công việc")
    required_skills: list[str] = Field(default_factory=list, description="Kỹ năng cứng bắt buộc")
    preferred_skills: list[str] = Field(default_factory=list, description="Kỹ năng ưu tiên")
    soft_skills: list[str] = Field(default_factory=list, description="Kỹ năng mềm")
    years_experience: Optional[int] = Field(default=None, description="Số năm kinh nghiệm yêu cầu")
    keywords: list[str] = Field(default_factory=list, description="Từ khóa quan trọng cho ATS")
    industry: Optional[str] = Field(default=None, description="Ngành nghề")
    seniority_level: Optional[str] = Field(default=None, description="Junior/Mid/Senior")


class WorkExperience(BaseModel):
    """Một entry trong lịch sử làm việc."""
    company: str
    position: str
    start_date: str
    end_date: Optional[str] = None
    raw_description: str = Field(description="Mô tả thô từ user")
    bullets: list[str] = Field(default_factory=list, description="Bullet points đã được agent viết")


class Education(BaseModel):
    school: str
    degree: str
    major: str
    start_date: str
    end_date: Optional[str] = None
    gpa: Optional[float] = None
    achievements: list[str] = Field(default_factory=list)


class UserProfile(BaseModel):
    """Thông tin user thu thập được."""
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    job_title: Optional[str] = None
    raw_summary: Optional[str] = Field(default=None, description="Tự giới thiệu thô của user")
    work_experiences: list[WorkExperience] = Field(default_factory=list)
    educations: list[Education] = Field(default_factory=list)
    skills_raw: list[str] = Field(default_factory=list, description="Skills user tự khai")
    languages: list[str] = Field(default_factory=list)
    references: Optional[str] = None
    photo: Optional[dict] = None
    projects: list[dict] = Field(default_factory=list)
    template_path: Optional[str] = Field(default=None, description="Đường dẫn đến file template .docx")


# ============ OUTPUT MODELS ============

class CVDraft(BaseModel):
    """CV đã được sinh, có cấu trúc."""
    summary: Optional[str] = None
    experiences: list[WorkExperience] = Field(default_factory=list)
    skills_categorized: dict[str, list[str]] = Field(default_factory=dict)
    educations: list[Education] = Field(default_factory=list)
    projects: list[dict] = Field(default_factory=list)


def merge_cv_drafts(left: Optional[CVDraft], right: Optional[CVDraft]) -> Optional[CVDraft]:
    """Merge partial CVDraft updates from parallel LangGraph nodes."""
    if left is None:
        return right
    if right is None:
        return left

    merged = left.model_copy(deep=True)

    if right.summary is not None:
        merged.summary = right.summary
    if right.experiences:
        merged.experiences = right.experiences
    if right.skills_categorized:
        merged.skills_categorized = right.skills_categorized
    if right.educations:
        merged.educations = right.educations
    if right.projects:
        merged.projects = right.projects

    return merged


# ============ QUALITY CONTROL MODELS ============

class QualityScore(BaseModel):
    """Output của QC agents."""
    ats_score: float = Field(ge=0, le=10, description="Điểm ATS compatibility")
    jd_match_score: float = Field(ge=0, le=10, description="Điểm phù hợp với JD")
    linguistic_score: float = Field(ge=0, le=10, description="Điểm chất lượng ngôn ngữ")
    overall_score: float = Field(ge=0, le=10)
    feedback: list[str] = Field(default_factory=list, description="Phản hồi cụ thể để cải thiện")
    needs_revision: bool = Field(default=False)


# ============ MAIN STATE ============

class CVAgentState(BaseModel):
    """
    State chính được truyền qua toàn bộ graph.
    LangGraph sẽ merge các updates dựa trên schema này.
    """
    # Input
    job_description: str = ""
    user_input: dict = Field(default_factory=dict)

    # Intermediate outputs
    job_requirement: Optional[JobRequirement] = None
    user_profile: Optional[UserProfile] = None
    cv_draft: Annotated[Optional[CVDraft], merge_cv_drafts] = None
    quality_score: Optional[QualityScore] = None

    # Control flow
    revision_count: int = 0
    max_revisions: int = 2

    # Output rendering
    output_path: Optional[str] = Field(default=None, description="Đường dẫn file CV đã render")

    # Logs (annotated với 'add' để LangGraph biết cách merge)
    messages: Annotated[list[str], add] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True
