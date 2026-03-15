from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.exceptions import DuplicateTrackedProductError
from app.domain.tracking.repository import TrackingRepository


class TrackProductInteractor:
    _repo: TrackingRepository

    def __init__(self, repo: TrackingRepository) -> None:
        self._repo = repo

    def execute(
        self,
        user_id: UUID,
        source_url: str,
        source_title: str,
        source_platform: str | None = None,
        source_image_url: str | None = None,
        source_price_amount: Decimal | None = None,
        source_currency: str | None = None,
    ) -> TrackedProduct:
        normalized_url = source_url.strip()
        existing_product = self._repo.find_by_user_and_url(user_id, normalized_url)
        if existing_product is not None:
            raise DuplicateTrackedProductError

        tracked_product = TrackedProduct.create(
            user_id=user_id,
            source_url=normalized_url,
            source_title=source_title,
            source_platform=source_platform,
            source_image_url=source_image_url,
            source_price_amount=source_price_amount,
            source_currency=source_currency,
        )
        return self._repo.save(tracked_product)
