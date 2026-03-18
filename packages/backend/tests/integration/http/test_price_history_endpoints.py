from __future__ import annotations

from typing import Protocol, cast
from uuid import uuid4

from fastapi.testclient import TestClient
from httpx import Response

JsonDict = dict[str, object]


class AuthHeadersFactory(Protocol):
    def __call__(
        self,
        email: str | None = None,
        password: str = "password123",
    ) -> dict[str, str]: ...


def make_email() -> str:
    return f"{uuid4()}@example.com"


def json_dict(response: Response) -> JsonDict:
    return cast(JsonDict, response.json())


def read_string(payload: JsonDict, key: str) -> str:
    value = payload[key]
    assert isinstance(value, str)
    return value


def read_items(payload: JsonDict) -> list[JsonDict]:
    value = payload["items"]
    assert isinstance(value, list)
    items: list[JsonDict] = []
    for item in cast(list[object], value):
        assert isinstance(item, dict)
        items.append(cast(JsonDict, item))
    return items


def create_tracked_product(
    client: TestClient,
    headers: dict[str, str],
    *,
    suffix: str,
) -> Response:
    return client.post(
        "/api/tracked-products",
        headers=headers,
        json={
            "source_url": f"https://shop.example.com/products/{suffix}",
            "source_title": f"Product {suffix}",
            "source_platform": "shop-example",
        },
    )


class TestPriceHistoryEndpoints:
    def test_returns_200_with_empty_items(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created = create_tracked_product(client, headers, suffix="ph-empty")
        product_id = read_string(json_dict(created), "id")

        response = client.get(
            f"/api/tracked-products/{product_id}/price-history",
            headers=headers,
        )

        assert created.status_code == 201
        assert response.status_code == 200
        payload = json_dict(response)
        items = read_items(payload)
        assert items == []
        assert payload["total"] == 0

    def test_returns_401_without_auth(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created = create_tracked_product(client, headers, suffix="ph-unauth")
        product_id = read_string(json_dict(created), "id")

        response = client.get(
            f"/api/tracked-products/{product_id}/price-history",
        )

        assert created.status_code == 201
        assert response.status_code == 401
        assert response.json() == {"detail": "Not authenticated"}

    def test_returns_404_for_other_users_product(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        owner_headers = auth_headers(email=make_email())
        other_headers = auth_headers(email=make_email())
        created = create_tracked_product(client, owner_headers, suffix="ph-cross")
        product_id = read_string(json_dict(created), "id")

        response = client.get(
            f"/api/tracked-products/{product_id}/price-history",
            headers=other_headers,
        )

        assert created.status_code == 201
        assert response.status_code == 404
        assert response.json() == {"detail": "Tracked product not found"}

    def test_returns_404_for_nonexistent_product(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())

        response = client.get(
            f"/api/tracked-products/{uuid4()}/price-history",
            headers=headers,
        )

        assert response.status_code == 404
        assert response.json() == {"detail": "Tracked product not found"}
