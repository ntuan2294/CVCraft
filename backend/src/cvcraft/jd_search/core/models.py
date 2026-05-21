"""
Data models cho tính năng RAG Job Description Search.
"""
from typing import Optional
from pydantic import BaseModel, Field


class JDRewrittenSections(BaseModel):
    job_description: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)


class JDDocument(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    industry: Optional[str] = None
    seniority: Optional[str] = None
    description: str
    required_skills: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    details: dict[str, str] = Field(default_factory=dict)
    rewritten_sections: JDRewrittenSections = Field(default_factory=JDRewrittenSections)
    description_bullets: list[str] = Field(default_factory=list)
    requirements_bullets: list[str] = Field(default_factory=list)
    benefits_bullets: list[str] = Field(default_factory=list)


class JDSearchResult(BaseModel):
    jd: JDDocument
    similarity_score: float


class JDSearchResponse(BaseModel):
    query: str
    top_jds: list[JDSearchResult]


class JDCardResult(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    industry: Optional[str] = None
    seniority: Optional[str] = None
    similarity_score: float


class JDSearchCardResponse(BaseModel):
    query: str
    results: list[JDCardResult]


class JDFormattedDetail(BaseModel):
    id: str
    description_bullets: list[str] = Field(default_factory=list)
    requirements_bullets: list[str] = Field(default_factory=list)
    benefits_bullets: list[str] = Field(default_factory=list)
    quick_info: dict[str, str] = Field(default_factory=dict)
