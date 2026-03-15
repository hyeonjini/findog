from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import override


@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

    def __post_init__(self) -> None:
        normalized_currency = self.currency.strip().upper()
        if not normalized_currency:
            raise ValueError("Currency must be non-empty")
        if self.amount < Decimal("0"):
            raise ValueError("Money amount cannot be negative")
        object.__setattr__(self, "currency", normalized_currency)

    @override
    def __str__(self) -> str:
        return f"{self.amount} {self.currency}"
