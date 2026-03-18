from __future__ import annotations

from uuid import UUID

from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.exceptions import TrackedProductNotFoundError
from app.domain.tracking.repository import TrackingRepository


class GetTrackedProductDetailInteractor:
    _tracking_repository: TrackingRepository

    def __init__(self, tracking_repository: TrackingRepository) -> None:
        self._tracking_repository = tracking_repository

    def execute(self, user_id: UUID, product_id: UUID) -> TrackedProduct:
        tracked_product = self._tracking_repository.find_by_id(product_id)

        if tracked_product is None or tracked_product.user_id != user_id:
            raise TrackedProductNotFoundError

        return tracked_product
