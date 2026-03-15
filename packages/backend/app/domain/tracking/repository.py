from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.tracking.entity import TrackedProduct


class TrackingRepository(Protocol):
    def save(self, tracked_product: TrackedProduct) -> TrackedProduct:
        ...

    def update(self, tracked_product: TrackedProduct) -> TrackedProduct:
        ...

    def find_by_id(self, tracked_product_id: UUID) -> TrackedProduct | None:
        ...

    def find_by_user_id(self, user_id: UUID) -> list[TrackedProduct]:
        ...

    def find_by_user_and_url(self, user_id: UUID, source_url: str) -> TrackedProduct | None:
        ...
