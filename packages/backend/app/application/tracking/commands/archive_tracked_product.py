from __future__ import annotations

from uuid import UUID

from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.exceptions import TrackedProductNotFoundError
from app.domain.tracking.repository import TrackingRepository


class ArchiveTrackedProductInteractor:
    _repo: TrackingRepository

    def __init__(self, repo: TrackingRepository) -> None:
        self._repo = repo

    def execute(self, user_id: UUID, product_id: UUID, restore: bool = False) -> TrackedProduct:
        tracked_product = self._repo.find_by_id(product_id)
        if tracked_product is None or tracked_product.user_id != user_id:
            raise TrackedProductNotFoundError

        if restore:
            next_product = tracked_product.restore()
        elif tracked_product.is_archived:
            next_product = tracked_product
        else:
            next_product = tracked_product.archive()

        return self._repo.update(next_product)
