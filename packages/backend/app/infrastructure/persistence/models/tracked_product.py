# pyright: reportAssignmentType=false
# pyright: reportIncompatibleVariableOverride=false

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Numeric, String, Text, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.infrastructure.persistence.models.user import utc_now


class TrackedProductBase(SQLModel):
    source_url: str = Field(sa_column=Column(Text, nullable=False))
    source_platform: str | None = Field(
        default=None,
        sa_column=Column(String(100), nullable=True),
    )
    source_title: str = Field(sa_column=Column(String(500), nullable=False))
    source_image_url: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )
    source_price_amount: Decimal | None = Field(
        default=None,
        sa_column=Column(Numeric(12, 2), nullable=True),
    )
    source_currency: str | None = Field(
        default=None,
        sa_column=Column(String(10), nullable=True),
    )
    normalized_query: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )
    product_fingerprint: str | None = Field(
        default=None,
        sa_column=Column(String(255), nullable=True),
    )
    monitoring_status: str = Field(
        default="active",
        sa_column=Column(String(20), nullable=False, default="active", index=True),
    )
    restock_alert_enabled: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, default=False),
    )
    lowest_price_tracking_enabled: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, default=False),
    )
    last_checked_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )


class TrackedProductTable(TrackedProductBase, table=True):
    __tablename__: str = "tracked_products"
    __table_args__: tuple[UniqueConstraint, CheckConstraint] = (
        UniqueConstraint("user_id", "source_url", name="uq_tracked_products_user_id_source_url"),
        CheckConstraint(
            "monitoring_status IN ('active', 'paused', 'archived')",
            name="ck_tracked_products_monitoring_status",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
