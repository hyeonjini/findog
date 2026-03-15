from __future__ import annotations

from typing import cast
from uuid import uuid4

from fastapi.testclient import TestClient
from httpx import Response

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


class TestRegisterEndpoint:
    def test_register_returns_created_user(self, client: TestClient) -> None:
        email = make_email()

        response = register_user(client, email=email.upper())

        assert response.status_code == 201
        payload = json_dict(response)
        assert read_string(payload, "email") == email
        _ = read_string(payload, "id")
        _ = read_string(payload, "created_at")

    def test_register_rejects_invalid_payload(self, client: TestClient) -> None:
        response = client.post(
            "/api/auth/register",
            json={"email": "not-an-email", "password": "short"},
        )

        assert response.status_code == 422
        payload = json_dict(response)
        assert isinstance(payload["detail"], list)
        assert payload["detail"]

    def test_register_rejects_duplicate_email(self, client: TestClient) -> None:
        email = make_email()

        first_response = register_user(client, email=email)
        second_response = register_user(client, email=email)

        assert first_response.status_code == 201
        assert second_response.status_code == 409
        assert second_response.json() == {"detail": "Email already exists"}


class TestLoginEndpoint:
    def test_login_returns_tokens_for_valid_credentials(self, client: TestClient) -> None:
        email = make_email()
        register_response = register_user(client, email=email)

        response = login_user(client, email=email)

        assert register_response.status_code == 201
        assert response.status_code == 200
        payload = json_dict(response)
        assert read_string(payload, "token_type") == "bearer"
        assert read_string(payload, "access_token")
        assert read_string(payload, "refresh_token")

    def test_login_rejects_invalid_credentials(self, client: TestClient) -> None:
        email = make_email()
        register_response = register_user(client, email=email)

        wrong_password_response = login_user(client, email=email, password="wrong-pass")
        unknown_user_response = login_user(client, email=make_email())

        assert register_response.status_code == 201
        assert wrong_password_response.status_code == 401
        assert wrong_password_response.json() == {"detail": "Invalid credentials"}
        assert unknown_user_response.status_code == 401
        assert unknown_user_response.json() == {"detail": "Invalid credentials"}


class TestRefreshAndLogoutEndpoints:
    def test_refresh_rotates_refresh_token_and_revokes_previous_token(
        self,
        client: TestClient,
    ) -> None:
        email = make_email()
        register_response = register_user(client, email=email)
        login_response = login_user(client, email=email)
        login_payload = json_dict(login_response)
        refresh_token = read_string(login_payload, "refresh_token")

        refresh_response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        reuse_response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert register_response.status_code == 201
        assert login_response.status_code == 200
        assert refresh_response.status_code == 200
        refresh_payload = json_dict(refresh_response)
        assert read_string(refresh_payload, "token_type") == "bearer"
        assert read_string(refresh_payload, "access_token")
        assert read_string(refresh_payload, "refresh_token") != refresh_token
        assert reuse_response.status_code == 401
        assert reuse_response.json() == {"detail": "Token has been revoked"}

    def test_logout_is_idempotent_and_revokes_refresh_token(
        self,
        client: TestClient,
    ) -> None:
        email = make_email()
        register_response = register_user(client, email=email)
        login_response = login_user(client, email=email)
        login_payload = json_dict(login_response)
        access_token = read_string(login_payload, "access_token")
        refresh_token = read_string(login_payload, "refresh_token")
        headers = {"Authorization": f"Bearer {access_token}"}

        first_logout_response = client.post(
            "/api/auth/logout",
            headers=headers,
            json={"refresh_token": refresh_token},
        )
        second_logout_response = client.post(
            "/api/auth/logout",
            headers=headers,
            json={"refresh_token": refresh_token},
        )
        refresh_response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert register_response.status_code == 201
        assert login_response.status_code == 200
        assert first_logout_response.status_code == 204
        assert first_logout_response.content == b""
        assert second_logout_response.status_code == 204
        assert second_logout_response.content == b""
        assert refresh_response.status_code == 401
        assert refresh_response.json() == {"detail": "Token has been revoked"}
