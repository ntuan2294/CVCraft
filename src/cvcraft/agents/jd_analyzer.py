"""
JD Analyzer Agent - Layer 1.
Trích xuất thông tin có cấu trúc từ Job Description.
Dùng cheap model vì task này tương đối đơn giản.
"""
from cvcraft.core.state import CVAgentState, JobRequirement
from cvcraft.infrastructure.llm.factory import LLMFactory, call_with_structured_output


SYSTEM_PROMPT = """Bạn là chuyên gia phân tích Job Description với 10 năm kinh nghiệm trong ngành tuyển dụng.

Nhiệm vụ: Đọc JD và trích xuất thông tin có cấu trúc.

Quy tắc:
1. required_skills: CHỈ những kỹ năng dùng từ "phải có", "yêu cầu", "bắt buộc", "must have"
2. preferred_skills: kỹ năng "ưu tiên", "nice to have", "lợi thế"
3. keywords: từ khóa quan trọng cho ATS - bao gồm tên công nghệ, công cụ, methodology, certifications. Lấy đúng cách viết trong JD (ví dụ "React.js" không phải "ReactJS")
4. seniority_level: phán đoán từ context - Junior (0-2 năm), Mid (2-5 năm), Senior (5+ năm)
5. industry: tech/finance/marketing/healthcare/...
6. soft_skills: kỹ năng mềm như "teamwork", "communication", "problem-solving"

Trả lời chính xác, không phỏng đoán quá đà. Nếu JD không nói rõ về một field, để None hoặc list rỗng."""


def jd_analyzer_node(state: CVAgentState) -> dict:
    if not state.job_description:
        return {"messages": ["[JD Analyzer] Bỏ qua - không có JD"]}

    llm = LLMFactory.get_llm(tier="cheap")
    user_msg = f"Phân tích JD sau và trích xuất thông tin có cấu trúc:\n\n{state.job_description}"

    try:
        result = call_with_structured_output(
            llm=llm,
            output_schema=JobRequirement,
            system_prompt=SYSTEM_PROMPT,
            user_message=user_msg,
        )
        return {
            "job_requirement": result,
            "messages": [f"[JD Analyzer] Đã phân tích JD: {result.job_title} ({result.seniority_level})"],
        }
    except Exception as e:
        return {"messages": [f"[JD Analyzer] Lỗi: {str(e)}"]}
