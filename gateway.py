"""
CVCraft unified API gateway — serves both services on a single port.

Run:
    uvicorn gateway:app --reload --port 8000
    # or
    python scripts/dev.py
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from cvcraft.generate_cv.api.v1 import cv as cv_router
from cvcraft.jd_search.api.v1 import jd as jd_router


async def _auto_seed_cv_rag():
    """Build CV RAG seed index nếu store đang rỗng (chạy ở background khi startup)."""
    try:
        from cvcraft.generate_cv.services.rag_service import RAGService
        service = RAGService()
        result = service.ensure_seed_index()
        if result.get("skipped"):
            print("[CVCraft] CV RAG: đã có data, bỏ qua auto-seed.")
        else:
            print(
                f"[CVCraft] CV RAG auto-seed: "
                f"{result['summaries_indexed']} summaries, "
                f"{result['bullets_indexed']} bullets indexed."
            )
    except Exception as e:
        print(f"[CVCraft] CV RAG auto-seed thất bại: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_auto_seed_cv_rag())
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

    app.include_router(cv_router.router, prefix="/v1/cv", tags=["cv"])
    app.include_router(jd_router.router, prefix="/v1/jd", tags=["jd-search"])

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "cvcraft", "version": "0.1.0"}

    return app


app = create_app()
