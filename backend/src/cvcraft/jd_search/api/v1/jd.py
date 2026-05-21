"""
API endpoints cho tính năng RAG Job Description Search.

Routes:
    POST /v1/jd/search  - Semantic search (similarity >= 0.5) + JD section formatting
    POST /v1/jd/index   - Index 1 JD mới vào vector store
    GET  /v1/jd/stats   - Thống kê collection
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from cvcraft.jd_search.core.models import JDDocument, JDSearchResponse, JDSearchCardResponse, JDFormattedDetail
from cvcraft.jd_search.services.jd_search_service import JDSearchService
from cvcraft.jd_search.api.deps import get_jd_search_service

router = APIRouter()


class JDSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Mô tả công việc hoặc kỹ năng mong muốn")


class JDIndexRequest(BaseModel):
    jd: JDDocument


class JDFormatRequest(BaseModel):
    jd_id: str


@router.post("/search", response_model=JDSearchCardResponse)
def search_jds(
    request: JDSearchRequest,
    service: JDSearchService = Depends(get_jd_search_service),
):
    try:
        return service.search_cards(query=request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/format", response_model=JDFormattedDetail)
def format_jd(
    request: JDFormatRequest,
    service: JDSearchService = Depends(get_jd_search_service),
):
    try:
        return service.format_jd(jd_id=request.jd_id)
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
