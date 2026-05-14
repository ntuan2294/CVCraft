"""
Dependency injection cho FastAPI.
Dùng lru_cache để reuse service instance (không rebuild graph mỗi request).
"""
from functools import lru_cache
from cvcraft.services.cv_service import CVService
from cvcraft.services.rag_service import RAGService


@lru_cache
def get_cv_service() -> CVService:
    return CVService()


@lru_cache
def get_rag_service() -> RAGService:
    return RAGService()
