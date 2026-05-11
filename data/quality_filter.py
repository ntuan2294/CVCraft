"""
Quality filter cho CV samples.

Tiêu chí filter (heuristic, không cần LLM):
1. Summary đủ dài (30-200 từ) và không phải template phrase rỗng
2. Bullet points đủ số (>= 3) và đủ dài
3. Có lượng hóa (% , số liệu, $, time) ở ít nhất 1 bullet
4. Dùng động từ mạnh ở đầu bullet
5. Không có dấu hiệu CV tệ: quá nhiều "Responsible for", quá nhiều "I" first-person

Không cần LLM cho filter này → chạy nhanh, miễn phí.
"""
import re


# Động từ mạnh ở đầu bullet (signal CV tốt)
STRONG_VERBS = {
    "led", "led", "architected", "designed", "built", "developed", "implemented",
    "optimized", "reduced", "increased", "improved", "delivered", "launched",
    "created", "established", "managed", "drove", "spearheaded", "scaled",
    "streamlined", "automated", "migrated", "integrated", "deployed",
    "transformed", "pioneered", "orchestrated", "engineered", "refactored",
    "modernized", "consolidated", "secured", "enhanced", "accelerated",
}

# Cliché phrase (signal CV tệ)
WEAK_PHRASES = [
    "responsible for",
    "duties included",
    "tasks included",
    "in charge of",
    "worked on",
    "helped with",
    "assisted in",
    "involved in",
]

# Pattern lượng hóa
QUANTIFICATION_PATTERN = re.compile(
    r'(\d+%|\$\d+|\d+x|\d+\+|\d+,\d+|\d+k|\d+ million|\d+ billion|'
    r'\d+ users|\d+ customers|\d+ team|\d+ engineers|\d+ years|\d+ months|'
    r'\d+\.\d+|reduce[ds]? by|increase[ds]? by|decrease[ds]? by)',
    re.IGNORECASE
)

# Template/filler từ Faker (synthetic data có thể có placeholder)
PLACEHOLDER_PATTERNS = [
    r'\blorem ipsum\b',
    r'\bxxx+\b',
    r'\b\[.*?\]\b',  # [placeholder]
    r'\bplaceholder\b',
]


def has_quantification(text: str) -> bool:
    """Check xem text có chứa số liệu/lượng hóa không."""
    return bool(QUANTIFICATION_PATTERN.search(text))


def starts_with_strong_verb(bullet: str) -> bool:
    """Check bullet có bắt đầu bằng động từ mạnh không."""
    first_word = bullet.strip().split()[0].lower() if bullet.strip() else ""
    # Bỏ ed/ing để bắt thêm các form
    return first_word in STRONG_VERBS or first_word.rstrip("ed").rstrip("ing") in STRONG_VERBS


def has_weak_phrases(text: str) -> int:
    """Đếm số lần xuất hiện cliché."""
    text_lower = text.lower()
    return sum(1 for p in WEAK_PHRASES if p in text_lower)


def has_placeholder(text: str) -> bool:
    """Check xem text có placeholder text không (signal synthetic data lỗi)."""
    return any(re.search(p, text, re.IGNORECASE) for p in PLACEHOLDER_PATTERNS)


def score_resume(parsed_resume: dict) -> dict:
    """
    Chấm điểm chất lượng resume đã parse.
    Trả dict gồm score và reason để debug.
    """
    summary = parsed_resume.get("summary", "")
    bullets = parsed_resume.get("experience_bullets", [])

    score = 0.0
    reasons = []

    # === Summary checks ===
    summary_words = len(summary.split())
    if 30 <= summary_words <= 200:
        score += 2.0
        reasons.append(f"summary length OK ({summary_words} words)")
    elif summary_words < 30:
        reasons.append(f"summary too short ({summary_words} words)")
    elif summary_words > 200:
        reasons.append(f"summary too long ({summary_words} words)")

    if has_placeholder(summary):
        score -= 3.0
        reasons.append("summary có placeholder text")

    # === Bullet checks ===
    if len(bullets) >= 3:
        score += 2.0
        reasons.append(f"đủ bullets ({len(bullets)})")
    else:
        reasons.append(f"thiếu bullets ({len(bullets)})")

    # Bullet length
    avg_bullet_len = sum(len(b.split()) for b in bullets) / max(len(bullets), 1)
    if 8 <= avg_bullet_len <= 30:
        score += 1.5
        reasons.append(f"bullet length OK (avg {avg_bullet_len:.1f} words)")
    elif avg_bullet_len < 8:
        reasons.append(f"bullets quá ngắn (avg {avg_bullet_len:.1f})")

    # Quantification - ít nhất 1 bullet có lượng hóa
    quant_bullets = sum(1 for b in bullets if has_quantification(b))
    if quant_bullets >= 1:
        score += 2.0
        reasons.append(f"có lượng hóa ({quant_bullets}/{len(bullets)} bullets)")
    else:
        reasons.append("không có lượng hóa")

    # Strong verbs
    strong_starts = sum(1 for b in bullets if starts_with_strong_verb(b))
    strong_ratio = strong_starts / max(len(bullets), 1)
    if strong_ratio >= 0.5:
        score += 1.5
        reasons.append(f"strong verbs ratio: {strong_ratio:.0%}")
    else:
        reasons.append(f"weak verbs ratio: {strong_ratio:.0%}")

    # Weak phrases penalty
    total_weak = sum(has_weak_phrases(b) for b in bullets) + has_weak_phrases(summary)
    if total_weak >= 3:
        score -= 1.5
        reasons.append(f"nhiều cliché ({total_weak})")
    elif total_weak >= 1:
        score -= 0.5

    # Placeholder penalty (cho bullets)
    placeholder_count = sum(1 for b in bullets if has_placeholder(b))
    if placeholder_count > 0:
        score -= 3.0
        reasons.append(f"placeholder trong {placeholder_count} bullets")

    return {
        "score": score,
        "reasons": reasons,
    }


def filter_quality(
    parsed_resumes: list[dict],
    min_score: float = 5.0,
    target_count: int = None,
) -> list[dict]:
    """
    Filter resumes theo score >= min_score.
    Nếu target_count được set, sort theo score và lấy top N.

    Returns:
        List resumes đã pass filter, đã thêm field 'quality_score'.
    """
    scored = []
    for resume in parsed_resumes:
        result = score_resume(resume)
        resume["quality_score"] = result["score"]
        resume["quality_reasons"] = result["reasons"]
        scored.append(resume)

    # Sort theo score giảm dần
    scored.sort(key=lambda r: r["quality_score"], reverse=True)

    # Filter theo min_score
    passed = [r for r in scored if r["quality_score"] >= min_score]

    print(f"✓ Filter: {len(passed)}/{len(parsed_resumes)} resumes pass (min_score={min_score})")

    # Top-N nếu cần
    if target_count and len(passed) > target_count:
        passed = passed[:target_count]
        print(f"  → giữ top {target_count} theo score")

    # In phân bố
    if passed:
        scores = [r["quality_score"] for r in passed]
        print(f"  Score range: {min(scores):.1f} - {max(scores):.1f}, "
              f"avg: {sum(scores)/len(scores):.1f}")

    return passed