"""
FastAPI application factory.

Run:
    uvicorn cvcraft.api.main:app --reload --port 8000
    # hoặc
    make api
"""
from fastapi import FastAPI
from cvcraft.api.v1 import cv as cv_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="CVCraft API",
        description="AI-powered CV generation API with multi-agent pipeline",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.include_router(cv_router.router, prefix="/v1/cv", tags=["cv"])

    @app.get("/health")
    def health():
        return {"status": "ok", "version": "0.1.0"}

    return app


app = create_app()
