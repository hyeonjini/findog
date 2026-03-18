from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import cast
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient
from httpx import Response

from app.shared.config import settings

JsonDict = dict[str, object]


def make_email() -> str:
    return f"{uuid4()}@example.com"


def json_dict(response: Response) -> JsonDict:
    return cast(JsonDict, response.json())


def read_string(payload: JsonDict, key: str) -> str:
    value = payload[key]
    assert isinstance(value, str)
    return value


def register_user(
    client: TestClient,
    email: str,
    password: str = "password123",
):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )


def login_user(
    client: TestClient,
    email: str,
    password: str = "password123",
):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def make_expired_access_token(user_id: str) -> str:
    return jwt.encode(
        {
            "sub": user_id,
            "type": "access",
            "exp": datetime.now(UTC) - timedelta(minutes=1),
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


class TestUsersMeEndpoint:
    def test_users_me_requires_authentication(self, client: TestClient) -> None:
        response = client.get("/api/users/me")

        assert response.status_code == 401
        assert response.json() == {"detail": "Not authenticated"}

    def test_users_me_returns_current_user(self, client: TestClient) -> None:
        email = make_email()
        register_response = register_user(client, email=email.upper())
        user_payload = json_dict(register_response)
        login_response = login_user(client, email=email)
        login_payload = json_dict(login_response)
        access_token = read_string(login_payload, "access_token")

        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert register_response.status_code == 201
        assert login_response.status_code == 200
        assert response.status_code == 200
        assert response.json() == {
            "id": read_string(user_payload, "id"),
            "email": email,
            "created_at": read_string(user_payload, "created_at"),
        }

    def test_users_me_rejects_expired_access_token(self, client: TestClient) -> None:
        email = make_email()
        register_response = register_user(client, email=email)
        user_payload = json_dict(register_response)
        expired_token = make_expired_access_token(read_string(user_payload, "id"))

        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )

        assert register_response.status_code == 201
        assert response.status_code == 401
        assert response.json() == {"detail": "Token has expired"}

    def test_full_auth_lifecycle_register_login_me_refresh_me_logout_and_reject_reuse(
        self,
        client: TestClient,
    ) -> None:
        email = make_email()

        register_response = register_user(client, email=email)
        user_payload = json_dict(register_response)
        user_id = read_string(user_payload, "id")
        created_at = read_string(user_payload, "created_at")

        login_response = login_user(client, email=email)
        login_payload = json_dict(login_response)
        login_access_token = read_string(login_payload, "access_token")
        login_refresh_token = read_string(login_payload, "refresh_token")
        first_me_response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {login_access_token}"},
        )

        refresh_response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": login_refresh_token},
        )
        refresh_payload = json_dict(refresh_response)
        refresh_access_token = read_string(refresh_payload, "access_token")
        refresh_token = read_string(refresh_payload, "refresh_token")
        second_me_response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {refresh_access_token}"},
        )

        logout_response = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {refresh_access_token}"},
            json={"refresh_token": refresh_token},
        )
        revoked_refresh_response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert register_response.status_code == 201
        assert login_response.status_code == 200
        assert first_me_response.status_code == 200
        assert first_me_response.json() == {
            "id": user_id,
            "email": email,
            "created_at": created_at,
        }
        assert refresh_response.status_code == 200
        assert read_string(refresh_payload, "token_type") == "bearer"
        assert refresh_token != login_refresh_token
        assert second_me_response.status_code == 200
        assert second_me_response.json() == first_me_response.json()
        assert logout_response.status_code == 204
        assert revoked_refresh_response.status_code == 401
        assert revoked_refresh_response.json() == {"detail": "Token has been revoked"}
