from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.tracking.entity import TrackedProduct


class TrackedProductCreateRequest(BaseModel):
    source_url: str = Field(min_length=1)
    source_title: str = Field(min_length=1)
    source_platform: str | None = None
    source_image_url: str | None = None
    source_price_amount: Decimal | None = None
    source_currency: str | None = None


class TrackedProductUpdateRequest(BaseModel):
    source_title: str | None = Field(default=None, min_length=1)
    restock_alert_enabled: bool | None = None
    lowest_price_tracking_enabled: bool | None = None


class TrackedProductResponse(BaseModel):
    id: UUID
    user_id: UUID
    source_url: str
    source_platform: str | None
    source_title: str
    source_image_url: str | None
    source_price_amount: Decimal | None
    source_currency: str | None
    normalized_query: str | None
    product_fingerprint: str | None
    monitoring_status: str
    restock_alert_enabled: bool
    lowest_price_tracking_enabled: bool
    last_checked_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_entity(cls, tracked_product: TrackedProduct) -> "TrackedProductResponse":
        return cls(
            id=tracked_product.id,
            user_id=tracked_product.user_id,
            source_url=tracked_product.source_url,
            source_platform=tracked_product.source_platform,
            source_title=tracked_product.source_title,
            source_image_url=tracked_product.source_image_url,
            source_price_amount=tracked_product.source_price_amount,
            source_currency=tracked_product.source_currency,
            normalized_query=tracked_product.normalized_query,
            product_fingerprint=tracked_product.product_fingerprint,
            monitoring_status=tracked_product.monitoring_status,
            restock_alert_enabled=tracked_product.restock_alert_enabled,
            lowest_price_tracking_enabled=tracked_product.lowest_price_tracking_enabled,
            last_checked_at=tracked_product.last_checked_at,
            created_at=tracked_product.created_at,
            updated_at=tracked_product.updated_at,
        )


class TrackedProductListResponse(BaseModel):
    items: list[TrackedProductResponse]

    @classmethod
    def from_entities(cls, tracked_products: list[TrackedProduct]) -> "TrackedProductListResponse":
        return cls(items=[TrackedProductResponse.from_entity(item) for item in tracked_products])
