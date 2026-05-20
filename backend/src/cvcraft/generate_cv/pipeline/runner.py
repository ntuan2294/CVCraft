"""
Pipeline runner - thin wrapper để chạy graph với input/output chuẩn.
"""
from cvcraft.generate_cv.core.state import CVAgentState
from cvcraft.generate_cv.pipeline.graph import build_graph

_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


def run_pipeline(jd_text: str, user_input: dict, max_revisions: int = 2) -> dict:
    graph = get_graph()
    initial_state = CVAgentState(
        job_description=jd_text,
        user_input=user_input,
        max_revisions=max_revisions,
    )
    return graph.invoke(initial_state)
