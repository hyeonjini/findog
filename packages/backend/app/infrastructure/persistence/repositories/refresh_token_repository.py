# pyright: reportMissingImports=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUnknownParameterType=false
# pyright: reportUnusedCallResult=false

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, cast, override
from uuid import UUID

from sqlalchemy import update
from sqlmodel import Session, select

from app.domain.auth.entities import RefreshToken
from app.domain.auth.ports import RefreshTokenRepository
from ..models.refresh_token import RefreshTokenTable


class SqlaRefreshTokenRepository(RefreshTokenRepository):
    _session: Session

    def __init__(self, session: Session) -> None:
        self._session = session

    @override
    def save(self, token: RefreshToken) -> RefreshToken:
        model = self._to_model(token)
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._to_domain(model)

    @override
    def find_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        statement = select(RefreshTokenTable).where(
            cast(Any, cast(Any, RefreshTokenTable.token_hash) == token_hash)  # pyright: ignore[reportAny, reportExplicitAny, reportUnnecessaryCast]
        )
        model = self._session.exec(statement).first()
        if model is None:
            return None
        return self._to_domain(model)

    @override
    def revoke(self, token_id: UUID) -> None:
        model = self._session.get(RefreshTokenTable, token_id)
        if model is None:
            return

        model.revoked_at = datetime.now(UTC)
        self._session.add(model)
        self._session.commit()

    @override
    def revoke_all_for_user(self, user_id: UUID) -> None:
        revoked_at = datetime.now(UTC)
        statement = (
            update(RefreshTokenTable)
            .where(cast(Any, cast(Any, RefreshTokenTable.user_id) == user_id))  # pyright: ignore[reportAny, reportExplicitAny, reportUnnecessaryCast]
            .where(cast(Any, cast(Any, RefreshTokenTable.revoked_at).is_(None)))  # pyright: ignore[reportAny, reportExplicitAny, reportUnnecessaryCast]
            .values(revoked_at=revoked_at)
        )
        self._session.exec(statement)
        self._session.commit()

    @staticmethod
    def _to_domain(model: RefreshTokenTable) -> RefreshToken:
        return RefreshToken(
            id=model.id,
            user_id=model.user_id,
            token_hash=model.token_hash,
            expires_at=model.expires_at,
            revoked_at=model.revoked_at,
            created_at=model.created_at,
        )

    @staticmethod
    def _to_model(entity: RefreshToken) -> RefreshTokenTable:
        return RefreshTokenTable(
            id=entity.id,
            user_id=entity.user_id,
            token_hash=entity.token_hash,
            expires_at=entity.expires_at,
            revoked_at=entity.revoked_at,
            created_at=entity.created_at,
        )
