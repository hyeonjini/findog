# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

from datetime import UTC, datetime
from typing import cast
from unittest.mock import Mock
from uuid import UUID

from app.application.tracking.commands.archive_tracked_product import (
    ArchiveTrackedProductInteractor,
)
from app.domain.tracking.entity import (
    MONITORING_STATUS_ACTIVE,
    MONITORING_STATUS_ARCHIVED,
    TrackedProduct,
)
from app.domain.tracking.repository import TrackingRepository


def make_tracked_product(
    *,
    product_id: UUID,
    user_id: UUID,
    monitoring_status: str = MONITORING_STATUS_ACTIVE,
) -> TrackedProduct:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return TrackedProduct(
        id=product_id,
        user_id=user_id,
        source_url="https://example.com/products/archive",
        source_title="Archive me",
        source_platform="example",
        source_image_url=None,
        source_price_amount=None,
        source_currency=None,
        normalized_query=None,
        product_fingerprint="archive-product",
        monitoring_status=monitoring_status,
        restock_alert_enabled=False,
        lowest_price_tracking_enabled=False,
        last_checked_at=None,
        created_at=created_at,
        updated_at=created_at,
    )


def return_tracked_product(tracked_product: TrackedProduct) -> TrackedProduct:
    return tracked_product


class TestArchiveTrackedProductInteractor:
    def test_archives_product(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000501")
        product_id = UUID("00000000-0000-0000-0000-000000000502")
        repository = Mock(spec=TrackingRepository)
        find_by_id = cast(Mock, repository.find_by_id)
        update = cast(Mock, repository.update)
        find_by_id.return_value = make_tracked_product(
            product_id=product_id,
            user_id=user_id,
        )
        update.side_effect = return_tracked_product
        interactor = ArchiveTrackedProductInteractor(repo=cast(TrackingRepository, repository))

        archived_product = interactor.execute(user_id=user_id, product_id=product_id)

        find_by_id.assert_called_once_with(product_id)
        update.assert_called_once()
        assert update.call_args.args[0] == archived_product
        assert archived_product.monitoring_status == MONITORING_STATUS_ARCHIVED
        assert archived_product.is_archived is True

    def test_restores_product(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000503")
        product_id = UUID("00000000-0000-0000-0000-000000000504")
        repository = Mock(spec=TrackingRepository)
        find_by_id = cast(Mock, repository.find_by_id)
        update = cast(Mock, repository.update)
        find_by_id.return_value = make_tracked_product(
            product_id=product_id,
            user_id=user_id,
            monitoring_status=MONITORING_STATUS_ARCHIVED,
        )
        update.side_effect = return_tracked_product
        interactor = ArchiveTrackedProductInteractor(repo=cast(TrackingRepository, repository))

        restored_product = interactor.execute(
            user_id=user_id,
            product_id=product_id,
            restore=True,
        )

        find_by_id.assert_called_once_with(product_id)
        update.assert_called_once()
        assert update.call_args.args[0] == restored_product
        assert restored_product.monitoring_status == MONITORING_STATUS_ACTIVE
        assert restored_product.is_archived is False

    def test_archive_idempotent(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000505")
        product_id = UUID("00000000-0000-0000-0000-000000000506")
        archived_product = make_tracked_product(
            product_id=product_id,
            user_id=user_id,
            monitoring_status=MONITORING_STATUS_ARCHIVED,
        )
        repository = Mock(spec=TrackingRepository)
        find_by_id = cast(Mock, repository.find_by_id)
        update = cast(Mock, repository.update)
        find_by_id.return_value = archived_product
        update.side_effect = return_tracked_product
        interactor = ArchiveTrackedProductInteractor(repo=cast(TrackingRepository, repository))

        returned_product = interactor.execute(user_id=user_id, product_id=product_id)

        find_by_id.assert_called_once_with(product_id)
        update.assert_called_once_with(archived_product)
        assert returned_product is archived_product
        assert returned_product.monitoring_status == MONITORING_STATUS_ARCHIVED
