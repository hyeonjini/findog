from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from app.domain.pricing.exceptions import InvalidPriceError


@dataclass(frozen=True)
class PricePoint:
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
    def create(
        cls,
        *,
        tracked_product_id: UUID,
        platform: str,
        price_amount: Decimal,
        currency: str,
        product_url: str | None = None,
        in_stock: bool = True,
    ) -> "PricePoint":
        if not platform.strip():
            raise InvalidPriceError("Platform must be non-empty", status_code=422)
        if price_amount < Decimal("0"):
            raise InvalidPriceError("Price amount cannot be negative", status_code=422)
        normalized_currency = currency.strip().upper()
        if not normalized_currency:
            raise InvalidPriceError("Currency must be non-empty", status_code=422)

        now = datetime.now(UTC)
        return cls(
            id=uuid4(),
            tracked_product_id=tracked_product_id,
            platform=platform.strip(),
            price_amount=price_amount,
            currency=normalized_currency,
            product_url=product_url,
            in_stock=in_stock,
            checked_at=now,
            created_at=now,
        )
