from __future__ import annotations

from app.domain.auth.ports import PasswordHasher
from app.domain.user.entity import User
from app.domain.user.exceptions import EmailAlreadyExistsError
from app.domain.user.repository import UserRepository
from app.domain.user.value_objects import Email


class RegisterUserInteractor:
    _user_repository: UserRepository
    _password_hasher: PasswordHasher

    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
    ) -> None:
        self._user_repository = user_repository
        self._password_hasher = password_hasher

    def execute(self, email: str, password: str) -> User:
        password_bytes = len(password.encode("utf-8"))
        if len(password) < 8 or password_bytes > 72:
            raise ValueError("Password must be at least 8 characters and at most 72 bytes")

        normalized_email = Email(email).value
        existing_user = self._user_repository.find_by_email(normalized_email)
        if existing_user is not None:
            raise EmailAlreadyExistsError

        hashed_password = self._password_hasher.hash(password)
        user = User.create(email=normalized_email, hashed_password=hashed_password)
        return self._user_repository.save(user)
