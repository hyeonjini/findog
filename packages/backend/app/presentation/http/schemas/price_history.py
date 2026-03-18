from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.domain.pricing.entity import PricePoint


class PriceHistoryResponse(BaseModel):
    id: UUID
    tracked_product_id: UUID
    platform: str
    price_amount: Decimal
    currency: str
    product_url: str | None
    in_stock: bool
    checked_at: datetime
    created_at: datetime

    @classmethod
    def from_entity(cls, price_point: PricePoint) -> "PriceHistoryResponse":
        return cls(
            id=price_point.id,
            tracked_product_id=price_point.tracked_product_id,
            platform=price_point.platform,
            price_amount=price_point.price_amount,
            currency=price_point.currency,
            product_url=price_point.product_url,
            in_stock=price_point.in_stock,
            checked_at=price_point.checked_at,
            created_at=price_point.created_at,
        )


class PriceHistoryListResponse(BaseModel):
    items: list[PriceHistoryResponse]
    total: int

    @classmethod
    def from_entities(
        cls, price_points: list[PricePoint], *, total: int
    ) -> "PriceHistoryListResponse":
        return cls(
            items=[PriceHistoryResponse.from_entity(pp) for pp in price_points],
            total=total,
        )
