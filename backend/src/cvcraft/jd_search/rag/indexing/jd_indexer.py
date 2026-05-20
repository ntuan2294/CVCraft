"""
Index Job Descriptions từ HuggingFace vào ChromaDB `job_descriptions` collection.

Usage:
    python -m cvcraft.jd_search.rag.indexing.jd_indexer
    python -m cvcraft.jd_search.rag.indexing.jd_indexer --max-records 5000
    python -m cvcraft.jd_search.rag.indexing.jd_indexer --reset
    python -m cvcraft.jd_search.rag.indexing.jd_indexer --dry-run
"""
import argparse
import sys
import time
from cvcraft.jd_search.rag.vector_store import JDVectorStore
from cvcraft.jd_search.rag.loaders.hf_jd_loader import load_hf_jd_samples


def _upsert_with_retry(store: JDVectorStore, ids, texts, metadatas, max_retries: int = 5):
    delay = 10
    for attempt in range(max_retries):
        try:
            store.add_jds_batch(ids, texts, metadatas)
            return
        except Exception as e:
            if "rate_limit" in str(e).lower() or "429" in str(e) or "RateLimit" in type(e).__name__:
                if attempt < max_retries - 1:
                    print(f"  Rate limit, chờ {delay}s rồi thử lại...")
                    time.sleep(delay)
                    delay = min(delay * 2, 60)
                else:
                    raise
            else:
                raise

_SKIP_KEYS = {"id", "year"}


def _metadata_value(value) -> str:
    if isinstance(value, list):
        return ", ".join(str(item) for item in value if item)
    if value is None:
        return ""
    return str(value)


def _build_metadata(jd: dict, title_key: str, company_key: str | None = None) -> dict:
    metadata = {
        key: _metadata_value(value)
        for key, value in jd.items()
        if key not in _SKIP_KEYS
    }
    metadata["title"] = _metadata_value(jd.get(title_key))
    metadata["company"] = _metadata_value(jd.get(company_key)) if company_key else _metadata_value(jd.get("company"))
    metadata["industry"] = _metadata_value(jd.get("industry"))
    metadata["seniority"] = _metadata_value(jd.get("seniority"))
    metadata["required_skills"] = _metadata_value(jd.get("required_skills", []))
    metadata["keywords"] = _metadata_value(jd.get("keywords", []))
    metadata["description"] = _metadata_value(jd.get("description"))[:2000]
    return metadata


def _build_searchable_text(jd: dict, skip_keys: set = _SKIP_KEYS) -> str:
    parts = []
    for key, val in jd.items():
        if key in skip_keys:
            continue
        if isinstance(val, list):
            joined = " ".join(str(v) for v in val if v)
            if joined:
                parts.append(joined)
        elif val:
            parts.append(str(val))
    return " | ".join(parts)


def index_jd_samples(
    reset: bool = False,
    max_records: int = 3000,
    dry_run: bool = False,
) -> dict:
    store = JDVectorStore()

    if not reset and not store.is_empty():
        return {"skipped": True, "indexed": 0}

    print("\n[1/3] Load JD từ HuggingFace (year=2026)...")
    try:
        samples = load_hf_jd_samples(max_records=max_records)
    except Exception as e:
        print(f"LỖI khi load dataset: {type(e).__name__}: {e}")
        sys.exit(1)

    if not samples:
        print("Không load được JD nào hợp lệ.")
        sys.exit(1)

    if dry_run:
        print(f"\n[DRY RUN] Sẽ index {len(samples)} JDs — bỏ qua bước ghi vào DB.")
        return {"skipped": False, "indexed": 0, "dry_run": True}

    print(f"\n[2/3] Chuẩn bị batch ({len(samples)} JDs)...")
    ids, texts, metadatas = [], [], []
    for jd in samples:
        searchable_text = _build_searchable_text(jd)
        metadata = _build_metadata(jd, title_key="job_title", company_key="company_name")
        ids.append(jd["id"])
        texts.append(searchable_text)
        metadatas.append(metadata)

    print("\n[3/3] Reset collection và upsert vào ChromaDB...")
    if reset:
        store.reset()

    chunk_size = 100
    total_indexed = 0
    for i in range(0, len(ids), chunk_size):
        _upsert_with_retry(
            store,
            ids[i:i+chunk_size],
            texts[i:i+chunk_size],
            metadatas[i:i+chunk_size],
        )
        total_indexed += len(ids[i:i+chunk_size])
        print(f"  Indexed {total_indexed}/{len(ids)}...")
        time.sleep(0.5)

    return {"skipped": False, "indexed": total_indexed}


def index_seed_samples(reset: bool = False) -> dict:
    """Index JD seed samples (không cần HuggingFace)."""
    from cvcraft.jd_search.rag.seeds import JD_SEEDS

    store = JDVectorStore()

    if not reset and not store.is_empty():
        return {"skipped": True, "indexed": 0}

    if reset:
        store.reset()

    ids, texts, metadatas = [], [], []
    for jd in JD_SEEDS:
        searchable_text = _build_searchable_text(jd, skip_keys={"id"})
        metadata = _build_metadata(jd, title_key="title")
        ids.append(jd["id"])
        texts.append(searchable_text)
        metadatas.append(metadata)

    store.add_jds_batch(ids, texts, metadatas)
    return {"skipped": False, "indexed": len(ids)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index JD từ HuggingFace vào ChromaDB")
    parser.add_argument("--max-records", type=int, default=3000)
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print("=" * 70)
    print("JD Search - JD Indexer (tinixai/vietnamese-job-descriptions, year=2026)")
    print("=" * 70)

    result = index_jd_samples(
        reset=args.reset,
        max_records=args.max_records,
        dry_run=args.dry_run,
    )

    print("\n" + "=" * 70)
    if result.get("skipped"):
        print("DB đã có JD data. Dùng --reset để re-index.")
    elif result.get("dry_run"):
        print("DRY RUN hoàn tất — không có gì được ghi.")
    else:
        print(f"HOÀN TẤT — Indexed {result['indexed']} job descriptions.")
    print("=" * 70)
