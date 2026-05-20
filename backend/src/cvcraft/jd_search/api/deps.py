"""
Dependency injection cho FastAPI.
"""
from functools import lru_cache
from cvcraft.jd_search.services.jd_search_service import JDSearchService


@lru_cache
def get_jd_search_service() -> JDSearchService:
    return JDSearchService()
