"""
CV generation endpoints.

Sync (legacy):
  POST /v1/cv/generate          - Tạo CV, block cho đến khi xong (~30-60s)

Async (recommended):
  POST /v1/cv/generate/async    - Submit task, trả ngay task_id
  GET  /v1/cv/tasks/{task_id}   - Poll trạng thái + kết quả

History:
  GET  /v1/cv/history           - 20 lần tạo CV gần nhất
  DELETE /v1/cv/history         - Xóa history

File:
  GET  /v1/cv/download          - Tải file .docx
  GET  /v1/cv/onlyoffice/config - Config OnlyOffice
  POST /v1/cv/onlyoffice/callback

RAG:
  GET  /v1/cv/rag/stats
  POST /v1/cv/rag/build
  GET  /v1/cv/rag/build/status

Info:
  GET  /v1/cv/cache/stats       - Thống kê Redis cache
"""
import os
from pathlib import Path
from urllib.parse import quote

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from cvcraft.config.settings import settings
from cvcraft.generate_cv.api.deps import get_cv_service, get_rag_service, get_task_service
from cvcraft.generate_cv.services.cv_service import CVService
from cvcraft.generate_cv.services.rag_service import RAGService
from cvcraft.generate_cv.services.task_service import CVTaskService, TaskStatus

router = APIRouter()

# ── Request / Response schemas ────────────────────────────────────────────────


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


class AsyncGenerateCVResponse(BaseModel):
    task_id: str
    status: str = TaskStatus.QUEUED
    message: str = "CV đang được tạo ở background. Dùng GET /v1/cv/tasks/{task_id} để kiểm tra."
    poll_url: str = ""


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    created_at: str | None = None
    updated_at: str | None = None
    result: GenerateCVResponse | None = None
    error: str | None = None


class OnlyOfficeCallbackRequest(BaseModel):
    status: int
    url: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _require_existing_docx(path: str) -> Path:
    if not path:
        raise HTTPException(status_code=400, detail="Thiếu path")
    file_path = Path(path)
    if not file_path.exists() or file_path.suffix.lower() != ".docx":
        raise HTTPException(status_code=404, detail="File không tìm thấy")
    return file_path


def _build_generate_response(result: dict) -> GenerateCVResponse:
    score = result.get("quality_score")
    return GenerateCVResponse(
        status="success",
        output_path=result.get("output_path"),
        quality_score=QualityScoreOut(**score.model_dump()) if score else None,
        cv_draft=result.get("cv_draft").model_dump() if result.get("cv_draft") else None,
        messages=result.get("messages", []),
    )


# ── CV Generation — Sync ──────────────────────────────────────────────────────


@router.post("/generate", response_model=GenerateCVResponse)
async def generate_cv(
    request: GenerateCVRequest,
    req: Request,
    service: CVService = Depends(get_cv_service),
) -> GenerateCVResponse:
    """Tạo CV đồng bộ (block ~30-60s). Dùng /generate/async để không block."""
    _apply_rate_limit(req, limit=f"{settings.rate_limit_cv_generate}/minute")
    try:
        result = service.generate_cv(
            jd_text=request.job_description,
            user_input=request.user_input,
            max_revisions=request.max_revisions,
        )
        return _build_generate_response(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── CV Generation — Async ─────────────────────────────────────────────────────


@router.post("/generate/async", response_model=AsyncGenerateCVResponse, status_code=202)
async def generate_cv_async(
    request: GenerateCVRequest,
    req: Request,
    service: CVService = Depends(get_cv_service),
    task_svc: CVTaskService = Depends(get_task_service),
) -> AsyncGenerateCVResponse:
    """
    Submit CV generation task, trả về ngay task_id (202 Accepted).
    Client poll GET /v1/cv/tasks/{task_id} để lấy kết quả.
    """
    _apply_rate_limit(req, limit=f"{settings.rate_limit_cv_generate}/minute")
    job_title = request.user_input.get("job_title", "")
    task_id = task_svc.create_task(job_title=job_title)
    task_svc.submit(
        task_id=task_id,
        cv_service=service,
        jd_text=request.job_description,
        user_input=request.user_input,
        max_revisions=request.max_revisions,
    )
    return AsyncGenerateCVResponse(
        task_id=task_id,
        poll_url=f"/v1/cv/tasks/{task_id}",
    )


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    task_svc: CVTaskService = Depends(get_task_service),
) -> TaskStatusResponse:
    """Poll trạng thái CV generation task."""
    task = task_svc.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' không tìm thấy")

    result = None
    raw_result = task.get("result")
    if task["status"] == TaskStatus.DONE and raw_result:
        score_data = raw_result.get("quality_score")
        result = GenerateCVResponse(
            status="success",
            output_path=raw_result.get("output_path"),
            quality_score=QualityScoreOut(**score_data) if score_data else None,
            cv_draft=raw_result.get("cv_draft"),
            messages=raw_result.get("messages", []),
        )

    return TaskStatusResponse(
        task_id=task_id,
        status=task["status"],
        created_at=task.get("created_at"),
        updated_at=task.get("updated_at"),
        result=result,
        error=task.get("error"),
    )


