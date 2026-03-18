from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import ClassVar


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./findog.db"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    SCHEDULER_ENABLED: bool = False
    PRICE_CHECK_INTERVAL_MINUTES: int = 360
    PLATFORMS_CONFIG_PATH: str = "config/platforms.yaml"

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(env_file=".env")


settings = Settings()
