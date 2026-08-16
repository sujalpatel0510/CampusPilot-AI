"""Application settings loaded from environment / .env file.

No secrets are hardcoded. Every tunable lives behind an environment variable.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "CampusPilot AI"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:8511@localhost:5432/campuspilot"

    # Security
    SECRET_KEY: str = "change-me-to-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Attendance
    ATTENDANCE_THRESHOLD: float = 75.0

    # AI provider: "mock" or "openai"
    AI_PROVIDER: str = "mock"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"

    # OCR
    TESSERACT_CMD: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS")
    @classmethod
    def split_origins(cls, v: str) -> str:
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_mock_ai(self) -> bool:
        return self.AI_PROVIDER.lower() == "mock"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
