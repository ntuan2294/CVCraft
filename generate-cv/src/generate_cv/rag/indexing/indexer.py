"""
Indexer: ingest CV data vào ChromaDB.
Chạy 1 lần khi setup, hoặc khi update dataset.

Usage:
    python -m generate_cv.rag.indexing.indexer           # ingest nếu DB rỗng
    python -m generate_cv.rag.indexing.indexer --reset   # xóa và ingest lại
    python -m generate_cv.rag.indexing.indexer --hf --max-records 1000
"""
import argparse
import sys
from generate_cv.rag.vector_store import CVVectorStore
from generate_cv.rag.seeds import CV_SAMPLES
from generate_cv.rag.loaders.hf_cv_loader import DEFAULT_HF_CV_DATASET, load_hf_cv_samples


def _metadata_value(value) -> str:
    if isinstance(value, list):
        return ", ".join(str(item) for item in value if item)
    if value is None:
        return ""
    return str(value)


def _metadata_base(sample: dict, source: str) -> dict:
    return {
        "source": source,
        "industry": _metadata_value(sample.get("industry")),
        "domain": _metadata_value(sample.get("domain")),
        "seniority": _metadata_value(sample.get("seniority")),
        "job_title": _metadata_value(sample.get("job_title")),
        "skills": _metadata_value(sample.get("skills", [])),
    }


def _index_sample_batch(store: CVVectorStore, samples: list[dict], source: str) -> dict:
    summary_count = 0
    bullet_count = 0

    for sample in samples:
        sample_id = sample["id"]
        metadata_base = _metadata_base(sample, source=source)

        summary = (sample.get("summary") or "").strip()
        if summary:
            store.add_summary(
                doc_id=f"sum_{sample_id}",
                text=summary,
                metadata=metadata_base,
            )
            summary_count += 1

        for i, bullet in enumerate(sample.get("experience_bullets", [])):
            bullet = (bullet or "").strip()
            if not bullet:
                continue
            store.add_bullet(
                doc_id=f"bul_{sample_id}_{i}",
                text=bullet,
                metadata=metadata_base,
            )
            bullet_count += 1

    return {"summaries_indexed": summary_count, "bullets_indexed": bullet_count}


def index_samples(reset: bool = False) -> dict:
    store = CVVectorStore()

    if reset:
        print("⚠️  Reset DB...")
        store.reset()

    if not reset and not store.is_empty():
        print("✓ DB đã có data. Skip indexing. Dùng --reset để re-index.")
        return {"summaries_indexed": 0, "bullets_indexed": 0, "skipped": True}

    counts = _index_sample_batch(store, CV_SAMPLES, source="tier1_seed")

    return {
        "summaries_indexed": counts["summaries_indexed"],
        "bullets_indexed": counts["bullets_indexed"],
        "skipped": False,
    }


def index_hf_samples(
    reset: bool = False,
    dataset_name: str = DEFAULT_HF_CV_DATASET,
    split: str = "train",
    max_records: int = 1000,
    cache_dir: str | None = None,
    include_seed: bool = True,
    dry_run: bool = False,
) -> dict:
    print("\n[1/3] Load CV Tier 2 từ HuggingFace...")
    samples = load_hf_cv_samples(
        dataset_name=dataset_name,
        split=split,
        max_records=max_records,
        cache_dir=cache_dir,
        streaming=True,
    )

    if dry_run:
        return {
            "summaries_indexed": 0,
            "bullets_indexed": 0,
            "hf_samples": len(samples),
            "skipped": False,
            "dry_run": True,
        }

    store = CVVectorStore()

    if not reset and not store.is_empty():
        print("✓ DB đã có data. Skip indexing. Dùng --reset để re-index.")
        return {"summaries_indexed": 0, "bullets_indexed": 0, "skipped": True}

    if reset:
        print("\n[2/3] Reset DB...")
        store.reset()
    else:
        print("\n[2/3] Ghi thêm vào DB hiện tại...")

    print("\n[3/3] Index samples...")
    total = {"summaries_indexed": 0, "bullets_indexed": 0}

    if include_seed:
        seed_counts = _index_sample_batch(store, CV_SAMPLES, source="tier1_seed")
        total["summaries_indexed"] += seed_counts["summaries_indexed"]
        total["bullets_indexed"] += seed_counts["bullets_indexed"]

    hf_counts = _index_sample_batch(store, samples, source="tier2_huggingface")
    total["summaries_indexed"] += hf_counts["summaries_indexed"]
    total["bullets_indexed"] += hf_counts["bullets_indexed"]

    return {
        **total,
        "hf_samples": len(samples),
        "seed_included": include_seed,
        "skipped": False,
        "dry_run": False,
    }


def main():
    parser = argparse.ArgumentParser(description="CV RAG Indexer")
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--hf", action="store_true", help="Index thêm CV Tier 2 từ HuggingFace")
    parser.add_argument("--dataset", default=DEFAULT_HF_CV_DATASET)
    parser.add_argument("--split", default="train")
    parser.add_argument("--max-records", type=int, default=1000)
    parser.add_argument("--cache-dir", default=None)
    parser.add_argument("--no-seed", action="store_true", help="Khi --hf, không index Tier 1 seed")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print("=" * 60)
    print("CV RAG Indexer")
    print("=" * 60)

    try:
        if args.hf:
            result = index_hf_samples(
                reset=args.reset,
                dataset_name=args.dataset,
                split=args.split,
                max_records=args.max_records,
                cache_dir=args.cache_dir,
                include_seed=not args.no_seed,
                dry_run=args.dry_run,
            )
        else:
            result = index_samples(reset=args.reset)

        if result["skipped"]:
            print("\n✓ Không có gì để index")
        elif result.get("dry_run"):
            print(f"\n✓ DRY RUN hoàn tất. Parsed {result.get('hf_samples', 0)} HF CV samples.")
        else:
            print(f"\n✅ Đã index thành công:")
            print(f"   - {result['summaries_indexed']} summaries")
            print(f"   - {result['bullets_indexed']} experience bullets")
            if "hf_samples" in result:
                print(f"   - {result['hf_samples']} HF CV samples")

        print("\n" + "=" * 60)
        print("Test query")
        print("=" * 60)

        store = CVVectorStore()
        test_query = "Senior backend engineer fintech Python AWS"
        print(f"\nQuery: '{test_query}'")
        print(f"\nTop 2 summaries:")
        results = store.query_summaries(test_query, n_results=2)
        for i, r in enumerate(results, 1):
            print(f"\n{i}. [{r['metadata']['industry']}/{r['metadata']['seniority']}] "
                  f"distance={r['distance']:.3f}")
            print(f"   {r['text'][:150]}...")

    except Exception as e:
        print(f"\n❌ LỖI: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
