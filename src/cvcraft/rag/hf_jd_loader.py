"""
Loader cho HuggingFace dataset 'tinixai/vietnamese-job-descriptions'.
607K bản ghi JD tiếng Việt — dùng streaming để tránh load hết vào RAM.

Chiến lược sampling: stratified theo industry, tối đa `target` bản ghi tổng.
"""
import re
from collections import defaultdict
from typing import Optional


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

    # Parse số năm kinh nghiệm từ experience_level (e.g. "3 năm", "trên 5 năm")
    numbers = re.findall(r"\d+", exp)
    if numbers:
        years = int(numbers[-1])
        if years >= 5:
            return "senior"
        if years >= 2:
            return "mid"
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


# ── Skill extraction từ requirements text ────────────────────────────────────

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


# ── Keyword extraction từ job_description ────────────────────────────────────

def _extract_keywords(job_title: str, job_industry: str, requirements: str) -> list[str]:
    keywords = []
    # Lấy từ job title
    for word in re.split(r"[\s/,\-]+", job_title or ""):
        word = word.strip()
        if len(word) >= 3:
            keywords.append(word.lower())

    # Lấy tech keywords phổ biến xuất hiện trong requirements
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
    desc = row.get("job_description") or ""
    title = row.get("job_title") or ""
    if len(desc) < 150 or len(title) < 3:
        return False
    # Loại bỏ record có description toàn placeholder
    if desc.count("...") > 5 or desc.count("***") > 3:
        return False
    return True


# ── Parser chính ──────────────────────────────────────────────────────────────

def parse_jd_row(row: dict, idx: int) -> Optional[dict]:
    if not _is_valid(row):
        return None

    job_title = (row.get("job_title") or "").strip()
    company = (row.get("company_name") or "").strip()
    job_industry = (row.get("job_industry") or "")
    experience_level = (row.get("experience_level") or "")
    job_position = (row.get("job_position") or "")
    job_description = (row.get("job_description") or "").strip()
    requirements = (row.get("requirements") or "").strip()

    industry = _map_industry(job_industry)
    seniority = _map_seniority(experience_level, job_position)

    # Ghép description + requirements thành text đầy đủ
    description_parts = [job_description]
    if requirements and requirements not in job_description:
        description_parts.append(f"\n\nYêu cầu:\n{requirements}")
    description = "\n".join(description_parts)[:3000]  # cap 3000 chars

    required_skills = _extract_skills(requirements)
    keywords = _extract_keywords(job_title, job_industry, requirements)

    return {
        "id": f"jd_hf_{idx}",
        "title": job_title,
        "company": company or None,
        "industry": industry,
        "seniority": seniority,
        "description": description,
        "required_skills": required_skills,
        "keywords": keywords,
    }


# ── Stratified sampler ────────────────────────────────────────────────────────

def _stratified_sample(records: list[dict], target: int) -> list[dict]:
    by_industry: dict[str, list] = defaultdict(list)
    for r in records:
        by_industry[r["industry"]].append(r)

    industries = sorted(by_industry.keys())
    per_industry = max(1, target // len(industries))
    result = []
    for industry in industries:
        bucket = by_industry[industry]
        result.extend(bucket[:per_industry])

    # Fill còn thiếu bằng "other" hoặc bucket lớn nhất
    remaining = target - len(result)
    if remaining > 0:
        extras = [r for r in records if r not in result]
        result.extend(extras[:remaining])

    return result[:target]


# ── Public API ────────────────────────────────────────────────────────────────

def load_hf_jd_samples(
    target: int = 3000,
    max_scan: int = 50000,
    cache_dir: Optional[str] = None,
) -> list[dict]:
    """
    Load và parse JD từ HuggingFace dataset 'tinixai/vietnamese-job-descriptions'.

    Args:
        target: Số JD tối đa muốn index (sau stratified sampling).
        max_scan: Số record tối đa quét qua để lấy đủ sample chất lượng.
        cache_dir: Thư mục cache HuggingFace (mặc định ~/.cache/huggingface).
    """
    try:
        from datasets import load_dataset
    except ImportError:
        raise ImportError("Cần cài 'datasets': pip install datasets")

    print(f"Đang stream dataset 'tinixai/vietnamese-job-descriptions'...")

    kwargs: dict = {"split": "train", "streaming": True}
    if cache_dir:
        kwargs["cache_dir"] = cache_dir

    ds = load_dataset("tinixai/vietnamese-job-descriptions", **kwargs)

    parsed = []
    scanned = 0

    for row in ds:
        scanned += 1
        result = parse_jd_row(row, scanned)
        if result:
            parsed.append(result)

        if scanned % 5000 == 0:
            print(f"  Scanned {scanned:,} | Parsed {len(parsed):,}")

        if scanned >= max_scan:
            break

    print(f"Scanned {scanned:,} records → {len(parsed):,} hợp lệ")

    sampled = _stratified_sample(parsed, target)
    print(f"Stratified sample: {len(sampled)} JDs ({len(set(r['industry'] for r in sampled))} industries)")

    from collections import Counter
    industry_dist = Counter(r["industry"] for r in sampled)
    seniority_dist = Counter(r["seniority"] for r in sampled)
    print(f"  Industries: {dict(industry_dist.most_common())}")
    print(f"  Seniorities: {dict(seniority_dist)}")

    return sampled
