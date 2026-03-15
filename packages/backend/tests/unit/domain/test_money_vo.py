# pyright: reportMissingImports=false, reportUnknownMemberType=false

from dataclasses import FrozenInstanceError
from decimal import Decimal

import pytest

from app.domain.tracking.value_objects import Money


class TestMoney:
    def test_valid_money_creation(self) -> None:
        money = Money(amount=Decimal("19.99"), currency=" usd ")

        assert money.amount == Decimal("19.99")
        assert money.currency == "USD"
        assert str(money) == "19.99 USD"

    def test_rejects_negative_amount(self) -> None:
        with pytest.raises(ValueError, match="cannot be negative"):
            _ = Money(amount=Decimal("-0.01"), currency="USD")

    def test_rejects_empty_currency(self) -> None:
        with pytest.raises(ValueError, match="non-empty"):
            _ = Money(amount=Decimal("0"), currency="   ")

    def test_frozen_immutability(self) -> None:
        money = Money(amount=Decimal("5.00"), currency="KRW")

        with pytest.raises(FrozenInstanceError):
            setattr(money, "currency", "USD")
