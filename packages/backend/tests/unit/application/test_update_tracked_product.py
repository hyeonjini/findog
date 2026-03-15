# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

from datetime import UTC, datetime
from typing import cast
from unittest.mock import Mock
from uuid import UUID

import pytest

from app.application.tracking.commands.update_tracked_product import (
    UpdateTrackedProductInteractor,
)
from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.exceptions import TrackedProductNotFoundError
from app.domain.tracking.repository import TrackingRepository


def make_tracked_product(
    *,
    product_id: UUID,
    user_id: UUID,
    source_title: str = "Original title",
    restock_alert_enabled: bool = False,
    lowest_price_tracking_enabled: bool = False,
) -> TrackedProduct:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return TrackedProduct(
        id=product_id,
        user_id=user_id,
        source_url="https://example.com/products/update",
        source_title=source_title,
        source_platform="example",
        source_image_url=None,
        source_price_amount=None,
        source_currency=None,
        normalized_query=None,
        product_fingerprint="update-product",
        monitoring_status="active",
        restock_alert_enabled=restock_alert_enabled,
        lowest_price_tracking_enabled=lowest_price_tracking_enabled,
        last_checked_at=None,
        created_at=created_at,
        updated_at=created_at,
    )


def return_tracked_product(tracked_product: TrackedProduct) -> TrackedProduct:
    return tracked_product


class TestUpdateTrackedProductInteractor:
    def test_updates_only_requested_fields(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000401")
        product_id = UUID("00000000-0000-0000-0000-000000000402")
        existing_product = make_tracked_product(
            product_id=product_id,
            user_id=user_id,
            lowest_price_tracking_enabled=True,
        )
        repository = Mock(spec=TrackingRepository)
        find_by_id = cast(Mock, repository.find_by_id)
        update = cast(Mock, repository.update)
        find_by_id.return_value = existing_product
        update.side_effect = return_tracked_product
        interactor = UpdateTrackedProductInteractor(repo=cast(TrackingRepository, repository))

        updated_product = interactor.execute(
            user_id=user_id,
            product_id=product_id,
            source_title="Updated title",
            restock_alert_enabled=True,
        )

        find_by_id.assert_called_once_with(product_id)
        update.assert_called_once()
        assert update.call_args.args[0] == updated_product
        assert updated_product.source_title == "Updated title"
        assert updated_product.restock_alert_enabled is True
        assert updated_product.lowest_price_tracking_enabled is True
        assert updated_product.source_url == existing_product.source_url
        assert updated_product.updated_at > existing_product.updated_at
        assert existing_product.source_title == "Original title"
        assert existing_product.restock_alert_enabled is False

    def test_rejects_nonexistent_product(self) -> None:
        repository = Mock(spec=TrackingRepository)
        find_by_id = cast(Mock, repository.find_by_id)
        update = cast(Mock, repository.update)
        find_by_id.return_value = None
        interactor = UpdateTrackedProductInteractor(repo=cast(TrackingRepository, repository))
        user_id = UUID("00000000-0000-0000-0000-000000000403")
        product_id = UUID("00000000-0000-0000-0000-000000000404")

        with pytest.raises(TrackedProductNotFoundError):
            _ = interactor.execute(
                user_id=user_id,
                product_id=product_id,
                source_title="Missing product",
            )

        find_by_id.assert_called_once_with(product_id)
        update.assert_not_called()

    def test_rejects_wrong_user_ownership(self) -> None:
        owner_id = UUID("00000000-0000-0000-0000-000000000405")
        other_user_id = UUID("00000000-0000-0000-0000-000000000406")
        product_id = UUID("00000000-0000-0000-0000-000000000407")
        repository = Mock(spec=TrackingRepository)
        find_by_id = cast(Mock, repository.find_by_id)
        update = cast(Mock, repository.update)
        find_by_id.return_value = make_tracked_product(
            product_id=product_id,
            user_id=owner_id,
        )
        interactor = UpdateTrackedProductInteractor(repo=cast(TrackingRepository, repository))

        with pytest.raises(TrackedProductNotFoundError):
            _ = interactor.execute(
                user_id=other_user_id,
                product_id=product_id,
                source_title="Should fail",
            )

        find_by_id.assert_called_once_with(product_id)
        update.assert_not_called()
