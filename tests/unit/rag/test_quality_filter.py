"""Unit tests cho quality filter - không cần LLM hay DB."""
from cvcraft.rag.indexing.quality_filter import (
    has_quantification, starts_with_strong_verb,
    has_placeholder, score_resume, filter_quality,
)


def test_has_quantification():
    assert has_quantification("Reduced latency by 40%")
    assert has_quantification("Managed team of 5 engineers")
    assert has_quantification("Generated $1M revenue")
    assert not has_quantification("Worked on backend systems")


def test_starts_with_strong_verb():
    assert starts_with_strong_verb("Led team of engineers")
    assert starts_with_strong_verb("Architected microservices platform")
    assert starts_with_strong_verb("Optimized database queries")
    assert not starts_with_strong_verb("Responsible for backend")
    assert not starts_with_strong_verb("Worked on features")


def test_has_placeholder():
    assert has_placeholder("Lorem ipsum dolor sit amet")
    assert has_placeholder("[placeholder text here]")
    assert not has_placeholder("Led team to deliver features")


def test_score_resume_good():
    resume = {
        "summary": "Senior Backend Engineer with 7 years architecting distributed systems "
                   "for fintech. Specialized in Python, Go, and AWS cloud-native architecture.",
        "experience_bullets": [
            "Architected microservices platform processing 50M+ daily transactions",
            "Led migration to Kubernetes, saving $180K annually in infrastructure",
            "Reduced P99 latency by 65% through Redis caching and database sharding",
        ],
    }
    result = score_resume(resume)
    assert result["score"] >= 5.0


def test_score_resume_bad():
    resume = {
        "summary": "Good worker.",
        "experience_bullets": ["Responsible for tasks", "Helped team"],
    }
    result = score_resume(resume)
    assert result["score"] < 5.0


def test_filter_quality_removes_low_scores():
    resumes = [
        {"summary": "Senior engineer with 7 years experience building distributed systems at scale.",
         "experience_bullets": [
             "Architected platform processing 50M+ daily transactions, reducing latency by 65%",
             "Led team of 6 engineers, reducing production incidents by 40%",
             "Built event-driven system using Kafka for 100K+ concurrent users",
         ]},
        {"summary": "Good person.", "experience_bullets": ["Did work"]},
    ]
    filtered = filter_quality(resumes, min_score=5.0)
    assert len(filtered) < len(resumes)
