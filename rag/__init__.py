"""
RAG package - retrieval augmented generation cho CV agent.

Cung cấp:
- CVVectorStore: ChromaDB wrapper, singleton
- RAGRetriever: high-level query interface dùng bởi agents
- CV_SAMPLES: seed dataset (re-export từ data subpackage để tiện import)

Usage:
    from rag import RAGRetriever
    retriever = RAGRetriever()
    examples = retriever.retrieve_summary_examples(job_title="...")
"""
from .vector_store import CVVectorStore
from .retriever import RAGRetriever

# Re-export từ data subpackage để code khác chỉ cần `from rag import CV_SAMPLES`
from .data import CV_SAMPLES, filter_samples

__all__ = [
    # Core infrastructure
    "CVVectorStore",
    "RAGRetriever",
    # Dataset (re-exported từ rag.data)
    "CV_SAMPLES",
    "filter_samples",
]