"""
Data subpackage cho RAG.

Chứa 3 phần:
1. cv_samples: seed dataset hand-curated (chất lượng cao, dùng làm baseline)
2. hf_loader: load + parse dataset từ HuggingFace (volume)
3. quality_filter: heuristic scoring filter CV chất lượng

Dataset 2 tầng:
- Tier 1 (cv_samples): ~20 mẫu curated, luôn có sẵn, không cần network
- Tier 2 (hf_loader → quality_filter): hàng trăm mẫu từ HF, cần internet

Public API:
    from rag.data import CV_SAMPLES, filter_samples
    from rag.data import load_huggingface_resumes, parse_all_resumes
    from rag.data import filter_quality, score_resume
"""
# Seed dataset (Tier 1)
from .cv_samples import CV_SAMPLES, filter_samples

# HuggingFace loader (Tier 2) - import lazy để không bắt buộc cài datasets
# khi user chỉ dùng seed
try:
    from .hf_loader import (
        load_huggingface_resumes,
        parse_resume,
        parse_all_resumes,
    )
    _HF_AVAILABLE = True
except ImportError:
    _HF_AVAILABLE = False

# Quality filter
from .quality_filter import (
    score_resume,
    filter_quality,
    has_quantification,
    starts_with_strong_verb,
)

__all__ = [
    # Seed dataset
    "CV_SAMPLES",
    "filter_samples",
    # HF loader (có thể không có nếu thiếu datasets library)
    "load_huggingface_resumes",
    "parse_resume",
    "parse_all_resumes",
    # Quality filter
    "score_resume",
    "filter_quality",
    "has_quantification",
    "starts_with_strong_verb",
]