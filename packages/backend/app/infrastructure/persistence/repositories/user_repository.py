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

from app.domain.user.entity import User
from app.domain.user.exceptions import EmailAlreadyExistsError
from app.domain.user.repository import UserRepository
from app.infrastructure.persistence.models.user import UserTable


class SqlaUserRepository(UserRepository):
    _session: Session

    def __init__(self, session: Session) -> None:
        self._session = session

    @override
    def save(self, user: User) -> User:
        model = self._to_model(user)
        try:
            self._session.add(model)
            self._session.commit()
        except IntegrityError as exc:
            self._session.rollback()
            raise EmailAlreadyExistsError from exc

        self._session.refresh(model)
        return self._to_domain(model)

    @override
    def find_by_email(self, email: str) -> User | None:
        statement = select(UserTable).where(UserTable.email == email)
        model = self._session.exec(statement).first()
        if model is None:
            return None

        return self._to_domain(model)

    @override
    def find_by_id(self, user_id: UUID) -> User | None:
        statement = select(UserTable).where(UserTable.id == user_id)
        model = self._session.exec(statement).first()
        if model is None:
            return None

        return self._to_domain(model)

    @staticmethod
    def _to_domain(model: UserTable) -> User:
        return User(
            id=model.id,
            email=model.email,
            hashed_password=model.hashed_password,
            is_active=model.is_active,
            created_at=model.created_at,
        )

    @staticmethod
    def _to_model(user: User) -> UserTable:
        return UserTable(
            id=user.id,
            email=user.email,
            hashed_password=user.hashed_password,
            is_active=user.is_active,
            created_at=user.created_at,
        )
