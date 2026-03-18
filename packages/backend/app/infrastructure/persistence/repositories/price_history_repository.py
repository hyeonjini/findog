# pyright: reportMissingImports=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUnknownParameterType=false
# pyright: reportUntypedBaseClass=false
# pyright: reportMissingSuperCall=false
# pyright: reportGeneralTypeIssues=false
# pyright: reportAttributeAccessIssue=false

from __future__ import annotations

from typing import override
from uuid import UUID

from sqlmodel import Session, select

from app.domain.pricing.entity import PricePoint
from app.domain.pricing.ports import PriceHistoryRepository
from app.infrastructure.persistence.models.price_history import PriceHistoryTable


class SqlaPriceHistoryRepository(PriceHistoryRepository):
    _session: Session

    def __init__(self, session: Session) -> None:
        self._session = session

    @override
    def save(self, price_point: PricePoint) -> PricePoint:
        model = self._to_model(price_point)
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._to_domain(model)

    @override
    def list_by_product(
        self, tracked_product_id: UUID, *, limit: int = 50
    ) -> list[PricePoint]:
        statement = (
            select(PriceHistoryTable)
            .where(PriceHistoryTable.tracked_product_id == tracked_product_id)
            .order_by(PriceHistoryTable.checked_at.desc())  # type: ignore[union-attr]
            .limit(limit)
        )
        models = self._session.exec(statement).all()
        return [self._to_domain(model) for model in models]

    @override
    def latest_by_product_and_platform(
        self, tracked_product_id: UUID
    ) -> dict[str, PricePoint]:
        statement = (
            select(PriceHistoryTable)
            .where(PriceHistoryTable.tracked_product_id == tracked_product_id)
            .order_by(PriceHistoryTable.checked_at.desc())  # type: ignore[union-attr]
        )
        models = self._session.exec(statement).all()

        result: dict[str, PricePoint] = {}
        for model in models:
            if model.platform not in result:
                result[model.platform] = self._to_domain(model)
        return result

    @staticmethod
    def _to_domain(model: PriceHistoryTable) -> PricePoint:
        return PricePoint(
            id=model.id,
            tracked_product_id=model.tracked_product_id,
            platform=model.platform,
            price_amount=model.price_amount,
            currency=model.currency,
            product_url=model.product_url,
            in_stock=model.in_stock,
            checked_at=model.checked_at,
            created_at=model.created_at,
        )

    @staticmethod
    def _to_model(price_point: PricePoint) -> PriceHistoryTable:
        return PriceHistoryTable(
            id=price_point.id,
            tracked_product_id=price_point.tracked_product_id,
            platform=price_point.platform,
            price_amount=price_point.price_amount,
            currency=price_point.currency,
            product_url=price_point.product_url,
            in_stock=price_point.in_stock,
            checked_at=price_point.checked_at,
            created_at=price_point.created_at,
        )
