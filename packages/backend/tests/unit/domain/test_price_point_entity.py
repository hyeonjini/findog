# pyright: reportMissingImports=false, reportUnknownMemberType=false

from __future__ import annotations

from dataclasses import FrozenInstanceError
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

import pytest

from app.domain.pricing.entity import PricePoint
from app.domain.pricing.exceptions import InvalidPriceError


def make_price_point() -> PricePoint:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return PricePoint(
        id=UUID("00000000-0000-0000-0000-000000000301"),
        tracked_product_id=UUID("00000000-0000-0000-0000-000000000401"),
        platform="example",
        price_amount=Decimal("19.99"),
        currency="USD",
        product_url="https://example.com/products/301",
        in_stock=True,
        checked_at=created_at,
        created_at=created_at,
    )


class TestPricePoint:
    def test_create_with_valid_data(self) -> None:
        price_point = PricePoint.create(
            tracked_product_id=UUID("00000000-0000-0000-0000-000000000001"),
            platform="  example  ",
            price_amount=Decimal("29.99"),
            currency=" usd ",
            product_url="https://example.com/products/1",
        )

        assert price_point.tracked_product_id == UUID("00000000-0000-0000-0000-000000000001")
        assert price_point.platform == "example"
        assert price_point.price_amount == Decimal("29.99")
        assert price_point.currency == "USD"
        assert price_point.product_url == "https://example.com/products/1"
        assert price_point.in_stock is True
        assert price_point.checked_at == price_point.created_at
        assert price_point.checked_at.tzinfo is not None
        assert price_point.created_at.tzinfo is not None

    def test_create_rejects_negative_price(self) -> None:
        with pytest.raises(InvalidPriceError, match="cannot be negative"):
            _ = PricePoint.create(
                tracked_product_id=UUID("00000000-0000-0000-0000-000000000001"),
                platform="example",
                price_amount=Decimal("-0.01"),
                currency="USD",
            )

    def test_create_rejects_empty_currency(self) -> None:
        with pytest.raises(InvalidPriceError, match="non-empty"):
            _ = PricePoint.create(
                tracked_product_id=UUID("00000000-0000-0000-0000-000000000001"),
                platform="example",
                price_amount=Decimal("10.00"),
                currency="   ",
            )

    def test_create_rejects_empty_platform(self) -> None:
        with pytest.raises(InvalidPriceError, match="non-empty"):
            _ = PricePoint.create(
                tracked_product_id=UUID("00000000-0000-0000-0000-000000000001"),
                platform="   ",
                price_amount=Decimal("10.00"),
                currency="USD",
            )

    def test_frozen_immutability(self) -> None:
        price_point = make_price_point()

        with pytest.raises(FrozenInstanceError):
            setattr(price_point, "platform", "other")
