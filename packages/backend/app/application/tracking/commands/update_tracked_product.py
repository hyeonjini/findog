from __future__ import annotations

from dataclasses import replace
from uuid import UUID

from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.exceptions import TrackedProductNotFoundError
from app.domain.tracking.repository import TrackingRepository


class UpdateTrackedProductInteractor:
    _repo: TrackingRepository

    def __init__(self, repo: TrackingRepository) -> None:
        self._repo = repo

    def execute(
        self,
        user_id: UUID,
        product_id: UUID,
        source_title: str | None = None,
        restock_alert_enabled: bool | None = None,
        lowest_price_tracking_enabled: bool | None = None,
    ) -> TrackedProduct:
        tracked_product = self._repo.find_by_id(product_id)
        if tracked_product is None or tracked_product.user_id != user_id:
            raise TrackedProductNotFoundError

        updates: dict[str, str | bool] = {}
        if source_title is not None:
            updates["source_title"] = source_title
        if restock_alert_enabled is not None:
            updates["restock_alert_enabled"] = restock_alert_enabled
        if lowest_price_tracking_enabled is not None:
            updates["lowest_price_tracking_enabled"] = lowest_price_tracking_enabled

        updated_product = replace(tracked_product, **updates)
        return self._repo.update(updated_product)
