"""
CV generation endpoints.

POST /v1/cv/generate  - Tạo CV từ JD + user profile
GET  /v1/cv/rag/stats - Thống kê RAG index
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from generate_cv.api.deps import get_cv_service, get_rag_service
from generate_cv.services.cv_service import CVService
from generate_cv.services.rag_service import RAGService

router = APIRouter()


class GenerateCVRequest(BaseModel):
    job_description: str
    user_input: dict
    max_revisions: int = 2


class QualityScoreOut(BaseModel):
    ats_score: float
    jd_match_score: float
    linguistic_score: float
    overall_score: float
    feedback: list[str]
    needs_revision: bool


class GenerateCVResponse(BaseModel):
    status: str
    output_path: str | None = None
    quality_score: QualityScoreOut | None = None
    cv_draft: dict | None = None
    messages: list[str] = []


@router.post("/generate", response_model=GenerateCVResponse)
async def generate_cv(
    request: GenerateCVRequest,
    service: CVService = Depends(get_cv_service),
) -> GenerateCVResponse:
    """
    Tạo CV từ Job Description và thông tin user.

    - **job_description**: Nội dung JD đầy đủ
    - **user_input**: Dict thông tin user (full_name, email, work_experiences, ...)
    - **max_revisions**: Số lần QC agent có thể loop lại (default: 2)
    """
    try:
        result = service.generate_cv(
            jd_text=request.job_description,
            user_input=request.user_input,
            max_revisions=request.max_revisions,
        )
        score = result.get("quality_score")
        return GenerateCVResponse(
            status="success",
            output_path=result.get("output_path"),
            quality_score=QualityScoreOut(**score.model_dump()) if score else None,
            cv_draft=result.get("cv_draft").model_dump() if result.get("cv_draft") else None,
            messages=result.get("messages", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download")
async def download_cv(path: str):
    """Tải file CV đã tạo (.docx)."""
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File không tìm thấy")
    return FileResponse(
        path,
        filename="cv.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/rag/stats")
async def rag_stats(
    service: RAGService = Depends(get_rag_service),
) -> dict:
    """Trả về thống kê RAG vector store."""
    return service.get_stats()
