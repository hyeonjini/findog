from __future__ import annotations

from uuid import UUID

from app.domain.pricing.entity import PricePoint
from app.domain.pricing.ports import PriceHistoryRepository
from app.domain.tracking.exceptions import TrackedProductNotFoundError
from app.domain.tracking.repository import TrackingRepository


class GetPriceHistoryQuery:
    _price_history_repo: PriceHistoryRepository
    _tracking_repo: TrackingRepository

    def __init__(
        self,
        price_history_repo: PriceHistoryRepository,
        tracking_repo: TrackingRepository,
    ) -> None:
        self._price_history_repo = price_history_repo
        self._tracking_repo = tracking_repo

    def execute(
        self, product_id: UUID, user_id: UUID, *, limit: int = 50
    ) -> list[PricePoint]:
        product = self._tracking_repo.find_by_id(product_id)
        if product is None or product.user_id != user_id:
            raise TrackedProductNotFoundError

        return self._price_history_repo.list_by_product(
            product_id, limit=limit
        )
