from __future__ import annotations

from uuid import UUID

from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.repository import TrackingRepository


class ListTrackedProductsInteractor:
    _tracking_repository: TrackingRepository

    def __init__(self, tracking_repository: TrackingRepository) -> None:
        self._tracking_repository = tracking_repository

    def execute(self, user_id: UUID) -> list[TrackedProduct]:
        return self._tracking_repository.find_by_user_id(user_id)
