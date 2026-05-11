"""
Orchestrator dùng LangGraph.
Định nghĩa luồng: Input -> Generation -> QC -> (loop nếu cần) -> Render template -> Done.
"""
from langgraph.graph import StateGraph, START, END
from state import CVAgentState
from agents import (
    jd_analyzer_node,
    user_profile_node,
    summary_agent_node,
    experience_agent_node,
    skills_agent_node,
    qc_agent_node,
    template_renderer_node,
)


def should_revise(state: CVAgentState) -> str:
    """
    Conditional edge: quyết định loop, render template, hay end.
    """
    if state.quality_score is None:
        return "end"

    if state.quality_score.needs_revision and state.revision_count <= state.max_revisions:
        return "revise"

    # QC đã xong - nếu có template thì render, không có thì end
    if state.user_profile and state.user_profile.template_path:
        return "render"

    return "end"


def build_graph():
    """
    Build và compile graph.

    Cấu trúc:
        START
          │
          ├──> jd_analyzer ─┐
          ├──> user_profile ─┤
          │                  │
          v                  v
        summary_agent
          │
          v
        experience_agent
          │
          v
        skills_agent
          │
          v
        qc_agent
          │
          ├─(needs_revision=True)──> summary_agent (loop)
          ├─(render)──> template_renderer ──> END
          └─(end)──> END
    """
    graph = StateGraph(CVAgentState)

    # Đăng ký các node
    graph.add_node("jd_analyzer", jd_analyzer_node)
    graph.add_node("user_profile", user_profile_node)
    graph.add_node("summary_agent", summary_agent_node)
    graph.add_node("experience_agent", experience_agent_node)
    graph.add_node("skills_agent", skills_agent_node)
    graph.add_node("qc_agent", qc_agent_node)
    graph.add_node("template_renderer", template_renderer_node)

    # Layer 1: parse input song song
    graph.add_edge(START, "jd_analyzer")
    graph.add_edge(START, "user_profile")

    # Layer 2: generation tuần tự
    graph.add_edge("jd_analyzer", "summary_agent")
    graph.add_edge("user_profile", "summary_agent")
    graph.add_edge("summary_agent", "experience_agent")
    graph.add_edge("experience_agent", "skills_agent")

    # Layer 3: QC
    graph.add_edge("skills_agent", "qc_agent")

    # Conditional: loop / render template / end
    graph.add_conditional_edges(
        "qc_agent",
        should_revise,
        {
            "revise": "summary_agent",
            "render": "template_renderer",
            "end": END,
        },
    )

    # Layer 4: render xong thì end
    graph.add_edge("template_renderer", END)

    return graph.compile()