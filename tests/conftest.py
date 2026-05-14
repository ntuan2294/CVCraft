"""
Shared test fixtures cho toàn bộ test suite.
"""
import pytest
from unittest.mock import MagicMock, patch
from cvcraft.core.state import CVAgentState, UserProfile, WorkExperience, CVDraft, QualityScore


@pytest.fixture
def sample_jd():
    return """
    Senior Backend Engineer - Fintech
    Required: Python, PostgreSQL, AWS, Microservices (5+ years)
    """


@pytest.fixture
def sample_user_input():
    return {
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": "+84 900 000 000",
        "location": "Hanoi, Vietnam",
        "skills": ["Python", "PostgreSQL", "AWS", "Docker"],
        "work_experiences": [
            {
                "company": "TestCorp",
                "position": "Backend Engineer",
                "start_date": "2021-01",
                "end_date": None,
                "description": "Built REST APIs with Python and PostgreSQL.",
            }
        ],
        "educations": [
            {
                "school": "HUST",
                "degree": "Bachelor",
                "major": "Computer Science",
                "start_date": "2017-09",
                "end_date": "2021-06",
                "gpa": 3.5,
            }
        ],
        "projects": [],
    }


@pytest.fixture
def sample_state(sample_jd, sample_user_input):
    return CVAgentState(
        job_description=sample_jd,
        user_input=sample_user_input,
        max_revisions=1,
    )


@pytest.fixture
def state_with_profile(sample_state):
    profile = UserProfile(
        full_name="Test User",
        email="test@example.com",
        skills_raw=["Python", "PostgreSQL", "AWS"],
        work_experiences=[
            WorkExperience(
                company="TestCorp",
                position="Backend Engineer",
                start_date="2021-01",
                raw_description="Built REST APIs.",
            )
        ],
    )
    sample_state.user_profile = profile
    return sample_state


@pytest.fixture
def state_with_draft(state_with_profile):
    state_with_profile.cv_draft = CVDraft(
        summary="Experienced backend engineer with Python expertise.",
        experiences=state_with_profile.user_profile.work_experiences,
        skills_categorized={"Programming Languages": ["Python"], "Databases": ["PostgreSQL"]},
    )
    return state_with_profile


@pytest.fixture
def mock_llm():
    return MagicMock()
