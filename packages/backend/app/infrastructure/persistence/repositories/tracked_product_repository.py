# pyright: reportMissingImports=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUnknownParameterType=false

from __future__ import annotations

from typing import override
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.domain.tracking.entity import TrackedProduct
from app.domain.tracking.exceptions import DuplicateTrackedProductError, TrackedProductNotFoundError
from app.domain.tracking.repository import TrackingRepository
from app.infrastructure.persistence.models.tracked_product import TrackedProductTable


class SqlaTrackedProductRepository(TrackingRepository):
    _session: Session

    def __init__(self, session: Session) -> None:
        self._session = session

    @override
    def save(self, tracked_product: TrackedProduct) -> TrackedProduct:
        model = self._to_model(tracked_product)
        try:
            self._session.add(model)
            self._session.commit()
        except IntegrityError as exc:
            self._session.rollback()
            raise DuplicateTrackedProductError from exc

        self._session.refresh(model)
        return self._to_domain(model)

    @override
    def update(self, tracked_product: TrackedProduct) -> TrackedProduct:
        model = self._session.get(TrackedProductTable, tracked_product.id)
        if model is None:
            raise TrackedProductNotFoundError(f"Tracked product not found: {tracked_product.id}")

        updated_model = self._to_model(tracked_product)
        model.user_id = updated_model.user_id
        model.source_url = updated_model.source_url
        model.source_title = updated_model.source_title
        model.source_platform = updated_model.source_platform
        model.source_image_url = updated_model.source_image_url
        model.source_price_amount = updated_model.source_price_amount
        model.source_currency = updated_model.source_currency
        model.normalized_query = updated_model.normalized_query
        model.product_fingerprint = updated_model.product_fingerprint
        model.monitoring_status = updated_model.monitoring_status
        model.restock_alert_enabled = updated_model.restock_alert_enabled
        model.lowest_price_tracking_enabled = updated_model.lowest_price_tracking_enabled
        model.last_checked_at = updated_model.last_checked_at
        model.created_at = updated_model.created_at
        model.updated_at = updated_model.updated_at

        try:
            self._session.add(model)
            self._session.commit()
        except IntegrityError as exc:
            self._session.rollback()
            raise DuplicateTrackedProductError from exc

        self._session.refresh(model)
        return self._to_domain(model)

    @override
    def find_by_id(self, tracked_product_id: UUID) -> TrackedProduct | None:
        statement = select(TrackedProductTable).where(TrackedProductTable.id == tracked_product_id)
        model = self._session.exec(statement).first()
        if model is None:
            return None

        return self._to_domain(model)

    @override
    def find_by_user_id(self, user_id: UUID) -> list[TrackedProduct]:
        statement = select(TrackedProductTable).where(TrackedProductTable.user_id == user_id)
        models = self._session.exec(statement).all()
        return [self._to_domain(model) for model in models]

    @override
    def find_active_with_price_tracking(self) -> list[TrackedProduct]:
        statement = select(TrackedProductTable).where(
            TrackedProductTable.monitoring_status == "active",
            TrackedProductTable.lowest_price_tracking_enabled == True,  # noqa: E712
        )
        models = self._session.exec(statement).all()
        return [self._to_domain(model) for model in models]

    @override
    def find_by_user_and_url(self, user_id: UUID, source_url: str) -> TrackedProduct | None:
        statement = select(TrackedProductTable).where(
            TrackedProductTable.user_id == user_id,
            TrackedProductTable.source_url == source_url,
        )
        model = self._session.exec(statement).first()
        if model is None:
            return None

        return self._to_domain(model)

    @staticmethod
    def _to_domain(model: TrackedProductTable) -> TrackedProduct:
        return TrackedProduct(
            id=model.id,
            user_id=model.user_id,
            source_url=model.source_url,
            source_title=model.source_title,
            source_platform=model.source_platform,
            source_image_url=model.source_image_url,
            source_price_amount=model.source_price_amount,
            source_currency=model.source_currency,
            normalized_query=model.normalized_query,
            product_fingerprint=model.product_fingerprint,
            monitoring_status=model.monitoring_status,
            restock_alert_enabled=model.restock_alert_enabled,
            lowest_price_tracking_enabled=model.lowest_price_tracking_enabled,
            last_checked_at=model.last_checked_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _to_model(tracked_product: TrackedProduct) -> TrackedProductTable:
        return TrackedProductTable(
            id=tracked_product.id,
            user_id=tracked_product.user_id,
            source_url=tracked_product.source_url,
            source_title=tracked_product.source_title,
            source_platform=tracked_product.source_platform,
            source_image_url=tracked_product.source_image_url,
            source_price_amount=tracked_product.source_price_amount,
            source_currency=tracked_product.source_currency,
            normalized_query=tracked_product.normalized_query,
            product_fingerprint=tracked_product.product_fingerprint,
            monitoring_status=tracked_product.monitoring_status,
            restock_alert_enabled=tracked_product.restock_alert_enabled,
            lowest_price_tracking_enabled=tracked_product.lowest_price_tracking_enabled,
            last_checked_at=tracked_product.last_checked_at,
            created_at=tracked_product.created_at,
            updated_at=tracked_product.updated_at,
        )
