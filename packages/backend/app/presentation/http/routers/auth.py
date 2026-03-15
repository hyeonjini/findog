from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError

from app.application.auth.login import LoginInteractor
from app.application.auth.logout import LogoutInteractor
from app.application.auth.refresh import RefreshTokenInteractor
from app.application.auth.register import RegisterUserInteractor
from app.domain.auth.exceptions import (
    InvalidCredentialsError,
    InvalidTokenError,
    TokenExpiredError,
    TokenRevokedError,
)
from app.domain.user.exceptions import EmailAlreadyExistsError
from app.main import (
    PasswordHasherDep,
    RefreshTokenRepositoryDep,
    TokenServiceDep,
    UserRepositoryDep,
)
from app.presentation.http.dependencies.auth import CurrentUser
from app.presentation.http.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.presentation.http.schemas.user import UserPublicResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserPublicResponse)
def register(
    request: RegisterRequest,
    user_repository: UserRepositoryDep,
    password_hasher: PasswordHasherDep,
) -> UserPublicResponse:
    interactor = RegisterUserInteractor(
        user_repository=user_repository,
        password_hasher=password_hasher,
    )

    try:
        user = interactor.execute(email=request.email, password=request.password)
    except (EmailAlreadyExistsError, IntegrityError) as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        ) from exc

    return UserPublicResponse(id=user.id, email=user.email, created_at=user.created_at)


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    user_repository: UserRepositoryDep,
    password_hasher: PasswordHasherDep,
    token_service: TokenServiceDep,
    refresh_token_repository: RefreshTokenRepositoryDep,
) -> TokenResponse:
    interactor = LoginInteractor(
        user_repository=user_repository,
        password_hasher=password_hasher,
        token_service=token_service,
        refresh_token_repo=refresh_token_repository,
    )

    try:
        tokens = interactor.execute(email=request.email, password=request.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        ) from exc

    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: RefreshRequest,
    token_service: TokenServiceDep,
    refresh_token_repository: RefreshTokenRepositoryDep,
    user_repository: UserRepositoryDep,
) -> TokenResponse:
    interactor = RefreshTokenInteractor(
        token_service=token_service,
        refresh_token_repo=refresh_token_repository,
        user_repository=user_repository,
    )

    try:
        tokens = interactor.execute(refresh_token=request.refresh_token)
    except TokenExpiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from exc
    except TokenRevokedError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        ) from exc
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc

    return TokenResponse(**tokens)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: LogoutRequest,
    _: CurrentUser,
    refresh_token_repository: RefreshTokenRepositoryDep,
) -> Response:
    interactor = LogoutInteractor(refresh_token_repo=refresh_token_repository)
    interactor.execute(refresh_token=request.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
