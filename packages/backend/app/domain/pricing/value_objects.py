from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class PriceResult:
    platform: str
    price_amount: Decimal
    currency: str
    product_url: str
    in_stock: bool
    raw_title: str


@dataclass(frozen=True)
class PlatformConfig:
    name: str
    base_url: str
    search_url_template: str
    enabled: bool
    adapter_type: str
