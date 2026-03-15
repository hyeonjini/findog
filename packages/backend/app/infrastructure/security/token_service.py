from __future__ import annotations

import datetime
import hashlib
import secrets
from typing import cast, override

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError as PyJwtInvalidTokenError

from app.domain.auth.exceptions import InvalidTokenError, TokenExpiredError
from app.domain.auth.ports import TokenService


class JwtTokenService(TokenService):
    _secret_key: str
    _algorithm: str
    _access_token_expire_minutes: int

    def __init__(
        self,
        secret_key: str,
        algorithm: str,
        access_token_expire_minutes: int,
    ) -> None:
        self._secret_key = secret_key
        self._algorithm = algorithm
        self._access_token_expire_minutes = access_token_expire_minutes

    @override
    def create_access_token(self, user_id: str) -> str:
        expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
            minutes=self._access_token_expire_minutes
        )
        payload = {
            "sub": user_id,
            "type": "access",
            "exp": expires_at,
        }
        return jwt.encode(payload, self._secret_key, algorithm=self._algorithm)

    @override
    def create_refresh_token(self) -> str:
        return secrets.token_urlsafe(32)

    @override
    def decode_access_token(self, token: str) -> dict[str, object]:
        try:
            payload = cast(
                dict[str, object],
                jwt.decode(
                    token,
                    self._secret_key,
                    algorithms=[self._algorithm],
                ),
            )
        except ExpiredSignatureError as exc:
            raise TokenExpiredError from exc
        except PyJwtInvalidTokenError as exc:
            raise InvalidTokenError from exc

        sub = payload.get("sub")
        token_type = payload.get("type")
        exp = payload.get("exp")

        if not isinstance(sub, str) or token_type != "access":
            raise InvalidTokenError

        payload["exp"] = self._normalize_exp(exp)
        return payload

    @staticmethod
    def hash_refresh_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def _normalize_exp(value: object) -> datetime.datetime:
        if isinstance(value, datetime.datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=datetime.UTC)
            return value.astimezone(datetime.UTC)

        if isinstance(value, (int, float)):
            return datetime.datetime.fromtimestamp(value, tz=datetime.UTC)

        raise InvalidTokenError
