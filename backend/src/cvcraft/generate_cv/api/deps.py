"""Dependency injection cho FastAPI."""
from functools import lru_cache

from cvcraft.generate_cv.services.cv_service import CVService
from cvcraft.generate_cv.services.rag_service import RAGService
from cvcraft.generate_cv.services.task_service import CVTaskService
from cvcraft.infrastructure.cache.redis_cache import get_cache


@lru_cache
def get_cv_service() -> CVService:
    return CVService()


@lru_cache
def get_rag_service() -> RAGService:
    return RAGService()


@lru_cache
def get_task_service() -> CVTaskService:
    return CVTaskService(cache=get_cache())
