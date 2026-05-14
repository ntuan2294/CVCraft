"""Unit tests cho core state models."""
import pytest
from cvcraft.core.state import (
    CVAgentState, JobRequirement, UserProfile,
    WorkExperience, Education, CVDraft, QualityScore,
)


def test_cv_agent_state_default():
    state = CVAgentState()
    assert state.job_description == ""
    assert state.revision_count == 0
    assert state.max_revisions == 2
    assert state.messages == []


def test_quality_score_validation():
    score = QualityScore(
        ats_score=8.0,
        jd_match_score=7.5,
        linguistic_score=9.0,
        overall_score=8.2,
        needs_revision=False,
    )
    assert score.overall_score == 8.2
    assert not score.needs_revision


def test_quality_score_boundary():
    with pytest.raises(Exception):
        QualityScore(
            ats_score=11.0,  # > 10, should fail
            jd_match_score=7.5,
            linguistic_score=9.0,
            overall_score=8.2,
        )


def test_work_experience_defaults():
    exp = WorkExperience(
        company="TestCorp",
        position="Engineer",
        start_date="2022-01",
        raw_description="Did things.",
    )
    assert exp.end_date is None
    assert exp.bullets == []


def test_messages_merge():
    """LangGraph dùng Annotated[list, add] để merge messages."""
    state = CVAgentState(messages=["msg1"])
    assert "msg1" in state.messages
