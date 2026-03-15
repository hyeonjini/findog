# pyright: reportMissingImports=false, reportUnknownMemberType=false

from dataclasses import FrozenInstanceError, is_dataclass
from uuid import UUID

import pytest

from app.domain.user.entity import User


class TestUser:
    def test_creates_user_with_valid_data(self) -> None:
        user = User.create(email="  USER@Example.COM ", hashed_password="hashed-password")

        assert user.email == "user@example.com"
        assert user.hashed_password == "hashed-password"
        assert user.is_active is True
        assert user.created_at.tzinfo is not None

    def test_user_is_frozen_dataclass(self) -> None:
        user = User.create(email="user@example.com", hashed_password="hashed-password")

        assert is_dataclass(User)
        with pytest.raises(FrozenInstanceError):
            setattr(user, "email", "other@example.com")

    def test_user_create_generates_uuid(self) -> None:
        user = User.create(email="user@example.com", hashed_password="hashed-password")

        assert isinstance(user.id, UUID)
