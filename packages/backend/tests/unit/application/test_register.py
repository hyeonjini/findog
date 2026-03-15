# pyright: reportMissingImports=false, reportUnknownMemberType=false

from __future__ import annotations

from uuid import UUID

import pytest

from app.application.auth.register import RegisterUserInteractor
from app.domain.user.entity import User
from app.domain.user.exceptions import EmailAlreadyExistsError


def make_user(email: str, hashed_password: str = "stored-hash") -> User:
    return User.create(email=email, hashed_password=hashed_password)


class SpyUserRepository:
    def __init__(self) -> None:
        self.find_by_email_calls: list[str] = []
        self.saved_users: list[User] = []
        self.users_by_email: dict[str, User] = {}

    def save(self, user: User) -> User:
        self.saved_users.append(user)
        self.users_by_email[user.email] = user
        return user

    def find_by_email(self, email: str) -> User | None:
        self.find_by_email_calls.append(email)
        return self.users_by_email.get(email)

    def find_by_id(self, user_id: UUID) -> User | None:
        for user in self.users_by_email.values():
            if user.id == user_id:
                return user
        return None


class SpyPasswordHasher:
    hashed_value: str

    def __init__(self, hashed_value: str = "hashed-password") -> None:
        self.hashed_value = hashed_value
        self.hash_calls: list[str] = []

    def hash(self, password: str) -> str:
        self.hash_calls.append(password)
        return self.hashed_value

    def verify(self, password: str, hashed: str) -> bool:
        del password, hashed
        raise AssertionError("verify should not be used in register tests")


class TestRegisterUserInteractor:
    def test_registers_user_with_valid_data(self) -> None:
        user_repository = SpyUserRepository()
        password_hasher = SpyPasswordHasher(hashed_value="new-hash")
        interactor = RegisterUserInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
        )

        user = interactor.execute(email="USER@example.com", password="password123")

        assert user.email == "user@example.com"
        assert user.hashed_password == "new-hash"
        assert user_repository.find_by_email_calls == ["user@example.com"]
        assert password_hasher.hash_calls == ["password123"]
        assert user_repository.saved_users == [user]

    def test_rejects_duplicate_email(self) -> None:
        existing_user = make_user(email="user@example.com")
        user_repository = SpyUserRepository()
        user_repository.users_by_email[existing_user.email] = existing_user
        password_hasher = SpyPasswordHasher()
        interactor = RegisterUserInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
        )

        with pytest.raises(EmailAlreadyExistsError):
            _ = interactor.execute(email="USER@example.com", password="password123")

        assert user_repository.find_by_email_calls == ["user@example.com"]
        assert password_hasher.hash_calls == []
        assert user_repository.saved_users == []

    def test_rejects_short_password(self) -> None:
        user_repository = SpyUserRepository()
        password_hasher = SpyPasswordHasher()
        interactor = RegisterUserInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
        )

        with pytest.raises(
            ValueError,
            match="at least 8 characters and at most 72 bytes",
        ):
            _ = interactor.execute(email="user@example.com", password="short")

        assert user_repository.find_by_email_calls == []
        assert password_hasher.hash_calls == []

    def test_rejects_long_password(self) -> None:
        user_repository = SpyUserRepository()
        password_hasher = SpyPasswordHasher()
        interactor = RegisterUserInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
        )

        with pytest.raises(
            ValueError,
            match="at least 8 characters and at most 72 bytes",
        ):
            _ = interactor.execute(email="user@example.com", password="p" * 73)

        assert user_repository.find_by_email_calls == []
        assert password_hasher.hash_calls == []

    def test_normalizes_email_to_lowercase(self) -> None:
        user_repository = SpyUserRepository()
        password_hasher = SpyPasswordHasher(hashed_value="new-hash")
        interactor = RegisterUserInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
        )

        user = interactor.execute(
            email="  MixedCase@Example.COM ",
            password="password123",
        )

        assert user.email == "mixedcase@example.com"
        assert user_repository.find_by_email_calls == ["mixedcase@example.com"]
        assert user_repository.saved_users[0].email == "mixedcase@example.com"

    def test_rejects_password_over_72_utf8_bytes(self) -> None:
        user_repository = SpyUserRepository()
        password_hasher = SpyPasswordHasher()
        interactor = RegisterUserInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
        )

        with pytest.raises(
            ValueError,
            match="at least 8 characters and at most 72 bytes",
        ):
            _ = interactor.execute(email="user@example.com", password="가" * 25)

        assert user_repository.find_by_email_calls == []
        assert password_hasher.hash_calls == []
