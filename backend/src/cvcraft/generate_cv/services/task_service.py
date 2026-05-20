"""
Async CV Task Service.

Thay vì block request trong 30-60s, CV generation chạy background thread.
Client nhận task_id ngay lập tức và poll GET /v1/cv/tasks/{task_id} để lấy kết quả.

Lifecycle: QUEUED → PROCESSING → DONE | FAILED
Task state lưu trong Redis (hoặc in-memory fallback) với TTL 24h.
"""
import json
import logging
import threading
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Optional

from cvcraft.infrastructure.cache.redis_cache import RedisCache

if TYPE_CHECKING:
    from cvcraft.generate_cv.services.cv_service import CVService

logger = logging.getLogger(__name__)

TASK_TTL = 86400  # 24 giờ
HISTORY_KEY = "cv:history"
HISTORY_MAX = 20


class TaskStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class CVTaskService:
    """
    Quản lý async CV generation tasks.
    Dùng Redis để lưu state, fallback sang in-memory nếu Redis offline.
    """

    def __init__(self, cache: RedisCache):
        self._cache = cache

    # ── Task CRUD ─────────────────────────────────────────────────────────────

    def create_task(self, job_title: str = "") -> str:
        task_id = str(uuid.uuid4())
        task_data = {
            "task_id": task_id,
            "status": TaskStatus.QUEUED,
            "job_title": job_title,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
            "result": None,
            "error": None,
        }
        self._cache.set_json(f"cv:task:{task_id}", task_data, ttl=TASK_TTL)
        return task_id

    def get_task(self, task_id: str) -> Optional[dict]:
        return self._cache.get_json(f"cv:task:{task_id}")

    def _update_task(self, task_id: str, **fields) -> None:
        task = self.get_task(task_id)
        if task is None:
            return
        task.update(fields)
        task["updated_at"] = _now_iso()
        self._cache.set_json(f"cv:task:{task_id}", task, ttl=TASK_TTL)

    # ── Background runner ─────────────────────────────────────────────────────

    def submit(
        self,
        task_id: str,
        cv_service: "CVService",
        jd_text: str,
        user_input: dict,
        max_revisions: int,
    ) -> None:
        """Spawn background thread để chạy CV generation, cập nhật task state."""
        thread = threading.Thread(
            target=self._run,
            args=(task_id, cv_service, jd_text, user_input, max_revisions),
            daemon=True,
            name=f"cv-task-{task_id[:8]}",
        )
        thread.start()
        logger.info("[Task %s] Submitted to background thread", task_id)

    def _run(
        self,
        task_id: str,
        cv_service: "CVService",
        jd_text: str,
        user_input: dict,
        max_revisions: int,
    ) -> None:
        self._update_task(task_id, status=TaskStatus.PROCESSING)
        try:
            result = cv_service.generate_cv(
                jd_text=jd_text,
                user_input=user_input,
                max_revisions=max_revisions,
            )
            score = result.get("quality_score")
            result_dict = {
                "output_path": result.get("output_path"),
                "quality_score": score.model_dump() if score else None,
                "cv_draft": result.get("cv_draft").model_dump() if result.get("cv_draft") else None,
                "messages": result.get("messages", []),
            }
            self._update_task(task_id, status=TaskStatus.DONE, result=result_dict)
            self._record_history(task_id, user_input, score)
            logger.info("[Task %s] Done", task_id)
        except Exception as e:
            logger.error("[Task %s] Failed: %s", task_id, e)
            self._update_task(task_id, status=TaskStatus.FAILED, error=str(e))

    # ── History ───────────────────────────────────────────────────────────────

    def _record_history(self, task_id: str, user_input: dict, score) -> None:
        """Lưu summary của task vào history list (tối đa HISTORY_MAX phần tử)."""
        try:
            entry = {
                "task_id": task_id,
                "job_title": user_input.get("job_title", ""),
                "full_name": user_input.get("full_name", ""),
                "overall_score": round(score.overall_score, 2) if score else None,
                "ats_score": round(score.ats_score, 2) if score else None,
                "jd_match_score": round(score.jd_match_score, 2) if score else None,
                "created_at": _now_iso(),
            }
            self._cache.lpush(HISTORY_KEY, json.dumps(entry, ensure_ascii=False), maxlen=HISTORY_MAX, ttl=TASK_TTL * 7)
        except Exception as e:
            logger.warning("[Task %s] History record failed: %s", task_id, e)

    def get_history(self) -> list[dict]:
        """Trả về danh sách lịch sử CV gần nhất (tối đa 20 entries)."""
        raw_items = self._cache.lrange(HISTORY_KEY, 0, HISTORY_MAX - 1)
        result = []
        for raw in raw_items:
            try:
                result.append(json.loads(raw))
            except Exception:
                pass
        return result

    def clear_history(self) -> None:
        self._cache.delete(HISTORY_KEY)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
