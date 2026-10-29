import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "UniMedicine API"
    SECRET_KEY: str = Field(default="supersecretkeyforjntugvstudenthealthplatform2026", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/unimedicine",
        env="DATABASE_URL"
    )

    # Local LLM (Ollama)
    OLLAMA_API_URL: str = Field(default="http://localhost:11434", env="OLLAMA_API_URL")
    OLLAMA_MODEL: str = Field(default="qwen2.5:3b", env="OLLAMA_MODEL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