# ── History ───────────────────────────────────────────────────────────────────


@router.get("/history")
async def get_history(
    task_svc: CVTaskService = Depends(get_task_service),
) -> dict:
    """Trả về lịch sử 20 lần tạo CV gần nhất."""
    return {"history": task_svc.get_history()}


@router.delete("/history", status_code=204)
async def clear_history(
    task_svc: CVTaskService = Depends(get_task_service),
) -> None:
    """Xóa toàn bộ history."""
    task_svc.clear_history()


# ── Cache stats ───────────────────────────────────────────────────────────────


@router.get("/cache/stats")
async def cache_stats() -> dict:
    """Trả về thống kê Redis cache (hits, misses, memory...)."""
    from cvcraft.infrastructure.cache.redis_cache import get_cache

    return get_cache().get_stats()


# ── File operations ───────────────────────────────────────────────────────────


@router.get("/download")
async def download_cv(path: str):
    """Tải file CV đã tạo (.docx)."""
    _require_existing_docx(path)
    return FileResponse(
        path,
        filename="cv.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/onlyoffice/config")
async def onlyoffice_config(path: str):
    """Trả về config mở file DOCX bằng OnlyOffice Docs."""
    file_path = _require_existing_docx(path)
    document_server_url = settings.onlyoffice_document_server_url.rstrip("/")
    if not document_server_url:
        return {"enabled": False, "reason": "ONLYOFFICE_DOCUMENT_SERVER_URL chưa được cấu hình"}

    public_api_url = settings.public_api_url.rstrip("/")
    encoded_path = quote(str(file_path), safe="")
    file_key = f"{file_path.name}-{int(file_path.stat().st_mtime)}-{file_path.stat().st_size}"

    return {
        "enabled": True,
        "documentServerUrl": document_server_url,
        "config": {
            "document": {
                "fileType": "docx",
                "key": file_key,
                "title": file_path.name,
                "url": f"{public_api_url}/v1/cv/download?path={encoded_path}",
            },
            "documentType": "word",
            "editorConfig": {
                "callbackUrl": f"{public_api_url}/v1/cv/onlyoffice/callback?path={encoded_path}",
                "lang": "vi",
                "mode": "edit",
                "user": {"id": "cvcraft-user", "name": "CVCraft User"},
            },
            "height": "100%",
            "type": "desktop",
            "width": "100%",
        },
    }


@router.post("/onlyoffice/callback")
async def onlyoffice_callback(path: str, payload: OnlyOfficeCallbackRequest):
    """
    Callback lưu file sau khi OnlyOffice hoàn tất chỉnh sửa.
    OnlyOffice gửi status=2 hoặc 6 kèm URL file mới.
    """
    file_path = _require_existing_docx(path)
    if payload.status not in {2, 6}:
        return {"error": 0}
    if not payload.url:
        return {"error": 1}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(payload.url)
        response.raise_for_status()
        file_path.write_bytes(response.content)

    return {"error": 0}


# ── RAG management ────────────────────────────────────────────────────────────


@router.get("/rag/stats")
async def rag_stats(
    service: RAGService = Depends(get_rag_service),
) -> dict:
    return service.get_stats()


class RagBuildRequest(BaseModel):
    source: str = Field("seed", description="'seed' | 'hf' | 'kaggle'")
    reset: bool = Field(False)
    max_records: int = Field(1000, ge=1)
    dataset_name: str | None = Field(None)
    csv_path: str | None = Field(None)
    include_seed: bool = Field(True)


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
    return {"running": _build_status["running"], "last_result": _build_status["last_result"]}


# ── Internal: rate limit helper ───────────────────────────────────────────────


def _apply_rate_limit(request: Request, limit: str) -> None:
    """Apply rate limit nếu slowapi được cài. Bỏ qua nếu không có."""
    try:
        from cvcraft.infrastructure.rate_limit.limiter import limiter

        if limiter is not None:
            limiter.limit(limit)(lambda r: None)(request)
    except Exception:
        pass
