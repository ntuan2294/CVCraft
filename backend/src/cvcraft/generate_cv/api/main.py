"""
FastAPI application factory - Generate CV service (standalone).

Run:
    uvicorn cvcraft.generate_cv.api.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from cvcraft.generate_cv.api.v1 import cv as cv_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="CVCraft - Generate CV API",
        description="AI-powered CV generation API with multi-agent pipeline",
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

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "generate-cv", "version": "0.1.0"}

    return app


app = create_app()
