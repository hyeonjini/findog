# pyright: reportMissingImports=false, reportUnknownMemberType=false

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.domain.tracking.entity import (
    MONITORING_STATUS_ACTIVE,
    MONITORING_STATUS_ARCHIVED,
    TrackedProduct,
)


def make_tracked_product(
    *,
    monitoring_status: str = MONITORING_STATUS_ACTIVE,
) -> TrackedProduct:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return TrackedProduct(
        id=UUID("00000000-0000-0000-0000-000000000101"),
        user_id=UUID("00000000-0000-0000-0000-000000000201"),
        source_url="https://example.com/products/101",
        source_title="Tracked product",
        source_platform="example",
        source_image_url="https://example.com/products/101.png",
        source_price_amount=None,
        source_currency=None,
        normalized_query="tracked product",
        product_fingerprint="fingerprint-101",
        monitoring_status=monitoring_status,
        restock_alert_enabled=False,
        lowest_price_tracking_enabled=False,
        last_checked_at=None,
        created_at=created_at,
        updated_at=created_at,
    )


class TestTrackedProduct:
    def test_create_sets_defaults(self) -> None:
        product = TrackedProduct.create(
            user_id=UUID("00000000-0000-0000-0000-000000000001"),
            source_url="https://example.com/products/1",
            source_title="Product 1",
        )

        assert product.monitoring_status == MONITORING_STATUS_ACTIVE
        assert product.restock_alert_enabled is False
        assert product.lowest_price_tracking_enabled is False
        assert product.last_checked_at is None
        assert product.created_at == product.updated_at
        assert product.created_at.tzinfo is not None

    def test_archive_sets_status(self) -> None:
        product = make_tracked_product()

        archived_product = product.archive()

        assert archived_product.monitoring_status == MONITORING_STATUS_ARCHIVED
        assert archived_product.is_archived is True
        assert archived_product.id == product.id
        assert archived_product.source_title == product.source_title
        assert archived_product.updated_at > product.updated_at

    def test_restore_sets_status(self) -> None:
        archived_product = make_tracked_product(
            monitoring_status=MONITORING_STATUS_ARCHIVED,
        )

        restored_product = archived_product.restore()

        assert restored_product.monitoring_status == MONITORING_STATUS_ACTIVE
        assert restored_product.is_archived is False
        assert restored_product.id == archived_product.id
        assert restored_product.source_url == archived_product.source_url
        assert restored_product.updated_at > archived_product.updated_at

    def test_archive_already_archived_is_idempotent(self) -> None:
        archived_product = make_tracked_product(
            monitoring_status=MONITORING_STATUS_ARCHIVED,
        )

        archived_again = archived_product.archive()

        assert archived_again.monitoring_status == MONITORING_STATUS_ARCHIVED
        assert archived_again.is_archived is True
        assert archived_again.id == archived_product.id
        assert archived_again.source_title == archived_product.source_title

    def test_is_archived_property(self) -> None:
        active_product = make_tracked_product()
        archived_product = make_tracked_product(
            monitoring_status=MONITORING_STATUS_ARCHIVED,
        )

        assert isinstance(TrackedProduct.is_archived, property)
        assert active_product.is_archived is False
        assert archived_product.is_archived is True
