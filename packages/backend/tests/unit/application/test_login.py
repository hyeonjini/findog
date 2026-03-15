# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false

from __future__ import annotations

import hashlib
from uuid import UUID

import pytest

from app.application.auth.login import LoginInteractor
from app.domain.auth.entities import RefreshToken
from app.domain.auth.exceptions import InvalidCredentialsError
from app.domain.user.entity import User


def make_user(email: str, hashed_password: str = "stored-hash") -> User:
    return User.create(email=email, hashed_password=hashed_password)


class SpyUserRepository:
    def __init__(self) -> None:
        self.find_by_email_calls: list[str] = []
        self.users_by_email: dict[str, User] = {}

    def save(self, user: User) -> User:
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
    verify_result: bool

    def __init__(self, verify_result: bool) -> None:
        self.verify_result = verify_result
        self.verify_calls: list[tuple[str, str]] = []

    def hash(self, password: str) -> str:
        del password
        raise AssertionError("hash should not be used in login tests")

    def verify(self, password: str, hashed: str) -> bool:
        self.verify_calls.append((password, hashed))
        return self.verify_result


class SpyTokenService:
    refresh_token_call_count: int

    def __init__(self) -> None:
        self.access_token_calls: list[str] = []
        self.refresh_token_call_count = 0

    def create_access_token(self, user_id: str) -> str:
        self.access_token_calls.append(user_id)
        return "access-token"

    def create_refresh_token(self) -> str:
        self.refresh_token_call_count += 1
        return "refresh-token"

    def decode_access_token(self, token: str) -> dict[str, object]:
        del token
        raise AssertionError("decode_access_token should not be used in login tests")


class SpyRefreshTokenRepository:
    def __init__(self) -> None:
        self.saved_tokens: list[RefreshToken] = []

    def save(self, token: RefreshToken) -> RefreshToken:
        self.saved_tokens.append(token)
        return token

    def find_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        del token_hash
        raise AssertionError("find_by_token_hash should not be used in login tests")

    def revoke(self, token_id: UUID) -> None:
        del token_id
        raise AssertionError("revoke should not be used in login tests")

    def revoke_all_for_user(self, user_id: UUID) -> None:
        del user_id
        raise AssertionError("revoke_all_for_user should not be used in login tests")


def capture_invalid_credentials(
    interactor: LoginInteractor,
    email: str,
    password: str,
) -> InvalidCredentialsError:
    with pytest.raises(InvalidCredentialsError) as exc_info:
        _ = interactor.execute(email=email, password=password)
    return exc_info.value


class TestLoginInteractor:
    def test_returns_tokens_with_valid_credentials(self) -> None:
        user = make_user(email="user@example.com")
        user_repository = SpyUserRepository()
        user_repository.users_by_email[user.email] = user
        password_hasher = SpyPasswordHasher(verify_result=True)
        token_service = SpyTokenService()
        refresh_token_repository = SpyRefreshTokenRepository()
        interactor = LoginInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
            token_service=token_service,
            refresh_token_repo=refresh_token_repository,
        )

        tokens = interactor.execute(email="USER@example.com", password="password123")

        assert tokens == {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "token_type": "bearer",
        }
        assert user_repository.find_by_email_calls == ["user@example.com"]
        assert password_hasher.verify_calls == [("password123", user.hashed_password)]
        assert token_service.access_token_calls == [str(user.id)]
        assert token_service.refresh_token_call_count == 1
        assert len(refresh_token_repository.saved_tokens) == 1

        saved_token = refresh_token_repository.saved_tokens[0]
        assert saved_token.user_id == user.id
        assert saved_token.token_hash == hashlib.sha256(b"refresh-token").hexdigest()
        assert saved_token.revoked_at is None
        assert saved_token.expires_at > saved_token.created_at

    def test_rejects_unknown_email(self) -> None:
        user_repository = SpyUserRepository()
        password_hasher = SpyPasswordHasher(verify_result=True)
        token_service = SpyTokenService()
        refresh_token_repository = SpyRefreshTokenRepository()
        interactor = LoginInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
            token_service=token_service,
            refresh_token_repo=refresh_token_repository,
        )

        with pytest.raises(InvalidCredentialsError):
            _ = interactor.execute(email="missing@example.com", password="password123")

        assert user_repository.find_by_email_calls == ["missing@example.com"]
        assert password_hasher.verify_calls == []
        assert token_service.access_token_calls == []
        assert token_service.refresh_token_call_count == 0
        assert refresh_token_repository.saved_tokens == []

    def test_rejects_wrong_password(self) -> None:
        user = make_user(email="user@example.com")
        user_repository = SpyUserRepository()
        user_repository.users_by_email[user.email] = user
        password_hasher = SpyPasswordHasher(verify_result=False)
        token_service = SpyTokenService()
        refresh_token_repository = SpyRefreshTokenRepository()
        interactor = LoginInteractor(
            user_repository=user_repository,
            password_hasher=password_hasher,
            token_service=token_service,
            refresh_token_repo=refresh_token_repository,
        )

        with pytest.raises(InvalidCredentialsError):
            _ = interactor.execute(email="user@example.com", password="wrong-password")

        assert user_repository.find_by_email_calls == ["user@example.com"]
        assert password_hasher.verify_calls == [("wrong-password", user.hashed_password)]
        assert token_service.access_token_calls == []
        assert token_service.refresh_token_call_count == 0
        assert refresh_token_repository.saved_tokens == []

    def test_same_error_for_unknown_email_and_wrong_password(self) -> None:
        unknown_user_interactor = LoginInteractor(
            user_repository=SpyUserRepository(),
            password_hasher=SpyPasswordHasher(verify_result=True),
            token_service=SpyTokenService(),
            refresh_token_repo=SpyRefreshTokenRepository(),
        )

        known_user_repository = SpyUserRepository()
        known_user_repository.users_by_email["user@example.com"] = make_user(
            email="user@example.com"
        )
        wrong_password_interactor = LoginInteractor(
            user_repository=known_user_repository,
            password_hasher=SpyPasswordHasher(verify_result=False),
            token_service=SpyTokenService(),
            refresh_token_repo=SpyRefreshTokenRepository(),
        )

        unknown_email_error = capture_invalid_credentials(
            interactor=unknown_user_interactor,
            email="missing@example.com",
            password="password123",
        )

        wrong_password_error = capture_invalid_credentials(
            interactor=wrong_password_interactor,
            email="user@example.com",
            password="wrong-password",
        )

        assert type(unknown_email_error) is type(wrong_password_error)
        assert unknown_email_error.args == wrong_password_error.args
        assert str(unknown_email_error) == str(wrong_password_error)
