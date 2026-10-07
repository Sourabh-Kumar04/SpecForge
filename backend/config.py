import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    nebius_base_url: str = "https://api.studio.nebius.ai/v1"
    nebius_api_key: Optional[str] = None
    nebius_model_fast: str = "nvidia/nemotron-mini-4b-instruct"
    nebius_model_reasoning: str = "nvidia/Llama-3.1-Nemotron-70B-Instruct"
    tavily_api_key: Optional[str] = None
    mock_llm: bool = False
    max_fix_iterations: int = 5
    sandbox_timeout_seconds: int = 35
    docker_sandbox_enabled: bool = True
    storage_dir: Path = Path("./data")
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def effective_mock_llm(self) -> bool:
        if self.mock_llm:
            return True
        if not self.nebius_api_key or self.nebius_api_key.startswith("your-") or len(self.nebius_api_key.strip()) < 8:
            return True
        return False

    @property
    def effective_mock_tavily(self) -> bool:
        if not self.tavily_api_key or self.tavily_api_key.startswith("your-") or len(self.tavily_api_key.strip()) < 8:
            return True
        return False

settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
