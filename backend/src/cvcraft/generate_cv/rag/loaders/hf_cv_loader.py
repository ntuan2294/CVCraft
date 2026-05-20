"""
Loader cho CV/Resume Tier 2 từ HuggingFace.

Tier 1 trong `rag/seeds/cv_seeds.py` là hand-curated, chất lượng cao nhưng ít.
Tier 2 dùng HuggingFace để tăng volume cho RAG. Dataset resume trên HF không có
schema thống nhất, nên loader này parse linh hoạt nhiều tên cột phổ biến:

- Resume_str / resume_text / resume / text / content
- Category / category / job_title / role
- skills / Skills

Default dataset: C0ldSmi1e/resume-dataset.
"""
from __future__ import annotations

import html
import re
from collections import Counter
from typing import Optional


DEFAULT_HF_CV_DATASET = "C0ldSmi1e/resume-dataset"
DEFAULT_SPLIT = "train"

_TEXT_KEYS = (
    "Resume_str",
    "resume_str",
    "resume_text",
    "Resume",
    "resume",
    "text",
    "content",
    "raw_text",
    "Resume_html",
    "resume_html",
)
_TITLE_KEYS = ("Category", "category", "job_title", "title", "role", "position")
_SKILL_KEYS = ("skills", "Skills", "skill_list", "resume_skill_list")

_SECTION_HEADINGS = {
    "summary": (
        "summary",
        "professional summary",
        "profile",
        "career summary",
        "objective",
    ),
    "experience": (
        "experience",
        "professional experience",
        "work experience",
        "work history",
        "employment history",
        "career history",
    ),
    "education": ("education", "academic background"),
    "skills": ("skills", "technical skills", "core competencies", "competencies"),
}


def _clean_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        value = "\n".join(str(item) for item in value if item)

    text = html.unescape(str(value))
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _first_present(row: dict, keys: tuple[str, ...]) -> str:
    for key in keys:
        if key in row and row.get(key) not in (None, ""):
            return _clean_text(row.get(key))
    return ""


def _normalize_job_title(value: str) -> str:
    value = _clean_text(value)
    if not value:
        return "General Resume"
    value = value.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", value).title()


def _line_tokens(text: str) -> list[str]:
    lines = []
    for line in text.splitlines():
        line = line.strip(" \t•*-–—:")
        if line:
            lines.append(line)
    return lines


def _is_heading(line: str) -> Optional[str]:
    normalized = re.sub(r"[^a-z ]", "", line.lower()).strip()
    for section, names in _SECTION_HEADINGS.items():
        if normalized in names:
            return section
    return None


def _extract_section(text: str, wanted: str) -> str:
    lines = _line_tokens(text)
    collecting = False
    collected = []

    for line in lines:
        heading = _is_heading(line)
        if heading == wanted:
            collecting = True
            continue
        if collecting and heading and heading != wanted:
            break
        if collecting:
            collected.append(line)

    return "\n".join(collected).strip()


def _sentences(text: str, max_items: int = 4) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+", text)
    results = []
    for chunk in chunks:
        chunk = chunk.strip(" •*-–—\t\n")
        if 40 <= len(chunk) <= 320:
            results.append(chunk)
        if len(results) >= max_items:
            break
    return results


def _extract_summary(text: str) -> str:
    summary_section = _extract_section(text, "summary")
    candidates = _sentences(summary_section, max_items=3)
    if candidates:
        return " ".join(candidates)[:900]

    # Fallback: lấy các câu đầu có vẻ giống professional summary.
    candidates = _sentences(text, max_items=3)
    return " ".join(candidates)[:900]


def _extract_experience_bullets(text: str) -> list[str]:
    experience = _extract_section(text, "experience") or text
    lines = _line_tokens(experience)

    bullets = []
    for line in lines:
        if _is_heading(line):
            continue
        if 45 <= len(line) <= 260:
            bullets.append(line)
        if len(bullets) >= 8:
            break

    if len(bullets) < 3:
        bullets = _sentences(experience, max_items=8)

    # RAG chỉ cần examples đủ sạch, không cần giữ toàn bộ resume.
    deduped = []
    seen = set()
    for bullet in bullets:
        key = bullet.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(bullet)
    return deduped[:6]


