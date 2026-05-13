"""
HuggingFace dataset indexer.

Pipeline:
1. Load dataset từ HuggingFace
2. Parse JSON -> structured format
3. Filter chất lượng (heuristic, không cần LLM)
4. Index vào ChromaDB

Usage:
    python -m rag.hf_indexer                      # default: 300 mẫu top-quality
    python -m rag.hf_indexer --max-samples 500    # filter từ 500 raw samples
    python -m rag.hf_indexer --target 100         # giữ top 100 sau filter
    python -m rag.hf_indexer --reset              # reset DB trước khi index
    python -m rag.hf_indexer --min-score 6.0      # threshold filter strict hơn
    python -m rag.hf_indexer --keep-seed          # giữ seed samples (default)
    python -m rag.hf_indexer --no-seed            # CHỈ dùng HF data, bỏ seed
"""
import argparse
import sys
from data.rag.vector_store import CVVectorStore
from data.hf_loader import load_huggingface_resumes, parse_all_resumes
from data.quality_filter import filter_quality
from data.cv_samples import CV_SAMPLES


def index_seed_samples(store: CVVectorStore) -> tuple[int, int]:
    """Index 9 mẫu seed (curated)."""
    summary_count = 0
    bullet_count = 0

    for sample in CV_SAMPLES:
        sample_id = sample["id"]
        metadata = {
            "industry": sample["industry"],
            "domain": sample["domain"],
            "seniority": sample["seniority"],
            "job_title": sample["job_title"],
            "source": "seed",  # đánh dấu nguồn
        }

        store.add_summary(
            doc_id=f"sum_{sample_id}",
            text=sample["summary"],
            metadata=metadata,
        )
        summary_count += 1

        for i, bullet in enumerate(sample["experience_bullets"]):
            store.add_bullet(
                doc_id=f"bul_{sample_id}_{i}",
                text=bullet,
                metadata=metadata,
            )
            bullet_count += 1

    return summary_count, bullet_count


def index_hf_samples(
    store: CVVectorStore,
    parsed_filtered: list[dict],
) -> tuple[int, int]:
    """Index parsed + filtered samples từ HuggingFace."""
    summary_count = 0
    bullet_count = 0

    for sample in parsed_filtered:
        sample_id = sample["id"]
        metadata = {
            "industry": sample["industry"],
            "domain": sample["domain"],
            "seniority": sample["seniority"],
            "job_title": sample["job_title"],
            "source": "huggingface",
            "quality_score": float(sample.get("quality_score", 0)),
        }

        # Index summary
        store.add_summary(
            doc_id=f"sum_{sample_id}",
            text=sample["summary"],
            metadata=metadata,
        )
        summary_count += 1

        # Index bullets
        for i, bullet in enumerate(sample["experience_bullets"]):
            store.add_bullet(
                doc_id=f"bul_{sample_id}_{i}",
                text=bullet,
                metadata=metadata,
            )
            bullet_count += 1

    return summary_count, bullet_count


def show_distribution(parsed: list[dict]):
    """Hiển thị phân bố industry/seniority/domain."""
    from collections import Counter

    industries = Counter(s["industry"] for s in parsed)
    seniorities = Counter(s["seniority"] for s in parsed)
    domains = Counter(s["domain"] for s in parsed)

    print("\n  Phân bố:")
    print(f"    Industries: {dict(industries)}")
    print(f"    Seniorities: {dict(seniorities)}")
    print(f"    Top domains: {dict(domains.most_common(5))}")


