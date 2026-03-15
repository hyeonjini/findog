from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Final
from uuid import UUID, uuid4

from app.domain.tracking.exceptions import InvalidMonitoringStatusError
from app.domain.tracking.value_objects import Money

MONITORING_STATUS_ACTIVE: Final = "active"
MONITORING_STATUS_PAUSED: Final = "paused"
MONITORING_STATUS_ARCHIVED: Final = "archived"


@dataclass(frozen=True)
class TrackedProduct:
    id: UUID
    user_id: UUID
    source_url: str
    source_title: str
    source_platform: str | None
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
    def create(
        cls,
        *,
        user_id: UUID,
        source_url: str,
        source_title: str,
        source_platform: str | None = None,
        source_image_url: str | None = None,
        source_price_amount: Decimal | None = None,
        source_currency: str | None = None,
        normalized_query: str | None = None,
        product_fingerprint: str | None = None,
        monitoring_status: str = MONITORING_STATUS_ACTIVE,
        restock_alert_enabled: bool = False,
        lowest_price_tracking_enabled: bool = False,
    ) -> "TrackedProduct":
        if not source_url.strip():
            raise ValueError("source_url cannot be empty")
        if not source_title.strip():
            raise ValueError("source_title cannot be empty")

        cls._validate_monitoring_status(monitoring_status)
        if source_price_amount is not None or source_currency is not None:
            if source_price_amount is None:
                raise ValueError("source_price_amount required when source_currency is provided")
            if source_currency is None:
                raise ValueError("source_currency required when source_price_amount is provided")
            validated_price = Money(amount=source_price_amount, currency=source_currency)
            source_price_amount = validated_price.amount
            source_currency = validated_price.currency

        now = datetime.now(UTC)
        return cls(
            id=uuid4(),
            user_id=user_id,
            source_url=source_url,
            source_title=source_title,
            source_platform=source_platform,
            source_image_url=source_image_url,
            source_price_amount=source_price_amount,
            source_currency=source_currency,
            normalized_query=normalized_query,
            product_fingerprint=product_fingerprint,
            monitoring_status=monitoring_status,
            restock_alert_enabled=restock_alert_enabled,
            lowest_price_tracking_enabled=lowest_price_tracking_enabled,
            last_checked_at=None,
            created_at=now,
            updated_at=now,
        )

    @staticmethod
    def _validate_monitoring_status(monitoring_status: str) -> None:
        if monitoring_status not in {
            MONITORING_STATUS_ACTIVE,
            MONITORING_STATUS_PAUSED,
            MONITORING_STATUS_ARCHIVED,
        }:
            raise InvalidMonitoringStatusError(f"Invalid monitoring status: {monitoring_status}")

    @property
    def is_archived(self) -> bool:
        return self.monitoring_status == MONITORING_STATUS_ARCHIVED

    def archive(self) -> "TrackedProduct":
        return TrackedProduct(
            id=self.id,
            user_id=self.user_id,
            source_url=self.source_url,
            source_title=self.source_title,
            source_platform=self.source_platform,
            source_image_url=self.source_image_url,
            source_price_amount=self.source_price_amount,
            source_currency=self.source_currency,
            normalized_query=self.normalized_query,
            product_fingerprint=self.product_fingerprint,
            monitoring_status=MONITORING_STATUS_ARCHIVED,
            restock_alert_enabled=self.restock_alert_enabled,
            lowest_price_tracking_enabled=self.lowest_price_tracking_enabled,
            last_checked_at=self.last_checked_at,
            created_at=self.created_at,
            updated_at=datetime.now(UTC),
        )

    def restore(self) -> "TrackedProduct":
        return TrackedProduct(
            id=self.id,
            user_id=self.user_id,
            source_url=self.source_url,
            source_title=self.source_title,
            source_platform=self.source_platform,
            source_image_url=self.source_image_url,
            source_price_amount=self.source_price_amount,
            source_currency=self.source_currency,
            normalized_query=self.normalized_query,
            product_fingerprint=self.product_fingerprint,
            monitoring_status=MONITORING_STATUS_ACTIVE,
            restock_alert_enabled=self.restock_alert_enabled,
            lowest_price_tracking_enabled=self.lowest_price_tracking_enabled,
            last_checked_at=self.last_checked_at,
            created_at=self.created_at,
            updated_at=datetime.now(UTC),
        )
