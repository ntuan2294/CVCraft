from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).parents[3]

# Load .env vào os.environ ngay khi module được import
# Để os.getenv() hoạt động đúng ở mọi nơi trong codebase
load_dotenv(PROJECT_ROOT / ".env")


class Settings(BaseSettings):
    openai_api_key: str = ""
    vectordb_path: str = str(PROJECT_ROOT / "data" / "vectordb")
    templates_dir: str = str(PROJECT_ROOT / "templates")
    outputs_dir: str = str(PROJECT_ROOT / "outputs")

    model_config = {"env_file": str(PROJECT_ROOT / ".env"), "env_file_encoding": "utf-8"}


settings = Settings()
