"""
Loader cho HuggingFace dataset 'tinixai/vietnamese-job-descriptions'.
Chỉ lấy bản ghi có year=2026.
Kết quả trả về giữ nguyên tên cột gốc của dataset + các trường phái sinh.
"""
import re
from collections import Counter
from typing import Optional

from cvcraft.jd_search.text_preprocessing import preprocess_jd_text


# ── Mapping seniority ────────────────────────────────────────────────────────

_SENIOR_POSITION_KW = {
    "giám đốc", "director", "head of", "trưởng phòng", "phó giám đốc",
    "vp ", "cto", "cfo", "ceo", "chief", "senior", "principal", "architect",
    "quản lý", "manager", "lead", "leader", "trưởng nhóm",
}
_JUNIOR_POSITION_KW = {
    "thực tập", "intern", "fresher", "entry", "junior", "jr.", "trainee",
    "nhân viên mới",
}


def _map_seniority(experience_level: str, job_position: str) -> str:
    pos = (job_position or "").lower()
    exp = (experience_level or "").lower()

    if any(k in pos for k in _SENIOR_POSITION_KW):
        return "senior"
    if any(k in pos for k in _JUNIOR_POSITION_KW):
        return "junior"
    if "không yêu cầu" in exp or "chưa có" in exp:
        return "junior"

    return "mid"


# ── Mapping industry ──────────────────────────────────────────────────────────

_INDUSTRY_MAP = {
    "tech": [
        "it phần mềm", "công nghệ thông tin", "phần mềm", "it ", "software",
        "lập trình", "developer", "kỹ thuật phần mềm", "data", "ai ", "machine learning",
        "devops", "cloud", "mạng", "an toàn thông tin", "bảo mật",
    ],
    "marketing": [
        "marketing", "truyền thông", "quảng cáo", "pr ", "brand", "digital",
        "content", "seo", "social media",
    ],
    "finance": [
        "tài chính", "kế toán", "kiểm toán", "ngân hàng", "chứng khoán",
        "bảo hiểm", "đầu tư", "finance", "accounting",
    ],
    "sales": [
        "kinh doanh", "bán hàng", "sales", "business development",
        "telesales", "thương mại",
    ],
    "design": [
        "thiết kế", "design", "ux", "ui ", "đồ họa", "sáng tạo", "creative",
    ],
    "hr": [
        "nhân sự", "hành chính", "tuyển dụng", "hr ", "human resource",
        "recruitment",
    ],
    "product": [
        "product", "sản phẩm", "quản lý sản phẩm",
    ],
    "engineering": [
        "cơ khí", "xây dựng", "điện", "điện tử", "kỹ thuật", "engineering",
        "sản xuất", "chế tạo",
    ],
    "education": [
        "giáo dục", "đào tạo", "giảng dạy", "education", "teacher",
    ],
    "healthcare": [
        "y tế", "dược", "bệnh viện", "sức khỏe", "healthcare", "medical",
    ],
}


def _map_industry(job_industry: str) -> str:
    text = (job_industry or "").lower()
    for industry, keywords in _INDUSTRY_MAP.items():
        if any(k in text for k in keywords):
            return industry
    return "other"


# ── Skill / keyword extraction ────────────────────────────────────────────────

def _extract_skills(requirements: str) -> list[str]:
    if not requirements:
        return []
    skills = []
    for line in re.split(r"[\n•·\-\*]", requirements):
        line = line.strip().lstrip("0123456789.) ")
        if 3 <= len(line) <= 80 and not line.endswith(":"):
            skills.append(line)
        if len(skills) >= 15:
            break
    return skills


def _extract_keywords(job_title: str, job_industry: str, requirements: str) -> list[str]:
    keywords = []
    for word in re.split(r"[\s/,\-]+", job_title or ""):
        word = word.strip()
        if len(word) >= 3:
            keywords.append(word.lower())

    tech_kw = [
        "python", "java", "javascript", "typescript", "react", "nodejs", "node.js",
        "sql", "mysql", "postgresql", "mongodb", "redis", "docker", "kubernetes",
        "aws", "azure", "gcp", "git", "ci/cd", "api", "restful", "microservices",
        "agile", "scrum", "excel", "powerbi", "tableau", "sap",
    ]
    req_lower = (requirements or "").lower()
    for kw in tech_kw:
        if kw in req_lower:
            keywords.append(kw)

    return list(dict.fromkeys(keywords))[:12]


# ── Quality filter ────────────────────────────────────────────────────────────

