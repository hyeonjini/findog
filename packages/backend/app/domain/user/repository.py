from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.user.entity import User


class UserRepository(Protocol):
    def save(self, user: User) -> User:
        ...

    def find_by_email(self, email: str) -> User | None:
        ...

    def find_by_id(self, user_id: UUID) -> User | None:
        ...
