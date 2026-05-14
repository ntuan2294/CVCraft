"""
Service layer cho tính năng RAG JD Search.
Orchestrates: vector search → reconstruct JDDocument → LLM suggestions.
"""
from typing import Optional
from cvcraft.core.jd_search_models import (
    JDDocument,
    JDSearchResult,
    JDSearchResponse,
)
from cvcraft.rag.vector_store import CVVectorStore
from cvcraft.rag.indexing.jd_indexer import index_jd_samples
from cvcraft.agents.jd_suggestion_agent import generate_jd_suggestions


class JDSearchService:
    def __init__(self):
        self._store = CVVectorStore()

    def search_and_suggest(
        self,
        query: str,
        top_k: int = 5,
        industry: Optional[str] = None,
        seniority: Optional[str] = None,
    ) -> JDSearchResponse:
        filter_metadata = self._build_filter(industry, seniority)
        raw_results = self._store.query_jds(
            query_text=query,
            n_results=top_k,
            filter_metadata=filter_metadata,
        )

        top_jds = [self._to_search_result(r) for r in raw_results]
        suggestion = generate_jd_suggestions(query=query, top_jds=top_jds)

        return JDSearchResponse(query=query, top_jds=top_jds, suggestion=suggestion)

    def index_jd(self, jd: JDDocument) -> None:
        searchable_text = (
            f"{jd.title} | {jd.company or ''} | {jd.industry or ''} | "
            f"{jd.seniority or ''} | {' '.join(jd.required_skills)} | "
            f"{jd.description}"
        )
        metadata = {
            "title": jd.title,
            "company": jd.company or "",
            "industry": jd.industry or "",
            "seniority": jd.seniority or "",
            "required_skills": ", ".join(jd.required_skills),
            "keywords": ", ".join(jd.keywords),
            "description": jd.description,
        }
        self._store.add_jd(doc_id=jd.id, text=searchable_text, metadata=metadata)

    def build_hf_index(
        self,
        reset: bool = False,
        target: int = 3000,
        max_scan: int = 50000,
    ) -> dict:
        return index_jd_samples(reset=reset, target=target, max_scan=max_scan)

    def get_stats(self) -> dict:
        count = self._store.jd_collection.count()
        return {"job_descriptions": count, "is_empty": count == 0}

    @staticmethod
    def _build_filter(
        industry: Optional[str],
        seniority: Optional[str],
    ) -> Optional[dict]:
        conditions = []
        if industry:
            conditions.append({"industry": {"$eq": industry}})
        if seniority:
            conditions.append({"seniority": {"$eq": seniority}})

        if len(conditions) == 0:
            return None
        if len(conditions) == 1:
            return conditions[0]
        return {"$and": conditions}

    @staticmethod
    def _to_search_result(raw: dict) -> JDSearchResult:
        meta = raw.get("metadata", {})
        distance = raw.get("distance")
        similarity = round(1 - distance, 4) if distance is not None else 0.0

        jd = JDDocument(
            id=meta.get("title", "unknown").replace(" ", "_").lower(),
            title=meta.get("title", ""),
            company=meta.get("company") or None,
            industry=meta.get("industry") or None,
            seniority=meta.get("seniority") or None,
            description=meta.get("description", raw.get("text", "")),
            required_skills=[s.strip() for s in meta.get("required_skills", "").split(",") if s.strip()],
            keywords=[k.strip() for k in meta.get("keywords", "").split(",") if k.strip()],
        )
        return JDSearchResult(jd=jd, similarity_score=similarity)
