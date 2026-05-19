"""
API endpoints cho tính năng RAG Job Description Search.

Routes:
    POST /v1/jd/search  - Semantic search (similarity >= 0.5) + JD section formatting
    POST /v1/jd/index   - Index 1 JD mới vào vector store
    GET  /v1/jd/stats   - Thống kê collection
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from jd_search.core.models import JDDocument, JDSearchResponse
from jd_search.services.jd_search_service import JDSearchService
from jd_search.api.deps import get_jd_search_service

router = APIRouter()


class JDSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Mô tả công việc hoặc kỹ năng mong muốn")


class JDIndexRequest(BaseModel):
    jd: JDDocument


@router.post("/search", response_model=JDSearchResponse)
def search_jds(
    request: JDSearchRequest,
    service: JDSearchService = Depends(get_jd_search_service),
):
    """
    Tìm kiếm Job Description theo ngữ nghĩa.

    - Embed query bằng text-embedding-3-small
    - Query ChromaDB lấy tối đa 100 candidates
    - Chỉ giữ lại JD có similarity_score >= 0.5
    - LLM (gpt-4o-mini) chuẩn hóa các section JD để hiển thị dạng bullet
    """
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
