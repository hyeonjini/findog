from fastapi import APIRouter

from app.presentation.http.dependencies.auth import CurrentUser
from app.presentation.http.schemas.user import UserPublicResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublicResponse)
def get_me(current_user: CurrentUser) -> UserPublicResponse:
    return UserPublicResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
    )
