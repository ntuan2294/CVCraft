"""
Review CV Service — orchestrates the 3-step pipeline:

  1. cv_parser         : Trích xuất văn bản thô từ file CV tải lên
  2. jd_analyzer + cv_info_extractor (song song):
                         JobRequirement + CVProfile
  3. cv_analyzer       : RAG(job_title + industry + seniority) + LLM
                         → đánh giá / gợi ý / điểm số
"""
from cvcraft.review_cv.agents.cv_parser import parse_cv
from cvcraft.review_cv.agents.cv_analyzer import analyze_cv


class ReviewCVService:
    def run(
        self,
        cv_data: bytes,
        cv_mime: str,
        cv_filename: str,
        jd_text: str,
    ) -> dict:
        # Bước 1: Trích xuất văn bản thô từ file CV
        cv_text = parse_cv(cv_data, cv_mime, cv_filename)
        if not cv_text.strip():
            raise ValueError("Không trích xuất được nội dung CV")

        # Bước 2 + 3: Phân tích JD & CV song song → RAG + LLM đánh giá
        analysis, jd_req, cv_profile = analyze_cv(cv_text, jd_text)

        return {
            "evaluation": analysis.evaluation,
            "suggestions": analysis.suggestions,
            "score": analysis.score,
            "jd_job_title": jd_req.job_title,
            "jd_industry": jd_req.industry,
            "jd_seniority": jd_req.seniority_level,
            "cv_candidate": cv_profile.candidate_name,
            "cv_seniority": cv_profile.seniority_level,
        }
