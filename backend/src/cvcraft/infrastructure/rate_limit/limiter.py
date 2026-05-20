"""
Rate limiting với slowapi.

Giới hạn:
  - CV generation (POST /v1/cv/generate*): 10 req/phút/IP   — tốn tiền LLM
  - JD search (POST /v1/jd/search):        30 req/phút/IP   — tốn tiền LLM nhẹ hơn
  - Các endpoint khác:                     120 req/phút/IP  — default

Khi Redis khả dụng, slowapi dùng Redis để đếm (chính xác qua nhiều worker).
Khi không có Redis, fallback về in-memory (chính xác trong 1 process).
"""
import logging
import os

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def _build_limiter():
    try:
        from slowapi import Limiter  # type: ignore
        from slowapi.util import get_remote_address  # type: ignore

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            import redis  # type: ignore

            r = redis.from_url(redis_url, socket_connect_timeout=1)
            r.ping()
            storage_uri = redis_url
            logger.info("[RateLimit] Dùng Redis storage: %s", redis_url)
        except Exception:
            storage_uri = "memory://"
            logger.warning("[RateLimit] Redis không kết nối được, dùng in-memory storage")

        return Limiter(key_func=get_remote_address, storage_uri=storage_uri)

    except ImportError:
        logger.warning("[RateLimit] slowapi chưa được cài. Rate limiting bị tắt.")
        return None


limiter = _build_limiter()


async def rate_limit_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler trả về 429 khi vượt rate limit."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
            "retry_after": "60s",
        },
        headers={"Retry-After": "60"},
    )
