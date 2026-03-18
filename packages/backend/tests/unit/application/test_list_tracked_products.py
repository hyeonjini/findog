# pyright: reportMissingImports=false, reportUnknownMemberType=false

from __future__ import annotations

from datetime import UTC, datetime
from typing import cast
from unittest.mock import Mock
from uuid import UUID

from app.application.tracking.queries.list_tracked_products import (
    ListTrackedProductsInteractor,
)
from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.repository import TrackingRepository


def make_tracked_product(*, product_id: UUID, user_id: UUID, source_title: str) -> TrackedProduct:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return TrackedProduct(
        id=product_id,
        user_id=user_id,
        source_url=f"https://example.com/products/{product_id.int}",
        source_title=source_title,
        source_platform="example",
        source_image_url=None,
        source_price_amount=None,
        source_currency=None,
        normalized_query=None,
        product_fingerprint=f"fingerprint-{product_id.int}",
        monitoring_status="active",
        restock_alert_enabled=False,
        lowest_price_tracking_enabled=False,
        last_checked_at=None,
        created_at=created_at,
        updated_at=created_at,
    )


class TestListTrackedProductsInteractor:
    def test_returns_user_products(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000601")
        other_user_id = UUID("00000000-0000-0000-0000-000000000602")
        first_product = make_tracked_product(
            product_id=UUID("00000000-0000-0000-0000-000000000603"),
            user_id=user_id,
            source_title="Product one",
        )
        second_product = make_tracked_product(
            product_id=UUID("00000000-0000-0000-0000-000000000604"),
            user_id=user_id,
            source_title="Product two",
        )
        other_product = make_tracked_product(
            product_id=UUID("00000000-0000-0000-0000-000000000605"),
            user_id=other_user_id,
            source_title="Other product",
        )
        repository = Mock(spec=TrackingRepository)
        find_by_user_id = cast(Mock, repository.find_by_user_id)
        find_by_user_id.return_value = [first_product, second_product]
        interactor = ListTrackedProductsInteractor(
            tracking_repository=cast(TrackingRepository, repository)
        )

        products = interactor.execute(user_id=user_id)

        find_by_user_id.assert_called_once_with(user_id)
        assert products == [first_product, second_product]
        assert all(product.user_id == user_id for product in products)
        assert other_product.user_id == other_user_id

    def test_returns_empty_for_user_with_no_products(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000606")
        repository = Mock(spec=TrackingRepository)
        find_by_user_id = cast(Mock, repository.find_by_user_id)
        find_by_user_id.return_value = []
        interactor = ListTrackedProductsInteractor(
            tracking_repository=cast(TrackingRepository, repository)
        )

        products = interactor.execute(user_id=user_id)

        find_by_user_id.assert_called_once_with(user_id)
        assert products == []
