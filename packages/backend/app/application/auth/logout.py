from __future__ import annotations

import hashlib

from app.domain.auth.ports import RefreshTokenRepository


class LogoutInteractor:
    _refresh_token_repo: RefreshTokenRepository

    def __init__(self, refresh_token_repo: RefreshTokenRepository) -> None:
        self._refresh_token_repo = refresh_token_repo

    def execute(self, refresh_token: str) -> None:
        refresh_token_hash = self._hash_token(refresh_token)
        token_entity = self._refresh_token_repo.find_by_token_hash(refresh_token_hash)
        if token_entity is None or token_entity.revoked_at is not None:
            return

        self._refresh_token_repo.revoke(token_entity.id)

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
