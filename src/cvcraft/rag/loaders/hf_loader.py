"""
Loader cho HuggingFace dataset 'datasetmaster/resumes'.
Code defensive với các field có thể thiếu (real-world data thường không hoàn hảo).
"""
from typing import Optional


def load_huggingface_resumes(
    cache_dir: Optional[str] = None,
    max_samples: Optional[int] = None,
    streaming: bool = False,
) -> list[dict]:
    try:
        from datasets import load_dataset
    except ImportError:
        raise ImportError("Cần cài 'datasets' library: pip install datasets")

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
    if not isinstance(d, dict):
        return default
    current = d
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current if current is not None else default


def parse_resume(raw: dict) -> Optional[dict]:
    personal = safe_get(raw, "personal_information", default={})
    if not personal:
        personal = safe_get(raw, "personal_info", default={})

    summary = safe_get(personal, "summary", default="")
    if not summary or not isinstance(summary, str):
        return None

    experiences = safe_get(raw, "experience", default=[])
    if not experiences or not isinstance(experiences, list):
        return None

    latest_exp = experiences[0] if experiences else {}
    job_title = safe_get(latest_exp, "job_title", default="")
    if not job_title:
        job_title = safe_get(latest_exp, "title", default="Unknown")

    all_bullets = []
    for exp in experiences:
        responsibilities = safe_get(exp, "responsibilities", default=[])
        if isinstance(responsibilities, list):
            for r in responsibilities:
                if isinstance(r, str) and len(r.strip()) > 20:
                    all_bullets.append(r.strip())
        elif isinstance(responsibilities, str):
            for line in responsibilities.split("\n"):
                line = line.strip().lstrip("•-* ")
                if len(line) > 20:
                    all_bullets.append(line)

    if not all_bullets:
        return None

    seniority = _infer_seniority(job_title, len(experiences))
    industry, domain = _infer_industry_domain(job_title, raw)

    name = safe_get(personal, "name", default="anon")
    sample_id = f"hf_{industry}_{domain}_{seniority}_{abs(hash(name + job_title)) % 100000}"

    return {
        "id": sample_id,
        "industry": industry,
        "domain": domain,
        "seniority": seniority,
        "job_title": job_title,
        "summary": summary.strip(),
        "experience_bullets": all_bullets[:10],
    }


def _infer_seniority(job_title: str, num_experiences: int) -> str:
    title_lower = job_title.lower()

    if any(k in title_lower for k in ["senior", "sr.", "sr ", "lead", "principal", "staff", "architect", "manager", "head"]):
        return "senior"
    if any(k in title_lower for k in ["junior", "jr.", "jr ", "entry", "intern", "trainee"]):
        return "junior"

    if num_experiences >= 4:
        return "senior"
    if num_experiences >= 2:
        return "mid"
    return "junior"


INDUSTRY_KEYWORDS = {
    ("tech", "backend"): ["backend", "back-end", "api", "server", "node", "django", "spring"],
    ("tech", "frontend"): ["frontend", "front-end", "react", "vue", "angular", "ui developer"],
    ("tech", "fullstack"): ["fullstack", "full-stack", "full stack"],
    ("tech", "data"): ["data engineer", "data scientist", "data analyst", "ml engineer", "machine learning", "ai engineer"],
    ("tech", "devops"): ["devops", "sre", "site reliability", "platform engineer", "cloud engineer", "infrastructure"],
    ("tech", "mobile"): ["ios", "android", "mobile developer", "flutter", "react native"],
    ("tech", "qa"): ["qa", "test engineer", "quality assurance", "sdet"],
    ("tech", "security"): ["security engineer", "cybersecurity", "penetration", "infosec"],
    ("tech", "software"): ["software engineer", "software developer", "developer", "engineer"],
    ("design", "product"): ["product designer", "ux designer", "ui designer", "ux/ui"],
    ("marketing", "digital"): ["marketing", "growth", "seo", "ppc", "social media"],
    ("finance", "analyst"): ["financial analyst", "investment", "accountant", "finance"],
}


def _infer_industry_domain(job_title: str, raw: dict) -> tuple[str, str]:
    title_lower = job_title.lower()

    for (industry, domain), keywords in INDUSTRY_KEYWORDS.items():
        if any(k in title_lower for k in keywords):
            return industry, domain

    return "tech", "software"


def parse_all_resumes(raw_samples: list[dict]) -> list[dict]:
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
