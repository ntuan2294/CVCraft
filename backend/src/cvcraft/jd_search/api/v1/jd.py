"""
API endpoints cho tính năng RAG Job Description Search.

Routes:
    POST /v1/jd/search        - Semantic search (similarity >= 0.5) + JD section formatting
    POST /v1/jd/index         - Index 1 JD mới vào vector store
    GET  /v1/jd/stats         - Thống kê collection
    POST /v1/jd/rag/build     - Build JD seed index
    GET  /v1/jd/rag/build/status
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from cvcraft.jd_search.core.models import JDDocument, JDSearchResponse
from cvcraft.jd_search.services.jd_search_service import JDSearchService
from cvcraft.jd_search.api.deps import get_jd_search_service

router = APIRouter()


class JDSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Mô tả công việc hoặc kỹ năng mong muốn")


class JDIndexRequest(BaseModel):
    jd: JDDocument


class JDRagBuildRequest(BaseModel):
    source: str = Field("seed", description="'seed' | 'hf'")
    reset: bool = Field(False)
    max_records: int = Field(3000, ge=1)


_build_status: dict = {"running": False, "last_result": None}


@router.post("/search", response_model=JDSearchResponse)
def search_jds(
    request: JDSearchRequest,
    service: JDSearchService = Depends(get_jd_search_service),
):
    try:
        return service.search(query=request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/index", status_code=201)
def index_jd(
    request: JDIndexRequest,
    service: JDSearchService = Depends(get_jd_search_service),
):
    """Index một Job Description mới vào vector store."""
    try:
        service.index_jd(request.jd)
        return {"status": "indexed", "id": request.jd.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
def jd_stats(service: JDSearchService = Depends(get_jd_search_service)):
    """Trả về thống kê collection job_descriptions."""
    return service.get_stats()


def _run_jd_build(request: JDRagBuildRequest, service: JDSearchService):
    _build_status["running"] = True
    try:
        if request.source == "seed":
            result = service.build_seed_index(reset=request.reset)
        elif request.source == "hf":
            result = service.build_hf_index(reset=request.reset, max_records=request.max_records)
        else:
            result = {"error": f"source không hợp lệ: {request.source}"}
        _build_status["last_result"] = result
    except Exception as e:
        _build_status["last_result"] = {"error": str(e)}
    finally:
        _build_status["running"] = False


@router.post("/rag/build", status_code=202)
async def build_jd_rag_index(
    request: JDRagBuildRequest,
    background_tasks: BackgroundTasks,
    service: JDSearchService = Depends(get_jd_search_service),
):
    """Build JD RAG index ở background. source='seed' (~2s) hoặc 'hf' (~vài phút)."""
    if _build_status["running"]:
        raise HTTPException(status_code=409, detail="Đang có build đang chạy")
    background_tasks.add_task(_run_jd_build, request, service)
    return {
        "status": "accepted",
        "message": f"Đang build JD index từ source='{request.source}'",
        "check_url": "/v1/jd/rag/build/status",
    }


@router.get("/rag/build/status")
async def jd_rag_build_status():
    """Trạng thái build JD RAG index hiện tại."""
    return {"running": _build_status["running"], "last_result": _build_status["last_result"]}
