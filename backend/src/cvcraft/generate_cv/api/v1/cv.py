"""
CV generation endpoints.

POST /v1/cv/generate      - Tạo CV từ JD + user profile
GET  /v1/cv/rag/stats     - Thống kê RAG index
POST /v1/cv/rag/build     - Build / rebuild CV RAG index (seed | hf | kaggle)
"""
import os
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from cvcraft.generate_cv.api.deps import get_cv_service, get_rag_service
from cvcraft.generate_cv.services.cv_service import CVService
from cvcraft.generate_cv.services.rag_service import RAGService

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


class RagBuildRequest(BaseModel):
    source: str = Field("seed", description="Nguồn data: 'seed' | 'hf' | 'kaggle'")
    reset: bool = Field(False, description="Xóa và index lại từ đầu")
    max_records: int = Field(1000, ge=1, description="Số CV tối đa (chỉ áp dụng với hf/kaggle)")
    dataset_name: str | None = Field(None, description="HuggingFace dataset id (chỉ dùng với source=hf)")
    csv_path: str | None = Field(None, description="Path CSV đã tải (chỉ dùng với source=kaggle)")
    include_seed: bool = Field(True, description="Kèm tier 1 seed khi index tier 2 (hf/kaggle)")


_build_status: dict = {"running": False, "last_result": None}


def _run_build(request: RagBuildRequest, service: RAGService):
    _build_status["running"] = True
    try:
        if request.source == "seed":
            result = service.build_seed_index(reset=request.reset)
        elif request.source == "hf":
            result = service.build_hf_index(
                reset=request.reset,
                dataset_name=request.dataset_name,
                max_records=request.max_records,
                include_seed=request.include_seed,
            )
        elif request.source == "kaggle":
            result = service.build_kaggle_index(
                reset=request.reset,
                csv_path=request.csv_path,
                max_records=request.max_records,
                include_seed=request.include_seed,
            )
        else:
            result = {"error": f"source không hợp lệ: {request.source}"}
        _build_status["last_result"] = result
    except Exception as e:
        _build_status["last_result"] = {"error": str(e)}
    finally:
        _build_status["running"] = False


@router.post("/rag/build", status_code=202)
async def build_rag_index(
    request: RagBuildRequest,
    background_tasks: BackgroundTasks,
    service: RAGService = Depends(get_rag_service),
):
    """
    Build CV RAG index ở background.

    - **source=seed**: index tier 1 (seed samples thủ công, ~5s)
    - **source=hf**: index từ HuggingFace dataset (~vài phút, cần OPENAI_API_KEY)
    - **source=kaggle**: index từ Kaggle CSV (~vài phút, cần OPENAI_API_KEY)

    Trả về ngay 202 Accepted. Dùng GET /v1/cv/rag/stats để kiểm tra kết quả.
    """
    if _build_status["running"]:
        raise HTTPException(status_code=409, detail="Đang có build đang chạy, vui lòng chờ")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY chưa được set")
    background_tasks.add_task(_run_build, request, service)
    return {
        "status": "accepted",
        "message": f"Đang build CV RAG index từ source='{request.source}' ở background",
        "check_url": "/v1/cv/rag/stats",
    }


@router.get("/rag/build/status")
async def build_rag_status():
    """Trạng thái build RAG index hiện tại."""
    return {
        "running": _build_status["running"],
        "last_result": _build_status["last_result"],
    }
