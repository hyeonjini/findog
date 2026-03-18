from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.pricing.entity import PricePoint
from app.domain.pricing.value_objects import PriceResult


class PriceHistoryRepository(Protocol):
    def save(self, price_point: PricePoint) -> PricePoint:
        ...

    def list_by_product(
        self, tracked_product_id: UUID, *, limit: int = 50
    ) -> list[PricePoint]:
        ...

    def latest_by_product_and_platform(
        self, tracked_product_id: UUID
    ) -> dict[str, PricePoint]:
        ...


class PlatformAdapter(Protocol):
    @property
    def platform_name(self) -> str:
        ...

    def search(self, query: str) -> list[PriceResult]:
        ...

    def health_check(self) -> bool:
        ...


class SearchStrategy(Protocol):
    def search(
        self, query: str, adapters: dict[str, PlatformAdapter]
    ) -> list[PriceResult]:
        ...
