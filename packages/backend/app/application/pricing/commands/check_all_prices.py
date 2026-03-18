from __future__ import annotations

import logging

from app.domain.pricing.entity import PricePoint
from app.domain.pricing.ports import PlatformAdapter, PriceHistoryRepository, SearchStrategy
from app.domain.tracking.repository import TrackingRepository

logger = logging.getLogger(__name__)


class CheckAllPricesInteractor:
    _tracking_repo: TrackingRepository
    _price_history_repo: PriceHistoryRepository
    _strategy: SearchStrategy
    _adapters: dict[str, PlatformAdapter]

    def __init__(
        self,
        tracking_repo: TrackingRepository,
        price_history_repo: PriceHistoryRepository,
        strategy: SearchStrategy,
        adapters: dict[str, PlatformAdapter],
    ) -> None:
        self._tracking_repo = tracking_repo
        self._price_history_repo = price_history_repo
        self._strategy = strategy
        self._adapters = adapters

    def execute(self) -> list[PricePoint]:
        products = self._tracking_repo.find_active_with_price_tracking()

        if not products:
            logger.info("No products with price tracking enabled - skipping")
            return []

        all_saved: list[PricePoint] = []

        for product in products:
            try:
                query = product.normalized_query or product.source_title
                results = self._strategy.search(query, self._adapters)

                for result in results:
                    price_point = PricePoint.create(
                        tracked_product_id=product.id,
                        platform=result.platform,
                        price_amount=result.price_amount,
                        currency=result.currency,
                        product_url=result.product_url,
                        in_stock=result.in_stock,
                    )
                    saved = self._price_history_repo.save(price_point)
                    all_saved.append(saved)

            except Exception:
                logger.exception(
                    "Failed to check prices for product %s", product.id
                )
                continue

        return all_saved
