# pyright: reportAssignmentType=false
# pyright: reportIncompatibleVariableOverride=false

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlmodel import Field, SQLModel


class RefreshTokenTable(SQLModel, table=True):
    __tablename__ = "refresh_tokens"  # pyright: ignore[reportUnannotatedClassAttribute]

    id: UUID = Field(primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    token_hash: str = Field(nullable=False, index=True)
    expires_at: datetime = Field(nullable=False)
    revoked_at: datetime | None = Field(default=None, nullable=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
