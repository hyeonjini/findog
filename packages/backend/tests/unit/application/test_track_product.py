# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

from decimal import Decimal
from typing import cast
from unittest.mock import Mock, call
from uuid import UUID

import pytest

from app.application.tracking.commands.track_product import TrackProductInteractor
from app.domain.tracking.entity import MONITORING_STATUS_ACTIVE, TrackedProduct
from app.domain.tracking.exceptions import DuplicateTrackedProductError
from app.domain.tracking.repository import TrackingRepository


def make_tracked_product(
    *,
    user_id: UUID,
    source_url: str,
    source_title: str = "Tracked product",
) -> TrackedProduct:
    return TrackedProduct.create(
        user_id=user_id,
        source_url=source_url,
        source_title=source_title,
    )


def return_tracked_product(tracked_product: TrackedProduct) -> TrackedProduct:
    return tracked_product


class TestTrackProductInteractor:
    def test_creates_product_with_valid_data(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000301")
        repository = Mock(spec=TrackingRepository)
        find_by_user_and_url = cast(Mock, repository.find_by_user_and_url)
        save = cast(Mock, repository.save)
        find_by_user_and_url.return_value = None
        save.side_effect = return_tracked_product
        interactor = TrackProductInteractor(repo=cast(TrackingRepository, repository))

        tracked_product = interactor.execute(
            user_id=user_id,
            source_url="https://example.com/products/301",
            source_title="Product 301",
            source_platform="example",
            source_image_url="https://example.com/products/301.png",
            source_price_amount=Decimal("12.34"),
            source_currency="usd",
        )

        assert find_by_user_and_url.call_args_list == [
            call(user_id, "https://example.com/products/301"),
        ]
        save.assert_called_once()
        assert save.call_args.args[0] == tracked_product
        assert tracked_product.user_id == user_id
        assert tracked_product.source_url == "https://example.com/products/301"
        assert tracked_product.source_title == "Product 301"
        assert tracked_product.source_platform == "example"
        assert tracked_product.source_image_url == "https://example.com/products/301.png"
        assert tracked_product.source_price_amount == Decimal("12.34")
        assert tracked_product.source_currency == "USD"

    def test_rejects_duplicate_url(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000302")
        source_url = "https://example.com/products/302"
        repository = Mock(spec=TrackingRepository)
        find_by_user_and_url = cast(Mock, repository.find_by_user_and_url)
        save = cast(Mock, repository.save)
        find_by_user_and_url.return_value = make_tracked_product(
            user_id=user_id,
            source_url=source_url,
        )
        interactor = TrackProductInteractor(repo=cast(TrackingRepository, repository))

        with pytest.raises(DuplicateTrackedProductError):
            _ = interactor.execute(
                user_id=user_id,
                source_url=source_url,
                source_title="Duplicate product",
            )

        find_by_user_and_url.assert_called_once_with(user_id, source_url)
        save.assert_not_called()

    def test_sets_default_monitoring_status(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000303")
        repository = Mock(spec=TrackingRepository)
        find_by_user_and_url = cast(Mock, repository.find_by_user_and_url)
        save = cast(Mock, repository.save)
        find_by_user_and_url.return_value = None
        save.side_effect = return_tracked_product
        interactor = TrackProductInteractor(repo=cast(TrackingRepository, repository))

        tracked_product = interactor.execute(
            user_id=user_id,
            source_url="https://example.com/products/303",
            source_title="Product 303",
        )

        assert tracked_product.monitoring_status == MONITORING_STATUS_ACTIVE
        assert tracked_product.restock_alert_enabled is False
        assert tracked_product.lowest_price_tracking_enabled is False
        find_by_user_and_url.assert_called_once_with(
            user_id,
            "https://example.com/products/303",
        )
        save.assert_called_once()
        assert save.call_args.args[0] == tracked_product
