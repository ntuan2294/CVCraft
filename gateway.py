"""
CVCraft unified API gateway — serves both services on a single port.

Run:
    uvicorn gateway:app --reload --port 8000
    # or
    python scripts/dev.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from cvcraft.generate_cv.api.v1 import cv as cv_router
from cvcraft.jd_search.api.v1 import jd as jd_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="CVCraft API",
        description="AI-powered CV generation and Job Description search",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
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
