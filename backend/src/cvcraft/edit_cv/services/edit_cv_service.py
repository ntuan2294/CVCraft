"""Edit CV Service — analyze uploaded CV content and return score/feedback only."""
from cvcraft.edit_cv.agents.cv_parser import parse_cv
from cvcraft.edit_cv.agents.cv_analyzer import analyze_cv


class EditCVService:
    def run(
        self,
        cv_data: bytes,
        cv_mime: str,
        cv_filename: str,
        jd_text: str,
    ) -> dict:
        cv_text = parse_cv(cv_data, cv_mime, cv_filename)
        if not cv_text.strip():
            raise ValueError("Không trích xuất được nội dung CV")

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
