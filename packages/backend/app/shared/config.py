from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import ClassVar


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./findog.db"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(env_file=".env")


settings = Settings()