def _is_valid(row: dict) -> bool:
    required_fields = [
        "job_title",
        "company_name",
        "salary",
        "location",
        "job_type",
        "job_industry",
        "experience_level",
        "education_level",
        "job_position",
        "job_description",
        "benefits",
        "requirements",
        "year",
    ]
    if any(row.get(field) in (None, "") for field in required_fields):
        return False

    desc = row.get("job_description") or ""
    title = row.get("job_title") or ""
    if len(desc) < 150 or len(title) < 3:
        return False
    if desc.count("...") > 5 or desc.count("***") > 3:
        return False
    return True


# ── Parser chính ──────────────────────────────────────────────────────────────

def parse_jd_row(row: dict, idx: int) -> Optional[dict]:
    """
    Parse một row từ dataset thành dict.
    Keys = tên cột gốc của dataset + các trường phái sinh (industry, seniority, ...).
    """
    if not _is_valid(row):
        return None

    job_title       = (row.get("job_title") or "").strip()
    company_name    = (row.get("company_name") or "").strip()
    job_industry    = (row.get("job_industry") or "").strip()
    experience_level = (row.get("experience_level") or "").strip()
    education_level = (row.get("education_level") or "").strip()
    job_position    = (row.get("job_position") or "").strip()
    salary          = (row.get("salary") or "").strip()
    location        = (row.get("location") or "").strip()
    job_type        = (row.get("job_type") or "").strip()
    job_description = preprocess_jd_text((row.get("job_description") or "").strip())
    benefits        = preprocess_jd_text((row.get("benefits") or "").strip())
    requirements    = preprocess_jd_text((row.get("requirements") or "").strip())
    year            = row.get("year")

    # Trường phái sinh
    industry = _map_industry(job_industry)
    seniority = _map_seniority(experience_level, job_position)

    description_parts = [job_description]
    if requirements and requirements not in job_description:
        description_parts.append(f"\n\nYêu cầu:\n{requirements}")
    description = "\n".join(description_parts)[:3000]

    required_skills = _extract_skills(requirements)
    keywords = _extract_keywords(job_title, job_industry, requirements)

    return {
        # ── Cột gốc của dataset ──
        "id":               f"jd_hf_{idx}",
        "job_title":        job_title,
        "company_name":     company_name or None,
        "salary":           salary or None,
        "location":         location or None,
        "job_type":         job_type or None,
        "job_industry":     job_industry or None,
        "experience_level": experience_level or None,
        "education_level":  education_level or None,
        "job_position":     job_position or None,
        "job_description":  job_description,
        "benefits":         benefits or None,
        "requirements":     requirements or None,
        "year":             year,
        # ── Trường phái sinh ──
        "industry":         industry,
        "seniority":        seniority,
        "description":      description,
        "required_skills":  required_skills,
        "keywords":         keywords,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def load_hf_jd_samples(
    max_records: int = 3000,
    cache_dir: Optional[str] = None,
) -> list[dict]:
    """
    Load JD từ HuggingFace, chỉ lấy bản ghi có year=2026.

    Args:
        max_records: Số JD tối đa muốn lấy (0 = không giới hạn).
        cache_dir:   Thư mục cache HuggingFace.
    """
    try:
        from datasets import load_dataset
    except ImportError:
        raise ImportError("Cần cài 'datasets': pip install datasets")

    print("Đang stream dataset 'tinixai/vietnamese-job-descriptions' (year=2026)...")

    kwargs: dict = {"split": "train", "streaming": True}
    if cache_dir:
        kwargs["cache_dir"] = cache_dir

    ds = load_dataset("tinixai/vietnamese-job-descriptions", **kwargs)

    parsed: list[dict] = []
    scanned = 0

    for row in ds:
        if str(row.get("year", "")) != "2026":
            continue

        scanned += 1
        result = parse_jd_row(row, scanned)
        if result:
            parsed.append(result)

        if scanned % 1000 == 0:
            print(f"  Scanned (year=2026) {scanned:,} | Parsed {len(parsed):,}")

        if max_records and len(parsed) >= max_records:
            break

    print(f"Scanned {scanned:,} bản ghi năm 2026 → {len(parsed):,} hợp lệ")

    industry_dist = Counter(r["industry"] for r in parsed)
    seniority_dist = Counter(r["seniority"] for r in parsed)
    print(f"  Industries:  {dict(industry_dist.most_common())}")
    print(f"  Seniorities: {dict(seniority_dist)}")

    return parsed
