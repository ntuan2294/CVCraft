"""
Indexer: ingest sample CV data vào ChromaDB.
Chạy 1 lần khi setup, hoặc khi update dataset.

Usage:
    python -m rag.indexer           # ingest nếu DB rỗng
    python -m rag.indexer --reset   # xóa và ingest lại
"""
import sys
from rag.vector_store import CVVectorStore
from rag.data.cv_samples import CV_SAMPLES


def index_samples(reset: bool = False) -> dict:
    """
    Ingest CV_SAMPLES vào vector DB.
    Trả về dict thống kê.
    """
    store = CVVectorStore()

    if reset:
        print("⚠️  Reset DB...")
        store.reset()

    if not reset and not store.is_empty():
        print("✓ DB đã có data. Skip indexing. Dùng --reset để re-index.")
        return {
            "summaries_indexed": 0,
            "bullets_indexed": 0,
            "skipped": True,
        }

    summary_count = 0
    bullet_count = 0

    for sample in CV_SAMPLES:
        sample_id = sample["id"]
        metadata_base = {
            "industry": sample["industry"],
            "domain": sample["domain"],
            "seniority": sample["seniority"],
            "job_title": sample["job_title"],
        }

        # Index summary
        store.add_summary(
            doc_id=f"sum_{sample_id}",
            text=sample["summary"],
            metadata=metadata_base,
        )
        summary_count += 1

        # Index từng bullet point riêng
        for i, bullet in enumerate(sample["experience_bullets"]):
            store.add_bullet(
                doc_id=f"bul_{sample_id}_{i}",
                text=bullet,
                metadata=metadata_base,
            )
            bullet_count += 1

    return {
        "summaries_indexed": summary_count,
        "bullets_indexed": bullet_count,
        "skipped": False,
    }


def main():
    reset = "--reset" in sys.argv

    print("=" * 60)
    print("CV RAG Indexer")
    print("=" * 60)

    try:
        result = index_samples(reset=reset)

        if result["skipped"]:
            print("\n✓ Không có gì để index")
        else:
            print(f"\n✅ Đã index thành công:")
            print(f"   - {result['summaries_indexed']} summaries")
            print(f"   - {result['bullets_indexed']} experience bullets")

        # Test query nhanh
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

        print(f"\nTop 3 bullets:")
        results = store.query_bullets(test_query, n_results=3)
        for i, r in enumerate(results, 1):
            print(f"\n{i}. [{r['metadata']['domain']}] distance={r['distance']:.3f}")
            print(f"   {r['text'][:150]}")

    except Exception as e:
        print(f"\n❌ LỖI: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()