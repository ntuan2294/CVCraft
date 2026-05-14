"""
Data models cho tính năng RAG Job Description Search.
"""
from typing import Optional
from pydantic import BaseModel


class JDDocument(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    industry: Optional[str] = None
    seniority: Optional[str] = None
    description: str
    required_skills: list[str] = []
    keywords: list[str] = []


class JDSearchResult(BaseModel):
    jd: JDDocument
    similarity_score: float


class JDSuggestion(BaseModel):
    skills_to_develop: list[str]
    cv_keywords: list[str]
    recommended_projects: list[str]
    summary_tips: str


class JDSearchResponse(BaseModel):
    query: str
    top_jds: list[JDSearchResult]
    suggestion: JDSuggestion
