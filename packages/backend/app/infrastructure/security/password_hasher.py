from __future__ import annotations

import bcrypt
from typing import override

from app.domain.auth.ports import PasswordHasher


class BcryptPasswordHasher(PasswordHasher):
    @override
    def hash(self, password: str) -> str:
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        return hashed_password.decode("utf-8")

    @override
    def verify(self, password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        except ValueError:
            return False
