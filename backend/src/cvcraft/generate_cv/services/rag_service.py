"""
RAG Service - quản lý vector index.
"""
from cvcraft.generate_cv.rag.vector_store import CVVectorStore
from cvcraft.generate_cv.rag.indexing.indexer import index_hf_samples, index_samples


class RAGService:
    def __init__(self):
        self.store = CVVectorStore()

    def ensure_seed_index(self) -> dict:
        """Build seed index nếu store đang rỗng. No-op nếu đã có data."""
        if not self.store.is_empty():
            return {"skipped": True, "summaries_indexed": 0, "bullets_indexed": 0}
        return index_samples(reset=False)

    def build_seed_index(self, reset: bool = False) -> dict:
        """Index seed samples vào ChromaDB."""
        return index_samples(reset=reset)

    def build_hf_index(
        self,
        reset: bool = False,
        dataset_name: str | None = None,
        split: str = "train",
        max_records: int = 1000,
        include_seed: bool = True,
        dry_run: bool = False,
    ) -> dict:
        """Index CV Tier 2 từ HuggingFace vào ChromaDB."""
        kwargs = {
            "reset": reset,
            "split": split,
            "max_records": max_records,
            "include_seed": include_seed,
            "dry_run": dry_run,
        }
        if dataset_name:
            kwargs["dataset_name"] = dataset_name
        return index_hf_samples(**kwargs)

    def get_stats(self) -> dict:
        return {
            "summaries": self.store.summary_collection.count(),
            "bullets": self.store.bullet_collection.count(),
            "is_empty": self.store.is_empty(),
        }
