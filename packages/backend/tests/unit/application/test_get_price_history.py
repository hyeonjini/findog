# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import cast
from unittest.mock import Mock
from uuid import UUID

import pytest

from app.application.pricing.queries.get_price_history import GetPriceHistoryQuery
from app.domain.pricing.entity import PricePoint
from app.domain.pricing.ports import PriceHistoryRepository
from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.exceptions import TrackedProductNotFoundError
from app.domain.tracking.repository import TrackingRepository


def make_tracked_product(product_id: UUID, user_id: UUID) -> TrackedProduct:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return TrackedProduct(
        id=product_id,
        user_id=user_id,
        source_url="https://example.com/products/history",
        source_title="History product",
        source_platform="example",
        source_image_url=None,
        source_price_amount=None,
        source_currency=None,
        normalized_query=None,
        product_fingerprint=None,
        monitoring_status="active",
        restock_alert_enabled=False,
        lowest_price_tracking_enabled=True,
        last_checked_at=None,
        created_at=created_at,
        updated_at=created_at,
    )


def make_price_point(tracked_product_id: UUID) -> PricePoint:
    return PricePoint.create(
        tracked_product_id=tracked_product_id,
        platform="coupang",
        price_amount=Decimal("29900"),
        currency="KRW",
    )


class TestGetPriceHistoryQuery:
    def test_returns_history_for_owned_product(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000010")
        product_id = UUID("00000000-0000-0000-0000-000000000011")
        product = make_tracked_product(product_id, user_id)
        price_points = [make_price_point(product_id)]

        tracking_repo = Mock(spec=TrackingRepository)
        cast(Mock, tracking_repo.find_by_id).return_value = product

        price_history_repo = Mock(spec=PriceHistoryRepository)
        cast(Mock, price_history_repo.list_by_product).return_value = price_points
        cast(Mock, price_history_repo.count_by_product).return_value = 1

        query = GetPriceHistoryQuery(
            price_history_repo=cast(PriceHistoryRepository, price_history_repo),
            tracking_repo=cast(TrackingRepository, tracking_repo),
        )

        result = query.execute(product_id=product_id, user_id=user_id)

        assert result.items == price_points
        assert result.total == 1
        cast(Mock, tracking_repo.find_by_id).assert_called_once_with(product_id)
        cast(Mock, price_history_repo.list_by_product).assert_called_once_with(
            product_id, limit=50
        )
        cast(Mock, price_history_repo.count_by_product).assert_called_once_with(
            product_id
        )

    def test_raises_when_product_not_found(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000012")
        product_id = UUID("00000000-0000-0000-0000-000000000013")

        tracking_repo = Mock(spec=TrackingRepository)
        cast(Mock, tracking_repo.find_by_id).return_value = None

        price_history_repo = Mock(spec=PriceHistoryRepository)

        query = GetPriceHistoryQuery(
            price_history_repo=cast(PriceHistoryRepository, price_history_repo),
            tracking_repo=cast(TrackingRepository, tracking_repo),
        )

        with pytest.raises(TrackedProductNotFoundError):
            _ = query.execute(product_id=product_id, user_id=user_id)

        cast(Mock, price_history_repo.list_by_product).assert_not_called()

    def test_raises_when_wrong_user(self) -> None:
        owner_id = UUID("00000000-0000-0000-0000-000000000014")
        other_id = UUID("00000000-0000-0000-0000-000000000015")
        product_id = UUID("00000000-0000-0000-0000-000000000016")
        product = make_tracked_product(product_id, owner_id)

        tracking_repo = Mock(spec=TrackingRepository)
        cast(Mock, tracking_repo.find_by_id).return_value = product

        price_history_repo = Mock(spec=PriceHistoryRepository)

        query = GetPriceHistoryQuery(
            price_history_repo=cast(PriceHistoryRepository, price_history_repo),
            tracking_repo=cast(TrackingRepository, tracking_repo),
        )

        with pytest.raises(TrackedProductNotFoundError):
            _ = query.execute(product_id=product_id, user_id=other_id)

        cast(Mock, price_history_repo.list_by_product).assert_not_called()
