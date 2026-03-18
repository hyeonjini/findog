from __future__ import annotations

from app.domain.pricing.ports import PlatformAdapter
from app.domain.pricing.value_objects import PriceResult


class SimpleSearchStrategy:
    def search(
        self, query: str, adapters: dict[str, PlatformAdapter]
    ) -> list[PriceResult]:
        all_results: list[PriceResult] = []

        for adapter in adapters.values():
            try:
                results = adapter.search(query)
                all_results.extend(results)
            except Exception:
                continue

        all_results.sort(key=lambda result: result.price_amount)
        return all_results
