"""
RAG Service - quản lý vector index.
"""
from cvcraft.rag.vector_store import CVVectorStore
from cvcraft.rag.indexer import index_samples


class RAGService:
    def __init__(self):
        self.store = CVVectorStore()

    def build_seed_index(self, reset: bool = False) -> dict:
        """Index 9 seed samples vào ChromaDB."""
        return index_samples(reset=reset)

    def get_stats(self) -> dict:
        """Trả về thống kê số lượng documents trong DB."""
        return {
            "summaries": self.store.summary_collection.count(),
            "bullets": self.store.bullet_collection.count(),
            "is_empty": self.store.is_empty(),
        }
