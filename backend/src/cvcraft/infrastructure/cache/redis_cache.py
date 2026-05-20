"""
Redis cache service với graceful fallback sang in-memory khi Redis không khả dụng.

Dùng JSON serialization cho các kiểu cơ bản, Pydantic model_dump_json cho models.
"""
import json
import logging
import time
from functools import lru_cache
from typing import Any, Optional, TypeVar

from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class RedisCache:
    """
    Redis cache với fallback sang dict in-memory.
    Mọi lỗi Redis đều bị nuốt (logged) để không crash app.
    """

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self._available = False
        self._client = None
        self._memory: dict[str, tuple[str, Optional[float]]] = {}  # key -> (value, expire_at)
        self._stats = {"hits": 0, "misses": 0, "errors": 0}

        try:
            import redis  # type: ignore

            client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=False,
            )
            client.ping()
            self._client = client
            self._available = True
            logger.info("[Cache] Redis connected: %s", redis_url)
        except ImportError:
            logger.warning("[Cache] redis-py không được cài. Dùng in-memory fallback.")
        except Exception as e:
            logger.warning("[Cache] Redis không kết nối được (%s). Dùng in-memory fallback.", e)

    # ── low-level get/set/delete ──────────────────────────────────────────────

    def get(self, key: str) -> Optional[str]:
        if self._available:
            try:
                val = self._client.get(key)
                if val is None:
                    self._stats["misses"] += 1
                else:
                    self._stats["hits"] += 1
                return val
            except Exception as e:
                self._stats["errors"] += 1
                logger.warning("[Cache] Redis GET error: %s", e)
                return None

        # fallback
        entry = self._memory.get(key)
        if entry is None:
            self._stats["misses"] += 1
            return None
        value, expire_at = entry
        if expire_at is not None and time.monotonic() > expire_at:
            del self._memory[key]
            self._stats["misses"] += 1
            return None
        self._stats["hits"] += 1
        return value

    def set(self, key: str, value: str, ttl: int = 3600) -> bool:
        if self._available:
            try:
                self._client.setex(key, ttl, value)
                return True
            except Exception as e:
                self._stats["errors"] += 1
                logger.warning("[Cache] Redis SET error: %s", e)
                return False

        expire_at = time.monotonic() + ttl if ttl > 0 else None
        self._memory[key] = (value, expire_at)
        return True

    def delete(self, key: str) -> bool:
        if self._available:
            try:
                self._client.delete(key)
                return True
            except Exception as e:
                logger.warning("[Cache] Redis DEL error: %s", e)
                return False
        self._memory.pop(key, None)
        return True

    def exists(self, key: str) -> bool:
        return self.get(key) is not None

    # ── JSON helpers ──────────────────────────────────────────────────────────

    def get_json(self, key: str) -> Optional[Any]:
        raw = self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None

    def set_json(self, key: str, value: Any, ttl: int = 3600) -> bool:
        try:
            return self.set(key, json.dumps(value, ensure_ascii=False, default=str), ttl)
        except Exception as e:
            logger.warning("[Cache] JSON serialize error: %s", e)
            return False

    # ── Pydantic helpers ──────────────────────────────────────────────────────

    def get_pydantic(self, key: str, model_class: type[T]) -> Optional[T]:
        raw = self.get(key)
        if raw is None:
            return None
        try:
            return model_class.model_validate_json(raw)
        except Exception:
            return None

    def set_pydantic(self, key: str, model: BaseModel, ttl: int = 3600) -> bool:
        try:
            return self.set(key, model.model_dump_json(), ttl)
        except Exception as e:
            logger.warning("[Cache] Pydantic serialize error: %s", e)
            return False

    # ── Redis List helpers (dùng cho history) ─────────────────────────────────

    def lpush(self, key: str, value: str, maxlen: int = 100, ttl: int = 86400) -> bool:
        """Push vào đầu list, giữ tối đa maxlen phần tử."""
        if self._available:
            try:
                pipe = self._client.pipeline()
                pipe.lpush(key, value)
                pipe.ltrim(key, 0, maxlen - 1)
                pipe.expire(key, ttl)
                pipe.execute()
                return True
            except Exception as e:
                logger.warning("[Cache] Redis LPUSH error: %s", e)
                return False
        # fallback: in-memory list via JSON
        existing = self.get_json(key) or []
        existing.insert(0, json.loads(value) if value.startswith("{") else value)
        existing = existing[:maxlen]
        return self.set_json(key, existing, ttl)

    def lrange(self, key: str, start: int = 0, end: int = -1) -> list[str]:
        if self._available:
            try:
                return self._client.lrange(key, start, end)
            except Exception as e:
                logger.warning("[Cache] Redis LRANGE error: %s", e)
                return []
        data = self.get_json(key)
        if not isinstance(data, list):
            return []
        items = data[start : None if end == -1 else end + 1]
        return [json.dumps(i, ensure_ascii=False) if isinstance(i, dict) else str(i) for i in items]

    # ── Info ──────────────────────────────────────────────────────────────────

    @property
    def is_available(self) -> bool:
        return self._available

    def get_stats(self) -> dict:
        base = {
            "backend": "redis" if self._available else "memory",
            "available": self._available,
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "errors": self._stats["errors"],
        }
        if self._available:
            try:
                info = self._client.info("stats")
                base["redis_keyspace_hits"] = info.get("keyspace_hits")
                base["redis_keyspace_misses"] = info.get("keyspace_misses")
                mem_info = self._client.info("memory")
                base["redis_used_memory_human"] = mem_info.get("used_memory_human")
            except Exception:
                pass
        else:
            base["memory_keys"] = len(self._memory)
        return base


@lru_cache(maxsize=1)
def get_cache() -> RedisCache:
    """Singleton cache instance, khởi tạo từ settings."""
    from cvcraft.config.settings import settings

    return RedisCache(redis_url=settings.redis_url)
