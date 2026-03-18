from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.pricing.value_objects import PlatformConfig, PriceResult


class BasePlatformAdapter(ABC):
    _config: PlatformConfig

    def __init__(self, config: PlatformConfig) -> None:
        self._config = config

    @property
    def platform_name(self) -> str:
        return self._config.name

    @abstractmethod
    def search(self, query: str) -> list[PriceResult]:
        ...

    def health_check(self) -> bool:
        return True
