"""Unit tests cho user_profile_node - không cần LLM."""
from cvcraft.core.state import CVAgentState
from cvcraft.agents.user_profile import user_profile_node


def test_user_profile_parses_basic(sample_user_input):
    state = CVAgentState(user_input=sample_user_input)
    result = user_profile_node(state)

    assert "user_profile" in result
    profile = result["user_profile"]
    assert profile.full_name == "Test User"
    assert profile.email == "test@example.com"
    assert len(profile.work_experiences) == 1
    assert len(profile.educations) == 1


def test_user_profile_empty_input():
    state = CVAgentState(user_input={})
    result = user_profile_node(state)

    assert "messages" in result
    assert "Bỏ qua" in result["messages"][0]


def test_user_profile_no_template(sample_user_input):
    sample_user_input.pop("template_path", None)
    state = CVAgentState(user_input=sample_user_input)
    result = user_profile_node(state)

    profile = result["user_profile"]
    assert profile.template_path is None
