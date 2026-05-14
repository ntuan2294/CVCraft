"""
CV Service - use-case layer.
CLI và API đều gọi vào đây. Không chứa HTTP hay CLI logic.
"""
from functools import cached_property
from cvcraft.pipeline.graph import build_graph
from cvcraft.core.state import CVAgentState


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
        """
        Chạy full pipeline và trả về final state.

        Args:
            jd_text: Job Description text
            user_input: Dict chứa thông tin user (full_name, email, work_experiences, ...)
            max_revisions: Số lần QC agent được phép loop lại

        Returns:
            dict: final state (cv_draft, quality_score, output_path, messages)
        """
        initial_state = CVAgentState(
            job_description=jd_text,
            user_input=user_input,
            max_revisions=max_revisions,
        )
        return self._graph.invoke(initial_state)
