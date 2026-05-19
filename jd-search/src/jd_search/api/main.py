"""
FastAPI application factory - JD Search service.

Run:
    uvicorn jd_search.api.main:app --reload --port 8001
    # hoặc
    make api
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from jd_search.api.v1 import jd as jd_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="CVCraft - JD Search API",
        description="Semantic Job Description search with AI-formatted JD sections",
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

    app.include_router(jd_router.router, prefix="/v1/jd", tags=["jd-search"])

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "jd-search", "version": "0.1.0"}

    return app


app = create_app()
