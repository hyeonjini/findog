# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import cast
from unittest.mock import Mock
from uuid import UUID

from app.application.pricing.commands.check_all_prices import CheckAllPricesInteractor
from app.domain.pricing.entity import PricePoint
from app.domain.pricing.ports import PriceHistoryRepository, SearchStrategy
from app.domain.pricing.value_objects import PriceResult
from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.repository import TrackingRepository


def make_tracked_product(
    *,
    product_id: UUID,
    user_id: UUID,
    source_title: str = "Test Product",
    lowest_price_tracking_enabled: bool = True,
) -> TrackedProduct:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return TrackedProduct(
        id=product_id,
        user_id=user_id,
        source_url="https://example.com/products/test",
        source_title=source_title,
        source_platform="example",
        source_image_url=None,
        source_price_amount=None,
        source_currency=None,
        normalized_query=None,
        product_fingerprint=None,
        monitoring_status="active",
        restock_alert_enabled=False,
        lowest_price_tracking_enabled=lowest_price_tracking_enabled,
        last_checked_at=None,
        created_at=created_at,
        updated_at=created_at,
    )


def make_price_result(platform: str = "coupang", price: str = "29900") -> PriceResult:
    return PriceResult(
        platform=platform,
        price_amount=Decimal(price),
        currency="KRW",
        product_url=f"https://{platform}.com/product",
        in_stock=True,
        raw_title="Test Product",
    )


def return_price_point(price_point: PricePoint) -> PricePoint:
    return price_point


class TestCheckAllPricesInteractor:
    def test_searches_and_saves_results(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000001")
        product_id = UUID("00000000-0000-0000-0000-000000000002")
        product = make_tracked_product(product_id=product_id, user_id=user_id)

        tracking_repo = Mock(spec=TrackingRepository)
        cast(Mock, tracking_repo.find_active_with_price_tracking).return_value = [product]

        price_history_repo = Mock(spec=PriceHistoryRepository)
        cast(Mock, price_history_repo.save).side_effect = return_price_point

        strategy = Mock(spec=SearchStrategy)
        cast(Mock, strategy.search).return_value = [
            make_price_result("coupang", "29900"),
            make_price_result("naver", "31000"),
        ]

        interactor = CheckAllPricesInteractor(
            tracking_repo=cast(TrackingRepository, tracking_repo),
            price_history_repo=cast(PriceHistoryRepository, price_history_repo),
            strategy=cast(SearchStrategy, strategy),
            adapters={},
        )

        saved = interactor.execute()

        assert len(saved) == 2
        cast(Mock, tracking_repo.find_active_with_price_tracking).assert_called_once()
        cast(Mock, strategy.search).assert_called_once()
        assert cast(Mock, price_history_repo.save).call_count == 2

    def test_returns_empty_when_no_products(self) -> None:
        tracking_repo = Mock(spec=TrackingRepository)
        cast(Mock, tracking_repo.find_active_with_price_tracking).return_value = []

        price_history_repo = Mock(spec=PriceHistoryRepository)
        strategy = Mock(spec=SearchStrategy)

        interactor = CheckAllPricesInteractor(
            tracking_repo=cast(TrackingRepository, tracking_repo),
            price_history_repo=cast(PriceHistoryRepository, price_history_repo),
            strategy=cast(SearchStrategy, strategy),
            adapters={},
        )

        result = interactor.execute()

        assert result == []
        cast(Mock, strategy.search).assert_not_called()
        cast(Mock, price_history_repo.save).assert_not_called()

    def test_continues_on_per_product_error(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000003")
        product_a = make_tracked_product(
            product_id=UUID("00000000-0000-0000-0000-000000000004"),
            user_id=user_id,
            source_title="Product A",
        )
        product_b = make_tracked_product(
            product_id=UUID("00000000-0000-0000-0000-000000000005"),
            user_id=user_id,
            source_title="Product B",
        )

        tracking_repo = Mock(spec=TrackingRepository)
        cast(Mock, tracking_repo.find_active_with_price_tracking).return_value = [
            product_a,
            product_b,
        ]

        price_history_repo = Mock(spec=PriceHistoryRepository)
        cast(Mock, price_history_repo.save).side_effect = return_price_point

        strategy = Mock(spec=SearchStrategy)
        cast(Mock, strategy.search).side_effect = [
            RuntimeError("Adapter failed"),
            [make_price_result("naver", "15000")],
        ]

        interactor = CheckAllPricesInteractor(
            tracking_repo=cast(TrackingRepository, tracking_repo),
            price_history_repo=cast(PriceHistoryRepository, price_history_repo),
            strategy=cast(SearchStrategy, strategy),
            adapters={},
        )

        saved = interactor.execute()

        assert len(saved) == 1
        assert cast(Mock, strategy.search).call_count == 2

    def test_uses_normalized_query_when_available(self) -> None:
        user_id = UUID("00000000-0000-0000-0000-000000000006")
        product_id = UUID("00000000-0000-0000-0000-000000000007")
        created_at = datetime(2026, 1, 1, tzinfo=UTC)
        product = TrackedProduct(
            id=product_id,
            user_id=user_id,
            source_url="https://example.com/products/custom",
            source_title="Original Title",
            source_platform="example",
            source_image_url=None,
            source_price_amount=None,
            source_currency=None,
            normalized_query="custom search query",
            product_fingerprint=None,
            monitoring_status="active",
            restock_alert_enabled=False,
            lowest_price_tracking_enabled=True,
            last_checked_at=None,
            created_at=created_at,
            updated_at=created_at,
        )

        tracking_repo = Mock(spec=TrackingRepository)
        cast(Mock, tracking_repo.find_active_with_price_tracking).return_value = [product]

        price_history_repo = Mock(spec=PriceHistoryRepository)
        strategy = Mock(spec=SearchStrategy)
        cast(Mock, strategy.search).return_value = []

        interactor = CheckAllPricesInteractor(
            tracking_repo=cast(TrackingRepository, tracking_repo),
            price_history_repo=cast(PriceHistoryRepository, price_history_repo),
            strategy=cast(SearchStrategy, strategy),
            adapters={},
        )

        _ = interactor.execute()

        cast(Mock, strategy.search).assert_called_once()
        call_args = cast(Mock, strategy.search).call_args
        assert call_args[0][0] == "custom search query"
