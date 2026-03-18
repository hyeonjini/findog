import re
from dataclasses import dataclass
from typing import override

from app.domain.user.exceptions import InvalidEmailError


@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()
        if not self._is_valid(normalized):
            raise InvalidEmailError(f"Invalid email: {self.value}")
        object.__setattr__(self, "value", normalized)

    @staticmethod
    def _is_valid(email: str) -> bool:
        pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        return bool(re.match(pattern, email))

    @override
    def __str__(self) -> str:
        return self.value
