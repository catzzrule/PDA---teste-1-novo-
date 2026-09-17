from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://pda:pda@localhost:5432/pda"

    @field_validator("database_url")
    @classmethod
    def _use_asyncpg_driver(cls, v: str) -> str:
        # Managed Postgres providers (Render, Heroku, etc.) hand out
        # postgres:// / postgresql:// URLs; SQLAlchemy's async engine needs
        # the asyncpg driver explicitly in the scheme.
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    storage_dir: str = "./storage"
    max_upload_mb: int = 10

    cors_origins: str = "http://localhost:5173"

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "pda-noreply@esporte.gov.br"

    public_base_url: str = "http://localhost:8000"
    frontend_base_url: str = "http://localhost:5173"

    refresh_cookie_name: str = "pda_refresh_token"
    refresh_cookie_secure: bool = False
    # "lax" works for local dev (same registrable site on different ports);
    # cross-domain deploys (frontend/backend on separate hosts) need "none"
    # + refresh_cookie_secure=True or the browser won't send the cookie.
    refresh_cookie_samesite: str = "lax"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
