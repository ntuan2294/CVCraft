"""
CVCraft unified API gateway — serves both services on a single port.

Run:
    uvicorn gateway:app --reload --port 8000
    # or
    python scripts/dev.py
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cvcraft.generate_cv.api.v1 import cv as cv_router
from cvcraft.generate_cv.api.v1 import extract as extract_router
from cvcraft.review_cv.api.v1 import review_cv as review_cv_router
from cvcraft.jd_search.api.v1 import jd as jd_router

logger = logging.getLogger(__name__)


async def _auto_seed_cv_rag():
    """Build CV RAG index on startup: Kaggle if credentials available, else seed-only."""
    try:
        from cvcraft.generate_cv.services.rag_service import RAGService

        service = RAGService()
        if not service.store.is_empty():
            print("[CVCraft] CV RAG: data already indexed, skipping.")
            return

        result = service.build_hf_index(reset=False, include_seed=True)
        print(
            f"[CVCraft] CV RAG (HuggingFace): "
            f"{result['summaries_indexed']} summaries, "
            f"{result['bullets_indexed']} bullets indexed."
        )
    except Exception as e:
        print(f"[CVCraft] CV RAG auto-seed failed: {e}")


async def _auto_seed_jd_rag():
    """Build JD seed index if collection is empty (runs in background on startup)."""
    try:
        from cvcraft.jd_search.services.jd_search_service import JDSearchService

        service = JDSearchService()
        stats = service.get_stats()
        if not stats.get("is_empty"):
            print(f"[CVCraft] JD index: {stats['job_descriptions']} JDs already indexed, skipping.")
            return
        result = service.build_hf_index(reset=False)
        print(f"[CVCraft] JD auto-index: {result.get('indexed', 0)} JDs indexed from HuggingFace.")
    except Exception as e:
        print(f"[CVCraft] JD auto-seed failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_auto_seed_cv_rag())
    asyncio.create_task(_auto_seed_jd_rag())
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="CVCraft API",
        description="AI-powered CV generation and Job Description search",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiting (slowapi) — bỏ qua nếu chưa cài
    try:
        from slowapi.errors import RateLimitExceeded  # type: ignore
        from slowapi.middleware import SlowAPIMiddleware  # type: ignore
        import importlib

        try:
            limiter_mod = importlib.import_module("cvcraft.infrastructure.rate_limit.limiter")
            limiter = getattr(limiter_mod, "limiter", None)
            rate_limit_handler = getattr(limiter_mod, "rate_limit_handler", None)
        except ImportError:
            limiter = None
            rate_limit_handler = None

        if limiter is not None:
            app.state.limiter = limiter
            app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
            app.add_middleware(SlowAPIMiddleware)
            logger.info("[CVCraft] Rate limiting enabled")
    except ImportError:
        logger.warning("[CVCraft] slowapi không được cài. Rate limiting bị tắt.")

    app.include_router(cv_router.router, prefix="/v1/cv", tags=["cv"])
    app.include_router(extract_router.router, prefix="/v1/cv", tags=["extract"])
    app.include_router(review_cv_router.router, prefix="/v1/review-cv", tags=["review-cv"])
    app.include_router(jd_router.router, prefix="/v1/jd", tags=["jd-search"])

    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "service": "cvcraft",
            "version": "0.1.0",
        }

    return app


app = create_app()
