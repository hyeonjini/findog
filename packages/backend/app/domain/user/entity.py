from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, UTC
from uuid import UUID, uuid4

from app.domain.user.value_objects import Email


@dataclass(frozen=True)
class User:
    id: UUID
    email: str
    hashed_password: str
    is_active: bool
    created_at: datetime

    @classmethod
    def create(cls, email: str, hashed_password: str) -> "User":
        normalized_email = Email(email).value
        return cls(
            id=uuid4(),
            email=normalized_email,
            hashed_password=hashed_password,
            is_active=True,
            created_at=datetime.now(UTC),
        )