def main():
    parser = argparse.ArgumentParser(description="Index HuggingFace resume dataset")
    parser.add_argument("--max-samples", type=int, default=1000,
                        help="Max raw samples từ HF (default: 1000)")
    parser.add_argument("--target", type=int, default=300,
                        help="Số mẫu top-quality giữ lại sau filter (default: 300)")
    parser.add_argument("--min-score", type=float, default=5.0,
                        help="Threshold quality score (default: 5.0)")
    parser.add_argument("--reset", action="store_true",
                        help="Reset DB trước khi index")
    parser.add_argument("--no-seed", action="store_true",
                        help="Bỏ qua seed samples, chỉ dùng HF data")
    parser.add_argument("--dry-run", action="store_true",
                        help="Chỉ load + filter, không index vào DB")
    args = parser.parse_args()

    print("=" * 70)
    print("CV RAG - HuggingFace Dataset Indexer")
    print("=" * 70)

    # === BƯỚC 1: LOAD ===
    print("\n[1/4] Load dataset từ HuggingFace...")
    try:
        raw_samples = load_huggingface_resumes(max_samples=args.max_samples)
    except Exception as e:
        print(f"\n❌ LỖI khi load dataset: {type(e).__name__}: {e}")
        print("\nGợi ý:")
        print("  - Kiểm tra kết nối internet")
        print("  - pip install datasets")
        print("  - Có thể cần huggingface-cli login nếu dataset private")
        sys.exit(1)

    if not raw_samples:
        print("❌ Không load được sample nào")
        sys.exit(1)

    # === BƯỚC 2: PARSE ===
    print("\n[2/4] Parse JSON → structured format...")
    parsed = parse_all_resumes(raw_samples)

    if not parsed:
        print("❌ Không parse được sample hợp lệ nào")
        sys.exit(1)

    show_distribution(parsed)

    # === BƯỚC 3: FILTER QUALITY ===
    print(f"\n[3/4] Filter chất lượng (min_score={args.min_score})...")
    filtered = filter_quality(
        parsed,
        min_score=args.min_score,
        target_count=args.target,
    )

    if not filtered:
        print("❌ Không có sample nào pass filter. Hãy giảm --min-score")
        sys.exit(1)

    show_distribution(filtered)

    # In top 3 example để check
    print("\n  Top 3 samples theo score:")
    for r in filtered[:3]:
        print(f"\n  [{r['quality_score']:.1f}] {r['job_title']} ({r['seniority']}/{r['industry']})")
        print(f"        Summary: {r['summary'][:120]}...")
        print(f"        Bullet: {r['experience_bullets'][0][:120]}...")

    if args.dry_run:
        print("\n[DRY RUN] Skip indexing")
        return

    # === BƯỚC 4: INDEX ===
    print("\n[4/4] Index vào ChromaDB...")
    store = CVVectorStore()

    if args.reset:
        print("⚠️  Reset DB...")
        store.reset()

    seed_summary = seed_bullet = 0
    if not args.no_seed:
        print("  → Index seed samples...")
        seed_summary, seed_bullet = index_seed_samples(store)
        print(f"    Indexed {seed_summary} summaries, {seed_bullet} bullets")

    print("  → Index HuggingFace samples...")
    hf_summary, hf_bullet = index_hf_samples(store, filtered)
    print(f"    Indexed {hf_summary} summaries, {hf_bullet} bullets")

    # === SUMMARY ===
    print("\n" + "=" * 70)
    print("✅ HOÀN TẤT")
    print("=" * 70)
    total_summary = seed_summary + hf_summary
    total_bullet = seed_bullet + hf_bullet
    print(f"  Total summaries: {total_summary}")
    print(f"  Total bullets:   {total_bullet}")
    print(f"  Total samples:   {len(filtered) + (len(CV_SAMPLES) if not args.no_seed else 0)}")

    # === TEST QUERY ===
    print("\n" + "=" * 70)
    print("Test query")
    print("=" * 70)

    test_queries = [
        ("Senior backend engineer Python AWS", "tech", "senior"),
        ("Junior frontend developer React", "tech", "junior"),
    ]

    for query, industry, seniority in test_queries:
        print(f"\nQuery: '{query}' (filter: {industry}/{seniority})")
        results = store.query_summaries(
            query, n_results=2,
            filter_metadata={"$and": [
                {"industry": industry},
                {"seniority": seniority},
            ]}
        )
        for i, r in enumerate(results, 1):
            src = r["metadata"].get("source", "?")
            print(f"  {i}. [{src}] {r['metadata']['job_title']} (dist={r['distance']:.3f})")
            print(f"     {r['text'][:130]}...")


if __name__ == "__main__":
    main()