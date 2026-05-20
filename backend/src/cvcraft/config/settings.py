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

    model_config = {"env_file": str(REPO_ROOT / ".env"), "env_file_encoding": "utf-8"}


settings = Settings()
