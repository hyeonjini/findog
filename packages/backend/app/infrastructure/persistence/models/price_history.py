# pyright: reportAssignmentType=false
# pyright: reportIncompatibleVariableOverride=false
# pyright: reportMissingImports=false
# pyright: reportUnknownVariableType=false
# pyright: reportUntypedBaseClass=false
# pyright: reportGeneralTypeIssues=false
# pyright: reportCallIssue=false

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String, Text
from sqlmodel import Field, SQLModel

from app.infrastructure.persistence.models.user import utc_now


class PriceHistoryBase(SQLModel):
    platform: str = Field(sa_column=Column(String(100), nullable=False))
    price_amount: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    currency: str = Field(default="KRW", sa_column=Column(String(10), nullable=False, default="KRW"))
    product_url: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    in_stock: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, default=True))
    checked_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class PriceHistoryTable(PriceHistoryBase, table=True):
    __tablename__: str = "price_history"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tracked_product_id: UUID = Field(
        sa_column=Column(
            "tracked_product_id",
            ForeignKey("tracked_products.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
