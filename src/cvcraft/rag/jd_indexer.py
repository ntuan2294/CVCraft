"""
Index Job Descriptions từ HuggingFace vào ChromaDB `job_descriptions` collection.

Source: tinixai/vietnamese-job-descriptions (607K bản ghi JD tiếng Việt)
Strategy: streaming + stratified sampling để lấy đại diện đa ngành.

Usage:
    python -m cvcraft.rag.jd_indexer
    python -m cvcraft.rag.jd_indexer --target 5000 --max-scan 80000
    python -m cvcraft.rag.jd_indexer --reset
    python -m cvcraft.rag.jd_indexer --dry-run
"""
import argparse
import sys
from cvcraft.rag.vector_store import CVVectorStore
from cvcraft.rag.hf_jd_loader import load_hf_jd_samples


def index_jd_samples(
    reset: bool = False,
    target: int = 3000,
    max_scan: int = 50000,
    dry_run: bool = False,
) -> dict:
    store = CVVectorStore()

    if not reset and not store.is_jd_empty():
        return {"skipped": True, "indexed": 0}

    print("\n[1/3] Load JD từ HuggingFace...")
    try:
        samples = load_hf_jd_samples(target=target, max_scan=max_scan)
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
        searchable_text = (
            f"{jd['title']} | {jd.get('company', '')} | {jd.get('industry', '')} | "
            f"{jd.get('seniority', '')} | {' '.join(jd.get('required_skills', []))} | "
            f"{jd['description'][:500]}"
        )
        metadata = {
            "title": jd["title"],
            "company": jd.get("company") or "",
            "industry": jd.get("industry") or "",
            "seniority": jd.get("seniority") or "",
            "required_skills": ", ".join(jd.get("required_skills", [])),
            "keywords": ", ".join(jd.get("keywords", [])),
            "description": jd["description"][:2000],
        }
        ids.append(jd["id"])
        texts.append(searchable_text)
        metadatas.append(metadata)

    print(f"\n[3/3] Reset collection và upsert vào ChromaDB...")
    if reset:
        store.reset_jd()

    # Batch upsert theo chunk 500 để tránh timeout embedding API
    chunk_size = 500
    total_indexed = 0
    for i in range(0, len(ids), chunk_size):
        chunk_ids = ids[i: i + chunk_size]
        chunk_texts = texts[i: i + chunk_size]
        chunk_metas = metadatas[i: i + chunk_size]
        store.add_jds_batch(chunk_ids, chunk_texts, chunk_metas)
        total_indexed += len(chunk_ids)
        print(f"  Indexed {total_indexed}/{len(ids)}...")

    return {"skipped": False, "indexed": total_indexed}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index JD từ HuggingFace vào ChromaDB")
    parser.add_argument("--target", type=int, default=3000,
                        help="Số JD tối đa muốn index (default: 3000)")
    parser.add_argument("--max-scan", type=int, default=50000,
                        help="Số record HF quét qua để lọc (default: 50000)")
    parser.add_argument("--reset", action="store_true",
                        help="Xóa collection cũ và re-index")
    parser.add_argument("--dry-run", action="store_true",
                        help="Chạy thử không ghi vào DB")
    args = parser.parse_args()

    print("=" * 70)
    print("CVCraft - JD Indexer (tinixai/vietnamese-job-descriptions)")
    print("=" * 70)

    result = index_jd_samples(
        reset=args.reset,
        target=args.target,
        max_scan=args.max_scan,
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
