"""
Loader cho HuggingFace dataset 'datasetmaster/resumes'.

Schema từ documentation:
- personal_information: { name, contact, summary, social_profiles, location }
- experience: list of { company, job_title, dates, responsibilities, technical_environment }
- education: list of { degree, institution, achievements }
- skills: { programming_languages, frameworks, databases, cloud, languages }
- projects: list of { description, technologies, role, impact }

Code defensive với các field có thể thiếu (real-world data thường không hoàn hảo).
"""
import os
from typing import Optional


def load_huggingface_resumes(
    cache_dir: Optional[str] = None,
    max_samples: Optional[int] = None,
    streaming: bool = False,
) -> list[dict]:
    """
    Load dataset từ HuggingFace Hub.

    Args:
        cache_dir: Thư mục cache (default: ~/.cache/huggingface)
        max_samples: Giới hạn số sample load (None = lấy hết)
        streaming: True = load on-demand (tiết kiệm RAM)

    Returns:
        List of dict, mỗi dict là 1 raw resume entry.
    """
    try:
        from datasets import load_dataset
    except ImportError:
        raise ImportError(
            "Cần cài 'datasets' library: pip install datasets"
        )

    print(f"📥 Đang tải dataset 'datasetmaster/resumes' từ HuggingFace...")

    kwargs = {"split": "train"}
    if cache_dir:
        kwargs["cache_dir"] = cache_dir
    if streaming:
        kwargs["streaming"] = True

    ds = load_dataset("datasetmaster/resumes", **kwargs)

    samples = []
    for i, sample in enumerate(ds):
        samples.append(sample)
        if max_samples and len(samples) >= max_samples:
            break

    print(f"✓ Đã load {len(samples)} samples")
    return samples


def safe_get(d: dict, *keys, default=None):
    """Get nested key an toàn, trả default nếu thiếu."""
    if not isinstance(d, dict):
        return default
    current = d
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current if current is not None else default


def parse_resume(raw: dict) -> Optional[dict]:
    """
    Parse 1 raw resume từ HuggingFace -> structured format
    tương thích với rag/data/cv_samples.py schema.

    Schema output:
    {
        "id": str,
        "industry": str,
        "domain": str,
        "seniority": str,
        "job_title": str,
        "summary": str,
        "experience_bullets": list[str],
    }

    Trả None nếu sample không đủ data tối thiểu.
    """
    # Field có thể là 'personal_information' hoặc 'personal_info' tùy version
    personal = safe_get(raw, "personal_information", default={})
    if not personal:
        personal = safe_get(raw, "personal_info", default={})

    summary = safe_get(personal, "summary", default="")
    if not summary or not isinstance(summary, str):
        return None

    # Experience
    experiences = safe_get(raw, "experience", default=[])
    if not experiences or not isinstance(experiences, list):
        return None

    # Job title từ experience gần nhất
    latest_exp = experiences[0] if experiences else {}
    job_title = safe_get(latest_exp, "job_title", default="")
    if not job_title:
        job_title = safe_get(latest_exp, "title", default="Unknown")

    # Extract bullets từ TẤT CẢ experiences (không chỉ latest)
    all_bullets = []
    for exp in experiences:
        responsibilities = safe_get(exp, "responsibilities", default=[])
        if isinstance(responsibilities, list):
            for r in responsibilities:
                if isinstance(r, str) and len(r.strip()) > 20:
                    all_bullets.append(r.strip())
        elif isinstance(responsibilities, str):
            # Nếu là string, split theo newline
            for line in responsibilities.split("\n"):
                line = line.strip().lstrip("•-* ")
                if len(line) > 20:
                    all_bullets.append(line)

    if not all_bullets:
        return None

    # Phán đoán seniority từ job_title
    seniority = _infer_seniority(job_title, len(experiences))

    # Phán đoán domain/industry từ job_title + skills
    industry, domain = _infer_industry_domain(job_title, raw)

    # Tạo unique ID
    name = safe_get(personal, "name", default="anon")
    sample_id = f"hf_{industry}_{domain}_{seniority}_{abs(hash(name + job_title)) % 100000}"

    return {
        "id": sample_id,
        "industry": industry,
        "domain": domain,
        "seniority": seniority,
        "job_title": job_title,
        "summary": summary.strip(),
        "experience_bullets": all_bullets[:10],  # giới hạn 10 bullet/sample
    }


def _infer_seniority(job_title: str, num_experiences: int) -> str:
    """Phán đoán level từ job title và số jobs."""
    title_lower = job_title.lower()

    # Title-based detection
    if any(k in title_lower for k in ["senior", "sr.", "sr ", "lead", "principal", "staff", "architect", "manager", "head"]):
        return "senior"
    if any(k in title_lower for k in ["junior", "jr.", "jr ", "entry", "intern", "trainee"]):
        return "junior"

    # Fallback: dùng số experiences
    if num_experiences >= 4:
        return "senior"
    if num_experiences >= 2:
        return "mid"
    return "junior"


# Map từ keywords trong job title -> (industry, domain)
INDUSTRY_KEYWORDS = {
    # Tech domains
    ("tech", "backend"): ["backend", "back-end", "api", "server", "node", "django", "spring"],
    ("tech", "frontend"): ["frontend", "front-end", "react", "vue", "angular", "ui developer"],
    ("tech", "fullstack"): ["fullstack", "full-stack", "full stack"],
    ("tech", "data"): ["data engineer", "data scientist", "data analyst", "ml engineer", "machine learning", "ai engineer"],
    ("tech", "devops"): ["devops", "sre", "site reliability", "platform engineer", "cloud engineer", "infrastructure"],
    ("tech", "mobile"): ["ios", "android", "mobile developer", "flutter", "react native"],
    ("tech", "qa"): ["qa", "test engineer", "quality assurance", "sdet"],
    ("tech", "security"): ["security engineer", "cybersecurity", "penetration", "infosec"],
    ("tech", "software"): ["software engineer", "software developer", "developer", "engineer"],

    # Other
    ("design", "product"): ["product designer", "ux designer", "ui designer", "ux/ui"],
    ("marketing", "digital"): ["marketing", "growth", "seo", "ppc", "social media"],
    ("finance", "analyst"): ["financial analyst", "investment", "accountant", "finance"],
}


def _infer_industry_domain(job_title: str, raw: dict) -> tuple[str, str]:
    """Phán đoán industry và domain từ job title."""
    title_lower = job_title.lower()

    for (industry, domain), keywords in INDUSTRY_KEYWORDS.items():
        if any(k in title_lower for k in keywords):
            return industry, domain

    # Default: tech/software (vì dataset chủ yếu là tech)
    return "tech", "software"


def parse_all_resumes(raw_samples: list[dict]) -> list[dict]:
    """Parse tất cả samples, skip những cái không hợp lệ."""
    parsed = []
    skipped = 0

    for raw in raw_samples:
        result = parse_resume(raw)
        if result:
            parsed.append(result)
        else:
            skipped += 1

    print(f"✓ Parse thành công: {len(parsed)}/{len(raw_samples)} ({skipped} skipped)")
    return parsed