# pyright: reportMissingImports=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.application.tracking.commands import (
    ArchiveTrackedProductInteractor,
    TrackProductInteractor,
    UpdateTrackedProductInteractor,
)
from app.application.tracking.queries import (
    GetTrackedProductDetailInteractor,
    ListTrackedProductsInteractor,
)
from app.domain.tracking.exceptions import DuplicateTrackedProductError, TrackedProductNotFoundError
from app.main import TrackingRepositoryDep
from app.presentation.http.dependencies.auth import CurrentUser
from app.presentation.http.schemas.tracked_product import (
    TrackedProductCreateRequest,
    TrackedProductListResponse,
    TrackedProductResponse,
    TrackedProductUpdateRequest,
)

router = APIRouter(prefix="/tracked-products", tags=["tracked-products"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=TrackedProductResponse,
)
def create_tracked_product(
    request: TrackedProductCreateRequest,
    current_user: CurrentUser,
    tracking_repository: TrackingRepositoryDep,
) -> TrackedProductResponse:
    interactor = TrackProductInteractor(repo=tracking_repository)

    try:
        tracked_product = interactor.execute(
            user_id=current_user.id,
            source_url=request.source_url,
            source_title=request.source_title,
            source_platform=request.source_platform,
            source_image_url=request.source_image_url,
            source_price_amount=request.source_price_amount,
            source_currency=request.source_currency,
        )
    except DuplicateTrackedProductError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tracked product already exists",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return TrackedProductResponse.from_entity(tracked_product)


@router.get("", response_model=TrackedProductListResponse)
def list_tracked_products(
    current_user: CurrentUser,
    tracking_repository: TrackingRepositoryDep,
) -> TrackedProductListResponse:
    interactor = ListTrackedProductsInteractor(tracking_repository=tracking_repository)
    tracked_products = interactor.execute(user_id=current_user.id)
    return TrackedProductListResponse.from_entities(tracked_products)


@router.get("/{tracked_product_id}", response_model=TrackedProductResponse)
def get_tracked_product(
    tracked_product_id: UUID,
    current_user: CurrentUser,
    tracking_repository: TrackingRepositoryDep,
) -> TrackedProductResponse:
    interactor = GetTrackedProductDetailInteractor(tracking_repository=tracking_repository)

    try:
        tracked_product = interactor.execute(
            user_id=current_user.id,
            product_id=tracked_product_id,
        )
    except TrackedProductNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracked product not found",
        ) from exc

    return TrackedProductResponse.from_entity(tracked_product)


@router.patch("/{tracked_product_id}", response_model=TrackedProductResponse)
def update_tracked_product(
    tracked_product_id: UUID,
    request: TrackedProductUpdateRequest,
    current_user: CurrentUser,
    tracking_repository: TrackingRepositoryDep,
) -> TrackedProductResponse:
    interactor = UpdateTrackedProductInteractor(repo=tracking_repository)

    try:
        tracked_product = interactor.execute(
            user_id=current_user.id,
            product_id=tracked_product_id,
            source_title=request.source_title,
            restock_alert_enabled=request.restock_alert_enabled,
            lowest_price_tracking_enabled=request.lowest_price_tracking_enabled,
        )
    except TrackedProductNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracked product not found",
        ) from exc

    return TrackedProductResponse.from_entity(tracked_product)


@router.post("/{tracked_product_id}/archive", response_model=TrackedProductResponse)
def archive_tracked_product(
    tracked_product_id: UUID,
    current_user: CurrentUser,
    tracking_repository: TrackingRepositoryDep,
) -> TrackedProductResponse:
    interactor = ArchiveTrackedProductInteractor(repo=tracking_repository)

    try:
        tracked_product = interactor.execute(
            user_id=current_user.id,
            product_id=tracked_product_id,
        )
    except TrackedProductNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracked product not found",
        ) from exc

    return TrackedProductResponse.from_entity(tracked_product)


@router.post("/{tracked_product_id}/restore", response_model=TrackedProductResponse)
def restore_tracked_product(
    tracked_product_id: UUID,
    current_user: CurrentUser,
    tracking_repository: TrackingRepositoryDep,
) -> TrackedProductResponse:
    interactor = ArchiveTrackedProductInteractor(repo=tracking_repository)

    try:
        tracked_product = interactor.execute(
            user_id=current_user.id,
            product_id=tracked_product_id,
            restore=True,
        )
    except TrackedProductNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracked product not found",
        ) from exc

    return TrackedProductResponse.from_entity(tracked_product)


@router.post(
    "/{tracked_product_id}/refresh",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=TrackedProductResponse,
)
def refresh_tracked_product(
    tracked_product_id: UUID,
    current_user: CurrentUser,
    tracking_repository: TrackingRepositoryDep,
) -> TrackedProductResponse:
    interactor = GetTrackedProductDetailInteractor(tracking_repository=tracking_repository)

    try:
        tracked_product = interactor.execute(
            user_id=current_user.id,
            product_id=tracked_product_id,
        )
    except TrackedProductNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracked product not found",
        ) from exc

    now = datetime.now(UTC)
    refreshed_product = replace(tracked_product, last_checked_at=now, updated_at=now)
    updated_product = tracking_repository.update(refreshed_product)
    return TrackedProductResponse.from_entity(updated_product)
