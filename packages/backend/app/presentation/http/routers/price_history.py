# pyright: reportMissingImports=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportCallInDefaultInitializer=false

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.application.pricing.queries.get_price_history import GetPriceHistoryQuery
from app.domain.tracking.exceptions import TrackedProductNotFoundError
from app.main import PriceHistoryRepositoryDep, TrackingRepositoryDep
from app.presentation.http.dependencies.auth import CurrentUser
from app.presentation.http.schemas.price_history import PriceHistoryListResponse

router = APIRouter(prefix="/tracked-products", tags=["price-history"])


@router.get(
    "/{tracked_product_id}/price-history",
    response_model=PriceHistoryListResponse,
)
def get_price_history(
    tracked_product_id: UUID,
    current_user: CurrentUser,
    price_history_repo: PriceHistoryRepositoryDep,
    tracking_repo: TrackingRepositoryDep,
    limit: int = Query(default=50, ge=1, le=200),
) -> PriceHistoryListResponse:
    query = GetPriceHistoryQuery(
        price_history_repo=price_history_repo,
        tracking_repo=tracking_repo,
    )

    try:
        price_points = query.execute(
            product_id=tracked_product_id,
            user_id=current_user.id,
            limit=limit,
        )
    except TrackedProductNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracked product not found",
        ) from exc

    return PriceHistoryListResponse.from_entities(price_points)
