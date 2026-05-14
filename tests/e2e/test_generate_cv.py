"""
E2E test: verifies full pipeline works end-to-end.
Requires real OPENAI_API_KEY. Run with:
    pytest tests/e2e/ -v -m e2e
"""
import os
import pytest
from cvcraft.services.cv_service import CVService


@pytest.mark.e2e
@pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="Requires OPENAI_API_KEY",
)
def test_full_pipeline_minimal():
    """Test pipeline với input tối giản."""
    service = CVService()
    result = service.generate_cv(
        jd_text="Senior Backend Engineer with Python and PostgreSQL experience required.",
        user_input={
            "full_name": "Test User",
            "email": "test@example.com",
            "skills": ["Python", "PostgreSQL"],
            "work_experiences": [
                {
                    "company": "TestCorp",
                    "position": "Backend Developer",
                    "start_date": "2021-01",
                    "end_date": None,
                    "description": "Built REST APIs with Python.",
                }
            ],
            "educations": [],
            "projects": [],
        },
        max_revisions=1,
    )

    assert result is not None
    assert len(result.get("messages", [])) > 0

    cv_draft = result.get("cv_draft")
    assert cv_draft is not None
    assert cv_draft.summary is not None
    assert len(cv_draft.experiences) == 1
    assert len(cv_draft.experiences[0].bullets) >= 3
