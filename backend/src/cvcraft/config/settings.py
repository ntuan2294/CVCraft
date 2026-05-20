from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

SERVICE_ROOT = Path(__file__).parents[3]
REPO_ROOT = Path(__file__).parents[4]

load_dotenv(REPO_ROOT / ".env")


class Settings(BaseSettings):
    openai_api_key: str = ""
    vectordb_path: str = str(SERVICE_ROOT / "data" / "vectordb")
    templates_dir: str = str(SERVICE_ROOT / "templates")
    outputs_dir: str = str(SERVICE_ROOT / "outputs")
    public_api_url: str = "http://localhost:8000"
    onlyoffice_document_server_url: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_enabled: bool = True

    # Cache TTLs (giây)
    cache_ttl_jd_search: int = 3600       # 1 giờ — kết quả search JD
    cache_ttl_jd_format: int = 86400      # 24 giờ — JD sections đã format bởi LLM
    cache_ttl_cv_task: int = 86400        # 24 giờ — CV task state
    cache_ttl_history: int = 604800       # 7 ngày — CV history

    # Rate limits (requests/minute/IP)
    rate_limit_cv_generate: int = 10      # endpoint tốn kém LLM nhất
    rate_limit_jd_search: int = 30        # LLM nhẹ hơn
    rate_limit_default: int = 120         # các endpoint còn lại

    model_config = {"env_file": str(REPO_ROOT / ".env"), "env_file_encoding": "utf-8"}


settings = Settings()
