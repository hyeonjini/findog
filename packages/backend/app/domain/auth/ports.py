from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.auth.entities import RefreshToken


class PasswordHasher(Protocol):
    def hash(self, password: str) -> str:
        ...

    def verify(self, password: str, hashed: str) -> bool:
        ...


class TokenService(Protocol):
    def create_access_token(self, user_id: str) -> str:
        ...

    def create_refresh_token(self) -> str:
        ...

    def decode_access_token(self, token: str) -> dict[str, object]:
        ...


class RefreshTokenRepository(Protocol):
    def save(self, token: RefreshToken) -> RefreshToken:
        ...

    def find_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        ...

    def revoke(self, token_id: UUID) -> None:
        ...

    def revoke_all_for_user(self, user_id: UUID) -> None:
        ...
