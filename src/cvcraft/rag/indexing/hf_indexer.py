"""
HuggingFace dataset indexer.

Usage:
    python -m cvcraft.rag.indexing.hf_indexer                      # default: 300 mẫu top-quality
    python -m cvcraft.rag.indexing.hf_indexer --max-samples 500
    python -m cvcraft.rag.indexing.hf_indexer --target 100
    python -m cvcraft.rag.indexing.hf_indexer --reset
    python -m cvcraft.rag.indexing.hf_indexer --min-score 6.0
    python -m cvcraft.rag.indexing.hf_indexer --no-seed
"""
import argparse
import sys
from cvcraft.rag.vector_store import CVVectorStore
from cvcraft.rag.loaders.hf_loader import load_huggingface_resumes, parse_all_resumes
from cvcraft.rag.indexing.quality_filter import filter_quality
from cvcraft.rag.seeds import CV_SAMPLES


def index_seed_samples(store: CVVectorStore) -> tuple[int, int]:
    summary_count = 0
    bullet_count = 0

    for sample in CV_SAMPLES:
        sample_id = sample["id"]
        metadata = {
            "industry": sample["industry"],
            "domain": sample["domain"],
            "seniority": sample["seniority"],
            "job_title": sample["job_title"],
            "source": "seed",
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


def index_hf_samples(store: CVVectorStore, parsed_filtered: list[dict]) -> tuple[int, int]:
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


def show_distribution(parsed: list[dict]):
    from collections import Counter
    industries = Counter(s["industry"] for s in parsed)
    seniorities = Counter(s["seniority"] for s in parsed)
    domains = Counter(s["domain"] for s in parsed)
    print(f"\n  Phân bố:")
    print(f"    Industries: {dict(industries)}")
    print(f"    Seniorities: {dict(seniorities)}")
    print(f"    Top domains: {dict(domains.most_common(5))}")


def main():
    parser = argparse.ArgumentParser(description="Index HuggingFace resume dataset")
    parser.add_argument("--max-samples", type=int, default=1000)
    parser.add_argument("--target", type=int, default=300)
    parser.add_argument("--min-score", type=float, default=5.0)
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--no-seed", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print("=" * 70)
    print("CV RAG - HuggingFace Dataset Indexer")
    print("=" * 70)

    print("\n[1/4] Load dataset từ HuggingFace...")
    try:
        raw_samples = load_huggingface_resumes(max_samples=args.max_samples)
    except Exception as e:
        print(f"\n❌ LỖI khi load dataset: {type(e).__name__}: {e}")
        sys.exit(1)

    if not raw_samples:
        print("❌ Không load được sample nào")
        sys.exit(1)

    print("\n[2/4] Parse JSON → structured format...")
    parsed = parse_all_resumes(raw_samples)

    if not parsed:
        print("❌ Không parse được sample hợp lệ nào")
        sys.exit(1)

    show_distribution(parsed)

    print(f"\n[3/4] Filter chất lượng (min_score={args.min_score})...")
    filtered = filter_quality(parsed, min_score=args.min_score, target_count=args.target)

    if not filtered:
        print("❌ Không có sample nào pass filter. Hãy giảm --min-score")
        sys.exit(1)

    show_distribution(filtered)

    print("\n  Top 3 samples theo score:")
    for r in filtered[:3]:
        print(f"\n  [{r['quality_score']:.1f}] {r['job_title']} ({r['seniority']}/{r['industry']})")
        print(f"        Summary: {r['summary'][:120]}...")
        print(f"        Bullet: {r['experience_bullets'][0][:120]}...")

    if args.dry_run:
        print("\n[DRY RUN] Skip indexing")
        return

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

    print("\n" + "=" * 70)
    print("✅ HOÀN TẤT")
    print("=" * 70)
    print(f"  Total summaries: {seed_summary + hf_summary}")
    print(f"  Total bullets:   {seed_bullet + hf_bullet}")
    print(f"  Total samples:   {len(filtered) + (len(CV_SAMPLES) if not args.no_seed else 0)}")


if __name__ == "__main__":
    main()
