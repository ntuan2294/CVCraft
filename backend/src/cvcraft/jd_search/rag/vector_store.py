"""
Vector store wrapper using ChromaDB.
Quản lý collection job_descriptions cho JD Search.
"""
import os
from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions
from cvcraft.config.settings import settings


class JDVectorStore:
    """
    Wrapper quanh ChromaDB cho JD Search.
    Singleton pattern - chỉ khởi tạo client 1 lần.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY chưa được set")

        self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=api_key,
            model_name="text-embedding-3-small",
        )

        db_path = settings.vectordb_path
        Path(db_path).mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=db_path)

        self.jd_collection = self.client.get_or_create_collection(
            name="job_descriptions",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

        self._initialized = True

    def is_empty(self) -> bool:
        try:
            return self.jd_collection.count() == 0
        except Exception:
            return True

    def reset(self):
        try:
            self.client.delete_collection("job_descriptions")
        except Exception:
            pass

        self.jd_collection = self.client.get_or_create_collection(
            name="job_descriptions",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def add_jd(self, doc_id: str, text: str, metadata: dict):
        self.jd_collection.upsert(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata],
        )

    def add_jds_batch(self, doc_ids: list[str], texts: list[str], metadatas: list[dict]):
        self.jd_collection.upsert(
            ids=doc_ids,
            documents=texts,
            metadatas=metadatas,
        )

    def query_jds(
        self,
        query_text: str,
        score_threshold: float | None = 0.5,
        max_candidates: int = 100,
    ) -> list[dict]:
        try:
            count = self.jd_collection.count()
        except Exception:
            return []
        if count == 0:
            return []

        n = min(max_candidates, count)
        results = self.jd_collection.query(
            query_texts=[query_text],
            n_results=n,
        )
        candidates = self._format_results(results)
        if score_threshold is None:
            return candidates
        return [
            r
            for r in candidates
            if (1 - (r["distance"] if r["distance"] is not None else 1.0)) >= score_threshold
        ]

    @staticmethod
    def _format_results(raw_results) -> list[dict]:
        if not raw_results["documents"] or not raw_results["documents"][0]:
            return []

        formatted = []
        docs = raw_results["documents"][0]
        ids = raw_results["ids"][0] if raw_results.get("ids") else ["unknown"] * len(docs)
        metas = raw_results["metadatas"][0] if raw_results["metadatas"] else [{}] * len(docs)
        distances = raw_results["distances"][0] if raw_results.get("distances") else [None] * len(docs)

        for doc_id, doc, meta, dist in zip(ids, docs, metas, distances):
            formatted.append({
                "id": doc_id,
                "text": doc,
                "metadata": meta,
                "distance": dist,
            })
        return formatted
