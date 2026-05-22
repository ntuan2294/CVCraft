"""
Tải dữ liệu ban đầu cho CVCraft vào ChromaDB:
  - JD data   : HuggingFace tinixai/vietnamese-job-descriptions (year=2026)
  - CV data   : HuggingFace C0ldSmi1e/resume-dataset

Usage:
    python scripts/download_data.py
    python scripts/download_data.py --reset
    python scripts/download_data.py --jd-only
    python scripts/download_data.py --cv-only
    python scripts/download_data.py --max-jd 2000 --max-cv 800
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_SRC = ROOT_DIR / "backend" / "src"

# Thêm backend/src vào sys.path để import cvcraft
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))


def _load_dotenv() -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv(ROOT_DIR / ".env")
    except ImportError:
        pass


def _check_openai_key() -> bool:
    key = os.getenv("OPENAI_API_KEY", "")
    return bool(key and not key.startswith("sk-your"))



def _separator(title: str) -> None:
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print('=' * 70)


def download_jd(reset: bool, max_records: int) -> dict:
    _separator("JD Data — HuggingFace (tinixai/vietnamese-job-descriptions)")
    from cvcraft.jd_search.services.jd_search_service import JDSearchService

    service = JDSearchService()
    stats = service.get_stats()

    if not reset and not stats["is_empty"]:
        print(f"[jd] Đã có {stats['job_descriptions']} JDs trong index. Bỏ qua.")
        print("[jd] Dùng --reset để tải lại.")
        return {"skipped": True, "indexed": stats["job_descriptions"]}

    t0 = time.time()
    result = service.build_hf_index(reset=reset, max_records=max_records)
    elapsed = time.time() - t0

    if result.get("skipped"):
        print("[jd] Skip — collection không rỗng.")
    else:
        print(f"[jd] Indexed {result['indexed']} JDs ({elapsed:.0f}s)")

    return result


def download_cv(reset: bool, max_records: int) -> dict:
    _separator("CV Data — HuggingFace (C0ldSmi1e/resume-dataset)")
    from cvcraft.generate_cv.services.rag_service import RAGService

    service = RAGService()

    if not reset and not service.store.is_empty():
        stats = service.get_stats()
        print(f"[cv] Đã có {stats['summaries']} summaries, {stats['bullets']} bullets. Bỏ qua.")
        print("[cv] Dùng --reset để tải lại.")
        return {"skipped": True}

    t0 = time.time()
    result = service.build_hf_index(reset=reset, max_records=max_records, include_seed=True)
    elapsed = time.time() - t0

    if result.get("skipped"):
        print("[cv] Skip — collection không rỗng.")
    else:
        print(
            f"[cv] Indexed {result['summaries_indexed']} summaries, "
            f"{result['bullets_indexed']} bullets "
            f"từ {result.get('hf_samples', 0)} CV ({elapsed:.0f}s)"
        )
    return result


def main() -> int:
    _load_dotenv()

    parser = argparse.ArgumentParser(
        description="Tải dữ liệu ban đầu cho CVCraft (JD + CV từ HuggingFace)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--reset", action="store_true", help="Xóa và tải lại toàn bộ")
    parser.add_argument("--jd-only", action="store_true", help="Chỉ tải JD data")
    parser.add_argument("--cv-only", action="store_true", help="Chỉ tải CV data")
    parser.add_argument("--max-jd", type=int, default=3000, help="Số JD tối đa (mặc định 3000)")
    parser.add_argument("--max-cv", type=int, default=1000, help="Số CV tối đa (mặc định 1000)")
    args = parser.parse_args()

    if not _check_openai_key():
        print("Lỗi: OPENAI_API_KEY chưa được set hoặc không hợp lệ.")
        print("Điền API key vào file .env trước khi chạy.")
        return 1

    print("\nCVCraft — Download dữ liệu ban đầu")
    print(f"  JD  : HuggingFace tinixai/vietnamese-job-descriptions (max {args.max_jd})")
    print(f"  CV  : HuggingFace C0ldSmi1e/resume-dataset (max {args.max_cv})")
    if args.reset:
        print("  Mode: RESET — xóa và tải lại toàn bộ")

    errors: list[str] = []

    if not args.cv_only:
        try:
            download_jd(reset=args.reset, max_records=args.max_jd)
        except Exception as e:
            print(f"\n[jd] Lỗi: {e}")
            errors.append(f"JD: {e}")

    if not args.jd_only:
        try:
            download_cv(reset=args.reset, max_records=args.max_cv)
        except Exception as e:
            print(f"\n[cv] Lỗi: {e}")
            errors.append(f"CV: {e}")

    _separator("Hoàn tất")
    if errors:
        print("Một số bước thất bại:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("Tải dữ liệu thành công. Chạy server:")
    print("  python scripts/dev.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
