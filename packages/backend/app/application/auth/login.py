from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.domain.auth.entities import RefreshToken
from app.domain.auth.exceptions import InvalidCredentialsError
from app.domain.auth.ports import PasswordHasher, RefreshTokenRepository, TokenService
from app.domain.user.repository import UserRepository
from app.domain.user.value_objects import Email


class LoginInteractor:
    _user_repository: UserRepository
    _password_hasher: PasswordHasher
    _token_service: TokenService
    _refresh_token_repo: RefreshTokenRepository
    _refresh_token_expire_days: int

    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
        token_service: TokenService,
        refresh_token_repo: RefreshTokenRepository,
        refresh_token_expire_days: int = 7,
    ) -> None:
        self._user_repository = user_repository
        self._password_hasher = password_hasher
        self._token_service = token_service
        self._refresh_token_repo = refresh_token_repo
        self._refresh_token_expire_days = refresh_token_expire_days

    def execute(self, email: str, password: str) -> dict[str, str]:
        normalized_email = Email(email).value
        user = self._user_repository.find_by_email(normalized_email)
        if user is None:
            raise InvalidCredentialsError

        if len(password.encode("utf-8")) > 72:
            raise InvalidCredentialsError

        if not self._password_hasher.verify(password, user.hashed_password):
            raise InvalidCredentialsError

        if not user.is_active:
            raise InvalidCredentialsError

        access_token = self._token_service.create_access_token(str(user.id))
        refresh_token = self._token_service.create_refresh_token()

        refresh_token_entity = RefreshToken(
            id=uuid4(),
            user_id=user.id,
            token_hash=self._hash_token(refresh_token),
            expires_at=datetime.now(UTC) + timedelta(days=self._refresh_token_expire_days),
            revoked_at=None,
            created_at=datetime.now(UTC),
        )
        _ = self._refresh_token_repo.save(refresh_token_entity)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
