from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Pooled connection (port 6543, pgbouncer) — used by the app at runtime
    database_url: str = "postgresql://localhost:5432/realestate"
    # Direct connection (port 5432) — used by Alembic migrations
    direct_url: str = ""
    openai_api_key: str = ""
    frontend_url: str = "http://localhost:5173"

    @property
    def async_database_url(self) -> str:
        """Convert pooled postgres URL to asyncpg format."""
        url = self.database_url
        # Strip pgbouncer param — asyncpg doesn't understand it
        url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @property
    def migration_database_url(self) -> str:
        """Direct URL for Alembic migrations (falls back to database_url)."""
        url = self.direct_url or self.database_url
        # Strip pgbouncer param for sync driver
        url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
        if url.startswith("postgres://") and not url.startswith("postgresql://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
