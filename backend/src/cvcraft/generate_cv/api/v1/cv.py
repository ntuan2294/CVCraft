"""
CV generation endpoints.

POST /v1/cv/generate      - Tạo CV từ JD + user profile
GET  /v1/cv/rag/stats     - Thống kê RAG index
POST /v1/cv/rag/build     - Build / rebuild CV RAG index (seed | hf | kaggle)
"""
import os
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import quote
import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from cvcraft.config.settings import settings
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


class OnlyOfficeCallbackRequest(BaseModel):
    status: int
    url: str | None = None


def _require_existing_docx(path: str) -> Path:
    if not path:
        raise HTTPException(status_code=400, detail="Thiếu path")

    file_path = Path(path)
    if not file_path.exists() or file_path.suffix.lower() != ".docx":
        raise HTTPException(status_code=404, detail="File không tìm thấy")
    return file_path


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
        output_path = result.get("output_path")
        if request.user_input.get("template_path") and not output_path:
            renderer_messages = [
                msg for msg in result.get("messages", [])
                if "[Template Renderer]" in msg
            ]
            detail = renderer_messages[-1] if renderer_messages else "Không tạo được file CV từ template."
            raise HTTPException(status_code=500, detail=detail)
        score = result.get("quality_score")
        return GenerateCVResponse(
            status="success",
            output_path=output_path,
            quality_score=QualityScoreOut(**score.model_dump()) if score else None,
            cv_draft=result.get("cv_draft").model_dump() if result.get("cv_draft") else None,
            messages=result.get("messages", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


_tasks: dict[str, dict] = {}
_TASKS_MAX = 200


def _evict_tasks() -> None:
    if len(_tasks) <= _TASKS_MAX:
        return
    by_age = sorted(_tasks.items(), key=lambda kv: kv[1].get("created_at", 0))
    for task_id, _ in by_age[: len(_tasks) - _TASKS_MAX]:
        del _tasks[task_id]


@router.post("/generate/async", status_code=202)
async def generate_cv_async(
    request: GenerateCVRequest,
    service: CVService = Depends(get_cv_service),
):
    """Bắt đầu tạo CV ở background, trả về task_id ngay lập tức."""
    task_id = str(uuid.uuid4())
    _tasks[task_id] = {"status": "pending", "result": None, "error": None, "created_at": time.time()}
    _evict_tasks()

    def _run() -> None:
        _tasks[task_id]["status"] = "running"
        try:
            result = service.generate_cv(
                jd_text=request.job_description,
                user_input=request.user_input,
                max_revisions=request.max_revisions,
            )
            output_path = result.get("output_path")
            if request.user_input.get("template_path") and not output_path:
                renderer_msgs = [m for m in result.get("messages", []) if "[Template Renderer]" in m]
                detail = renderer_msgs[-1] if renderer_msgs else "Không tạo được file CV từ template."
                raise RuntimeError(detail)
            score = result.get("quality_score")
            _tasks[task_id].update({
                "status": "done",
                "result": {
                    "status": "success",
                    "output_path": output_path,
                    "quality_score": score.model_dump() if score else None,
                    "cv_draft": result.get("cv_draft").model_dump() if result.get("cv_draft") else None,
                    "messages": result.get("messages", []),
                },
            })
        except Exception as exc:
            _tasks[task_id].update({"status": "failed", "error": str(exc)})

    threading.Thread(target=_run, daemon=True).start()
    return {"task_id": task_id}


@router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Poll trạng thái của một async CV task."""
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task không tồn tại")
    return {"status": task["status"], "result": task.get("result"), "error": task.get("error")}


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

    OnlyOffice gửi status=2 hoặc 6 kèm URL file mới cần tải về.
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


@router.get("/rag/stats")
async def rag_stats(
    service: RAGService = Depends(get_rag_service),
) -> dict:
    """Trả về thống kê RAG vector store."""
    return service.get_stats()


class RagBuildRequest(BaseModel):
    source: str = Field("seed", description="Nguồn data: 'seed' | 'hf'")
    reset: bool = Field(False, description="Xóa và index lại từ đầu")
    max_records: int = Field(1000, ge=1, description="Số CV tối đa (chỉ áp dụng với hf)")
    dataset_name: str | None = Field(None, description="HuggingFace dataset id (chỉ dùng với source=hf)")
    include_seed: bool = Field(True, description="Kèm tier 1 seed khi index tier 2 (source=hf)")


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