def _extract_skills(row: dict, text: str) -> list[str]:
    raw = _first_present(row, _SKILL_KEYS)
    if not raw:
        raw = _extract_section(text, "skills")

    if not raw:
        return []

    parts = re.split(r"[,;\n•|]+", raw)
    skills = []
    for part in parts:
        item = part.strip(" .:-\t")
        if 2 <= len(item) <= 50:
            skills.append(item)
        if len(skills) >= 20:
            break
    return list(dict.fromkeys(skills))


def _map_industry(job_title: str, text: str) -> str:
    haystack = f"{job_title} {text[:2000]}".lower()
    industry_keywords = {
        "tech": ["software", "developer", "engineer", "python", "java", "react", "data scientist", "database", "devops", "cloud"],
        "marketing": ["marketing", "seo", "brand", "social media", "campaign", "content"],
        "finance": ["finance", "accounting", "accountant", "financial", "audit", "banking"],
        "sales": ["sales", "account executive", "business development", "customer service", "retail"],
        "design": ["designer", "ux", "ui", "graphic", "creative"],
        "hr": ["human resources", "recruiter", "talent", "employee relations", "hr "],
        "product": ["product manager", "product owner"],
        "healthcare": ["nurse", "medical", "healthcare", "patient", "clinical"],
        "education": ["teacher", "education", "instructor", "curriculum"],
    }
    for industry, keywords in industry_keywords.items():
        if any(keyword in haystack for keyword in keywords):
            return industry
    return "other"


def _map_seniority(job_title: str, text: str) -> str:
    haystack = f"{job_title} {text[:1000]}".lower()
    if any(k in haystack for k in ("senior", "lead", "principal", "manager", "director", "head of", "chief")):
        return "senior"
    if any(k in haystack for k in ("junior", "intern", "trainee", "entry level", "assistant")):
        return "junior"
    return "mid"


def parse_hf_cv_row(row: dict, idx: int, source: str) -> Optional[dict]:
    text = _first_present(row, _TEXT_KEYS)
    if len(text) < 250:
        return None

    job_title = _normalize_job_title(_first_present(row, _TITLE_KEYS))
    summary = _extract_summary(text)
    bullets = _extract_experience_bullets(text)
    if len(summary) < 80 or len(bullets) < 2:
        return None

    skills = _extract_skills(row, text)
    industry = _map_industry(job_title, text)
    seniority = _map_seniority(job_title, text)

    return {
        "id": f"cv_hf_{idx}",
        "source": source,
        "industry": industry,
        "domain": industry,
        "seniority": seniority,
        "job_title": job_title,
        "summary": summary,
        "experience_bullets": bullets,
        "skills": skills,
        "raw_text_preview": text[:1000],
    }


def load_hf_cv_samples(
    dataset_name: str = DEFAULT_HF_CV_DATASET,
    split: str = DEFAULT_SPLIT,
    max_records: int = 1000,
    cache_dir: Optional[str] = None,
    streaming: bool = True,
) -> list[dict]:
    """
    Download/stream CV Tier 2 từ HuggingFace và parse về schema CV_SAMPLES.

    Args:
        dataset_name: HuggingFace dataset id.
        split: Dataset split, mặc định train.
        max_records: Số CV hợp lệ tối đa muốn lấy. 0 = không giới hạn.
        cache_dir: HuggingFace cache dir nếu cần.
        streaming: True để không download toàn bộ dataset vào RAM.
    """
    try:
        from datasets import load_dataset
    except ImportError:
        raise ImportError("Cần cài 'datasets': pip install datasets")

    kwargs: dict = {"split": split, "streaming": streaming}
    if cache_dir:
        kwargs["cache_dir"] = cache_dir

    print(f"Đang tải CV Tier 2 từ HuggingFace: {dataset_name} ({split})...")
    ds = load_dataset(dataset_name, **kwargs)

    parsed: list[dict] = []
    scanned = 0
    for row in ds:
        scanned += 1
        sample = parse_hf_cv_row(dict(row), scanned, source=dataset_name)
        if sample:
            parsed.append(sample)

        if scanned % 500 == 0:
            print(f"  Scanned {scanned:,} | Parsed {len(parsed):,}")

        if max_records and len(parsed) >= max_records:
            break

    print(f"Scanned {scanned:,} CV → {len(parsed):,} CV hợp lệ")
    print(f"  Industries:  {dict(Counter(s['industry'] for s in parsed).most_common())}")
    print(f"  Seniorities: {dict(Counter(s['seniority'] for s in parsed))}")

    return parsed
