"""
Vector store wrapper using ChromaDB.
Quản lý 3 collection riêng:
- summary_samples: các professional summary mẫu
- experience_bullets: các bullet point mẫu
- job_descriptions: JD để semantic search

Lý do tách collection: query khác nhau, embedding optimize riêng được.
"""
import os
from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions
from cvcraft.config.settings import settings


class CVVectorStore:
    """
    Wrapper quanh ChromaDB cho CV RAG.
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

        self.summary_collection = self.client.get_or_create_collection(
            name="summary_samples",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

        self.bullet_collection = self.client.get_or_create_collection(
            name="experience_bullets",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

        self.jd_collection = self.client.get_or_create_collection(
            name="job_descriptions",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

        self._initialized = True

    def is_empty(self) -> bool:
        return (self.summary_collection.count() == 0
                or self.bullet_collection.count() == 0)

    def is_jd_empty(self) -> bool:
        try:
            return self.jd_collection.count() == 0
        except Exception:
            return True

    def reset(self):
        try:
            self.client.delete_collection("summary_samples")
            self.client.delete_collection("experience_bullets")
        except Exception:
            pass

        self.summary_collection = self.client.get_or_create_collection(
            name="summary_samples",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
        self.bullet_collection = self.client.get_or_create_collection(
            name="experience_bullets",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def reset_jd(self):
        try:
            self.client.delete_collection("job_descriptions")
        except Exception:
            pass

        self.jd_collection = self.client.get_or_create_collection(
            name="job_descriptions",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def add_summary(self, doc_id: str, text: str, metadata: dict):
        self.summary_collection.add(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata],
        )

    def add_bullet(self, doc_id: str, text: str, metadata: dict):
        self.bullet_collection.add(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata],
        )

    def query_summaries(self, query_text: str, n_results: int = 3,
                        filter_metadata: dict = None) -> list[dict]:
        kwargs = {
            "query_texts": [query_text],
            "n_results": n_results,
        }
        if filter_metadata:
            kwargs["where"] = filter_metadata

        results = self.summary_collection.query(**kwargs)
        return self._format_results(results)

    def query_bullets(self, query_text: str, n_results: int = 5,
                      filter_metadata: dict = None) -> list[dict]:
        kwargs = {
            "query_texts": [query_text],
            "n_results": n_results,
        }
        if filter_metadata:
            kwargs["where"] = filter_metadata

        results = self.bullet_collection.query(**kwargs)
        return self._format_results(results)

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

    def query_jds(self, query_text: str, n_results: int = 5,
                  filter_metadata: dict = None) -> list[dict]:
        try:
            count = self.jd_collection.count()
        except Exception:
            return []
        if count == 0:
            return []
        effective_n = min(n_results, count)
        kwargs = {
            "query_texts": [query_text],
            "n_results": effective_n,
        }
        if filter_metadata:
            kwargs["where"] = filter_metadata
        results = self.jd_collection.query(**kwargs)
        return self._format_results(results)

    @staticmethod
    def _format_results(raw_results) -> list[dict]:
        if not raw_results["documents"] or not raw_results["documents"][0]:
            return []

        formatted = []
        docs = raw_results["documents"][0]
        metas = raw_results["metadatas"][0] if raw_results["metadatas"] else [{}] * len(docs)
        distances = raw_results["distances"][0] if raw_results.get("distances") else [None] * len(docs)

        for doc, meta, dist in zip(docs, metas, distances):
            formatted.append({
                "text": doc,
                "metadata": meta,
                "distance": dist,
            })
        return formatted
