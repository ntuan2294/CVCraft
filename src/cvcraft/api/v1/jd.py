"""
API endpoints cho tính năng RAG Job Description Search.

Routes:
    POST /v1/jd/search  - Semantic search + LLM suggestions
    POST /v1/jd/index   - Index 1 JD mới vào vector store
    GET  /v1/jd/stats   - Thống kê collection
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from cvcraft.core.jd_search_models import JDDocument, JDSearchResponse
from cvcraft.services.jd_search_service import JDSearchService
from cvcraft.api.deps import get_jd_search_service

router = APIRouter()


class JDSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Từ khóa hoặc mô tả công việc mong muốn")
    top_k: int = Field(5, ge=1, le=10, description="Số JD trả về (1-10)")
    industry: Optional[str] = Field(None, description="Lọc theo industry: tech, marketing, finance, design, product, sales, hr")
    seniority: Optional[str] = Field(None, description="Lọc theo cấp độ: junior, mid, senior")


class JDIndexRequest(BaseModel):
    jd: JDDocument


@router.post("/search", response_model=JDSearchResponse)
def search_jds(
    request: JDSearchRequest,
    service: JDSearchService = Depends(get_jd_search_service),
):
    """
    Tìm kiếm Job Description theo ngữ nghĩa và trả về gợi ý CV.

    - Embed query bằng text-embedding-3-small
    - Query ChromaDB lấy Top-K JD tương đồng
    - LLM (gpt-4o-mini) phân tích và gợi ý skills, keywords, projects
    """
    try:
        return service.search_and_suggest(
            query=request.query,
            top_k=request.top_k,
            industry=request.industry,
            seniority=request.seniority,
        )
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
