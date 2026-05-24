"""
CV Info Extractor Agent — mirrors user_profile_node in gen-cv but reads from raw CV text.

Input : cv_text (str) — plain text extracted from uploaded CV file
Output: CVProfile — structured info used downstream for RAG retrieval and analysis

The LLM extracts enough information to:
- Pick the right RAG seniority + industry bucket
- Give the analyzer rich context about the candidate's background
"""
from typing import Optional
from pydantic import BaseModel, Field
from cvcraft.infrastructure.llm.factory import LLMFactory, call_with_structured_output


class CVWorkExperience(BaseModel):
    position: str = Field(description="Chức danh / vị trí công việc")
    company: str = Field(description="Tên công ty")
    duration_years: Optional[float] = Field(default=None, description="Thời gian làm việc (năm)")
    key_skills: list[str] = Field(default_factory=list, description="Kỹ năng chính dùng trong job này")


class CVProfile(BaseModel):
    """Structured information extracted from uploaded CV text."""
    candidate_name: Optional[str] = Field(default=None, description="Tên ứng viên")
    current_position: str = Field(description="Vị trí hiện tại hoặc gần nhất")
    industry: Optional[str] = Field(default=None, description="Ngành nghề: tech/finance/marketing/healthcare/...")
    seniority_level: Optional[str] = Field(default=None, description="Junior/Mid/Senior — dựa trên tổng kinh nghiệm")
    total_years_experience: Optional[int] = Field(default=None, description="Tổng số năm kinh nghiệm")
    skills: list[str] = Field(default_factory=list, description="Tất cả kỹ năng được đề cập trong CV")
    work_experiences: list[CVWorkExperience] = Field(default_factory=list, description="Tối đa 5 kinh nghiệm gần nhất")
    education_summary: Optional[str] = Field(default=None, description="Học vấn tóm tắt (trường, bằng)")
    languages: list[str] = Field(default_factory=list, description="Ngôn ngữ tự nhiên biết")
    notable_achievements: list[str] = Field(default_factory=list, description="Thành tích nổi bật (tối đa 5)")


_SYSTEM_PROMPT = """Bạn là chuyên gia phân tích CV với 10 năm kinh nghiệm.

Nhiệm vụ: Đọc văn bản CV và trích xuất thông tin có cấu trúc.

Quy tắc:
1. current_position: vị trí gần nhất hoặc vị trí đang apply (nếu có objective)
2. industry: ngành chính — tech, finance, marketing, healthcare, education, retail, logistics, v.v.
3. seniority_level: phán đoán từ tổng số năm kinh nghiệm và cấp độ vị trí
   - Junior: <2 năm hoặc fresh graduate
   - Mid: 2-5 năm
   - Senior: 5+ năm hoặc có lead/manager experience
4. skills: gồm cả kỹ năng kỹ thuật lẫn kỹ năng mềm được đề cập tường minh
5. work_experiences: tối đa 5 kinh nghiệm gần nhất, theo thứ tự mới nhất trước
6. notable_achievements: chỉ những thành tích có số liệu hoặc impact rõ ràng
7. Nếu thông tin không có trong CV, trả về None hoặc list rỗng — KHÔNG bịa đặt

Trả về JSON chính xác theo schema."""


def extract_cv_info(cv_text: str) -> CVProfile:
    """Extract structured CVProfile from raw CV text."""
    llm = LLMFactory.get_llm(tier="cheap")
    user_msg = f"Trích xuất thông tin có cấu trúc từ CV sau:\n\n{cv_text[:6000]}"
    return call_with_structured_output(
        llm=llm,
        output_schema=CVProfile,
        system_prompt=_SYSTEM_PROMPT,
        user_message=user_msg,
    )
