"""
CV Service - use-case layer.
CLI và API đều gọi vào đây. Không chứa HTTP hay CLI logic.
"""
from functools import cached_property
from cvcraft.generate_cv.pipeline.graph import build_graph
from cvcraft.generate_cv.core.state import CVAgentState


class CVService:
    @cached_property
    def _graph(self):
        return build_graph()

    def generate_cv(
        self,
        jd_text: str,
        user_input: dict,
        max_revisions: int = 2,
    ) -> dict:
        initial_state = CVAgentState(
            job_description=jd_text,
            user_input=user_input,
            max_revisions=max_revisions,
        )
        return self._graph.invoke(initial_state)
