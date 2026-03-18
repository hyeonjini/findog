from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.domain.auth.entities import RefreshToken
from app.domain.auth.exceptions import InvalidTokenError, TokenExpiredError, TokenRevokedError
from app.domain.auth.ports import RefreshTokenRepository, TokenService
from app.domain.user.repository import UserRepository


class RefreshTokenInteractor:
    _token_service: TokenService
    _refresh_token_repo: RefreshTokenRepository
    _user_repository: UserRepository
    _refresh_token_expire_days: int

    def __init__(
        self,
        token_service: TokenService,
        refresh_token_repo: RefreshTokenRepository,
        user_repository: UserRepository,
        refresh_token_expire_days: int = 7,
    ) -> None:
        self._token_service = token_service
        self._refresh_token_repo = refresh_token_repo
        self._user_repository = user_repository
        self._refresh_token_expire_days = refresh_token_expire_days

    def execute(self, refresh_token: str) -> dict[str, str]:
        refresh_token_hash = self._hash_token(refresh_token)
        token_entity = self._refresh_token_repo.find_by_token_hash(refresh_token_hash)
        if token_entity is None:
            raise InvalidTokenError

        if token_entity.revoked_at is not None:
            raise TokenRevokedError

        expires_at = self._as_utc(token_entity.expires_at)
        if expires_at <= datetime.now(UTC):
            raise TokenExpiredError

        self._refresh_token_repo.revoke(token_entity.id)

        user = self._user_repository.find_by_id(token_entity.user_id)
        if user is None or not user.is_active:
            raise InvalidTokenError

        new_access_token = self._token_service.create_access_token(str(user.id))
        new_refresh_token = self._token_service.create_refresh_token()

        new_refresh_token_entity = RefreshToken(
            id=uuid4(),
            user_id=user.id,
            token_hash=self._hash_token(new_refresh_token),
            expires_at=datetime.now(UTC) + timedelta(days=self._refresh_token_expire_days),
            revoked_at=None,
            created_at=datetime.now(UTC),
        )
        _ = self._refresh_token_repo.save(new_refresh_token_entity)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
