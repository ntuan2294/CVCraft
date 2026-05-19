"""
Retriever - high-level interface cho RAG.
Các agent gọi qua đây thay vì gọi trực tiếp vector_store.
"""
from typing import Optional
from generate_cv.rag.vector_store import CVVectorStore


class RAGRetriever:
    """Wrapper cao cấp cho retrieval logic."""

    def __init__(self):
        self.store = CVVectorStore()

    def retrieve_summary_examples(
        self,
        job_title: str,
        job_description: str = "",
        industry: Optional[str] = None,
        seniority: Optional[str] = None,
        n_results: int = 3,
    ) -> list[dict]:
        query_parts = [job_title]
        if job_description:
            query_parts.append(job_description[:200])
        query_text = " ".join(query_parts)

        filter_dict = self._build_filter(industry, seniority)
        if filter_dict:
            results = self.store.query_summaries(
                query_text=query_text,
                n_results=n_results,
                filter_metadata=filter_dict,
            )
            if results:
                return results

        return self.store.query_summaries(
            query_text=query_text,
            n_results=n_results,
        )

    def retrieve_bullet_examples(
        self,
        position: str,
        position_description: str = "",
        industry: Optional[str] = None,
        seniority: Optional[str] = None,
        n_results: int = 5,
    ) -> list[dict]:
        query_parts = [position]
        if position_description:
            query_parts.append(position_description[:300])
        query_text = " ".join(query_parts)

        filter_dict = self._build_filter(industry, seniority)
        if filter_dict:
            results = self.store.query_bullets(
                query_text=query_text,
                n_results=n_results,
                filter_metadata=filter_dict,
            )
            if len(results) >= 2:
                return results

        return self.store.query_bullets(
            query_text=query_text,
            n_results=n_results,
        )

    @staticmethod
    def _build_filter(industry: Optional[str], seniority: Optional[str]) -> Optional[dict]:
        conditions = []
        if industry:
            conditions.append({"industry": industry})
        if seniority:
            conditions.append({"seniority": seniority})

        if not conditions:
            return None
        if len(conditions) == 1:
            return conditions[0]
        return {"$and": conditions}

    @staticmethod
    def format_examples_for_prompt(examples: list[dict], example_type: str = "summary") -> str:
        if not examples:
            return ""

        lines = [f"--- VÍ DỤ {example_type.upper()} CHẤT LƯỢNG CAO (tham khảo phong cách) ---\n"]

        for i, ex in enumerate(examples, 1):
            meta = ex.get("metadata", {})
            context = f"[{meta.get('job_title', 'Unknown')} - {meta.get('seniority', '')}]"
            lines.append(f"Ví dụ {i} {context}:")
            lines.append(ex["text"])
            lines.append("")

        lines.append("--- KẾT THÚC VÍ DỤ ---\n")
        lines.append(
            "LƯU Ý: Các ví dụ trên chỉ để tham khảo phong cách viết "
            "(STAR, lượng hóa, động từ mạnh). KHÔNG copy nội dung. "
            "Hãy viết dựa trên dữ liệu thực của user.\n"
        )

        return "\n".join(lines)
