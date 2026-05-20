"""
Dependency injection cho FastAPI.
"""
from functools import lru_cache
from cvcraft.generate_cv.services.cv_service import CVService
from cvcraft.generate_cv.services.rag_service import RAGService


@lru_cache
def get_cv_service() -> CVService:
    return CVService()


@lru_cache
def get_rag_service() -> RAGService:
    return RAGService()
