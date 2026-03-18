from __future__ import annotations

from decimal import Decimal
from typing import override

from app.domain.pricing.value_objects import PlatformConfig, PriceResult
from .base import BasePlatformAdapter


class StubAdapter(BasePlatformAdapter):
    def __init__(self, config: PlatformConfig) -> None:
        super().__init__(config)

    @override
    def search(self, query: str) -> list[PriceResult]:
        base_price = Decimal("29900")
        return [
            PriceResult(
                platform=self.platform_name,
                price_amount=base_price,
                currency="KRW",
                product_url=f"{self._config.base_url}/product/1",
                in_stock=True,
                raw_title=f"{query} - Option A",
            ),
            PriceResult(
                platform=self.platform_name,
                price_amount=base_price + Decimal("5000"),
                currency="KRW",
                product_url=f"{self._config.base_url}/product/2",
                in_stock=True,
                raw_title=f"{query} - Option B",
            ),
            PriceResult(
                platform=self.platform_name,
                price_amount=base_price - Decimal("3000"),
                currency="KRW",
                product_url=f"{self._config.base_url}/product/3",
                in_stock=False,
                raw_title=f"{query} - Option C",
            ),
        ]
