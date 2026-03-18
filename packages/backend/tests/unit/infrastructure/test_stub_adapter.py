# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false, reportUnknownArgumentType=false

from __future__ import annotations

from decimal import Decimal

from app.domain.pricing.value_objects import PlatformConfig
from app.infrastructure.external.adapters.stub import StubAdapter


def make_stub_config(name: str = "test_stub") -> PlatformConfig:
    return PlatformConfig(
        name=name,
        base_url="https://test.example.com",
        search_url_template="{base_url}/search?q={query}",
        enabled=True,
        adapter_type="stub",
    )


class TestStubAdapter:
    def test_returns_exactly_three_results(self) -> None:
        adapter = StubAdapter(make_stub_config())

        results = adapter.search("test query")

        assert len(results) == 3

    def test_results_have_deterministic_prices(self) -> None:
        adapter = StubAdapter(make_stub_config())

        results = adapter.search("any query")

        prices = [result.price_amount for result in results]
        assert prices == [Decimal("29900"), Decimal("34900"), Decimal("26900")]

    def test_platform_name_matches_config(self) -> None:
        adapter = StubAdapter(make_stub_config(name="my_platform"))

        assert adapter.platform_name == "my_platform"
        results = adapter.search("query")
        assert all(result.platform == "my_platform" for result in results)

    def test_health_check_returns_true(self) -> None:
        adapter = StubAdapter(make_stub_config())

        assert adapter.health_check() is True

    def test_results_include_query_in_raw_title(self) -> None:
        adapter = StubAdapter(make_stub_config())

        results = adapter.search("laptop stand")

        assert all("laptop stand" in result.raw_title for result in results)

    def test_third_item_is_out_of_stock(self) -> None:
        adapter = StubAdapter(make_stub_config())

        results = adapter.search("test")

        assert results[0].in_stock is True
        assert results[1].in_stock is True
        assert results[2].in_stock is False
