# pyright: reportMissingImports=false, reportUnknownMemberType=false

import pytest

from app.domain.user.exceptions import InvalidEmailError
from app.domain.user.value_objects import Email


class TestEmail:
    def test_normalizes_email_to_lowercase(self) -> None:
        email = Email("  User@Example.COM ")

        assert email.value == "user@example.com"
        assert str(email) == "user@example.com"

    def test_rejects_invalid_email_format(self) -> None:
        with pytest.raises(InvalidEmailError):
            _ = Email("not-an-email")

    def test_accepts_valid_email(self) -> None:
        email = Email("valid@example.com")

        assert email.value == "valid@example.com"
