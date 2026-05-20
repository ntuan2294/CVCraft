"""
Loader cho CV/Resume Tier 2 từ Kaggle: snehaanbhawal/resume-dataset

Dataset schema:
  Category  - job category (e.g. "Java Developer", "Data Science")
  Resume    - full resume text

Download tự động qua kagglehub (cần KAGGLE_USERNAME + KAGGLE_KEY trong .env),
hoặc cung cấp path CSV đã tải sẵn.
"""
from __future__ import annotations

import csv
import os
from collections import Counter
from pathlib import Path

from cvcraft.generate_cv.rag.loaders.hf_cv_loader import parse_hf_cv_row


KAGGLE_DATASET = "snehaanbhawal/resume-dataset"
KAGGLE_FILE = "UpdatedResumeDataSet.csv"


def _download_kaggle_dataset(dataset: str, filename: str) -> Path:
    try:
        import kagglehub
    except ImportError:
        raise ImportError(
            "Cần cài 'kagglehub': pip install kagglehub\n"
            "Và set KAGGLE_USERNAME + KAGGLE_KEY trong .env"
        )

    kaggle_user = os.getenv("KAGGLE_USERNAME")
    kaggle_key = os.getenv("KAGGLE_KEY")
    if kaggle_user:
        os.environ["KAGGLE_USERNAME"] = kaggle_user
    if kaggle_key:
        os.environ["KAGGLE_KEY"] = kaggle_key

    print(f"Downloading Kaggle dataset: {dataset} ...")
    path = kagglehub.dataset_download(dataset)

    csv_path = Path(path) / filename
    if not csv_path.exists():
        csvs = sorted(Path(path).glob("**/*.csv"))
        if not csvs:
            raise FileNotFoundError(f"Không tìm thấy file CSV trong {path}")
        csv_path = csvs[0]
        print(f"  Dùng file: {csv_path.name}")

    return csv_path


def load_kaggle_cv_samples(
    csv_path: str | None = None,
    max_records: int = 1000,
    encoding: str = "utf-8",
) -> list[dict]:
    """
    Load và parse CV samples từ Kaggle CSV.

    Args:
        csv_path:    Path đến file CSV đã tải. Nếu None thì tự download qua kagglehub.
        max_records: Số CV hợp lệ tối đa (0 = không giới hạn).
        encoding:    Encoding của file CSV.
    """
    if csv_path is None:
        file_path = _download_kaggle_dataset(KAGGLE_DATASET, KAGGLE_FILE)
    else:
        file_path = Path(csv_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Không tìm thấy file: {csv_path}")

    print(f"Đang parse CV từ: {file_path} ...")

    parsed: list[dict] = []
    scanned = 0

    with open(file_path, encoding=encoding, errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            scanned += 1
            sample = parse_hf_cv_row(dict(row), scanned, source=f"kaggle:{KAGGLE_DATASET}")
            if sample:
                sample["id"] = f"cv_kaggle_{scanned}"
                parsed.append(sample)

            if scanned % 200 == 0:
                print(f"  Scanned {scanned:,} | Parsed {len(parsed):,}")

            if max_records and len(parsed) >= max_records:
                break

    print(f"Scanned {scanned:,} CV → {len(parsed):,} CV hợp lệ")
    print(f"  Industries:  {dict(Counter(s['industry'] for s in parsed).most_common())}")
    print(f"  Seniorities: {dict(Counter(s['seniority'] for s in parsed))}")

    return parsed
