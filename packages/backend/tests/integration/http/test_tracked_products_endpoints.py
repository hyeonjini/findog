from __future__ import annotations

from decimal import Decimal
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


def tracked_product_payload(
    suffix: str,
    *,
    source_title: str | None = None,
) -> JsonDict:
    return {
        "source_url": f"https://shop.example.com/products/{suffix}",
        "source_title": source_title or f"Tracked product {suffix}",
        "source_platform": "shop-example",
        "source_image_url": f"https://cdn.example.com/images/{suffix}.jpg",
        "source_price_amount": "199.99",
        "source_currency": "USD",
    }


def create_tracked_product(
    client: TestClient,
    headers: dict[str, str],
    *,
    suffix: str,
    source_title: str | None = None,
) -> Response:
    return client.post(
        "/api/tracked-products",
        headers=headers,
        json=tracked_product_payload(suffix, source_title=source_title),
    )


class TestTrackedProductsEndpoints:
    def test_create_tracked_product_returns_201(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())

        response = create_tracked_product(client, headers, suffix="created")

        assert response.status_code == 201
        payload = json_dict(response)
        assert read_string(payload, "id")
        assert read_string(payload, "user_id")
        assert read_string(payload, "source_url") == "https://shop.example.com/products/created"
        assert read_string(payload, "source_title") == "Tracked product created"
        assert read_string(payload, "source_platform") == "shop-example"
        assert read_string(payload, "source_image_url") == "https://cdn.example.com/images/created.jpg"
        assert Decimal(str(payload["source_price_amount"])) == Decimal("199.99")
        assert read_string(payload, "source_currency") == "USD"
        assert payload["normalized_query"] is None
        assert payload["product_fingerprint"] is None
        assert read_string(payload, "monitoring_status") == "active"
        assert payload["restock_alert_enabled"] is False
        assert payload["lowest_price_tracking_enabled"] is False
        assert payload["last_checked_at"] is None
        assert read_string(payload, "created_at")
        assert read_string(payload, "updated_at")

    def test_create_duplicate_returns_409(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())

        first_response = create_tracked_product(client, headers, suffix="duplicate")
        second_response = create_tracked_product(client, headers, suffix="duplicate")

        assert first_response.status_code == 201
        assert second_response.status_code == 409
        assert second_response.json() == {"detail": "Tracked product already exists"}

    def test_create_with_invalid_price_fields_returns_422(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())

        response = client.post(
            "/api/tracked-products",
            headers=headers,
            json={
                "source_url": "https://shop.example.com/products/bad-price",
                "source_title": "Bad price product",
                "source_currency": "USD",
            },
        )

        assert response.status_code == 422

    def test_list_tracked_products_returns_only_own(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        owner_headers = auth_headers(email=make_email())
        other_headers = auth_headers(email=make_email())

        owner_first = create_tracked_product(client, owner_headers, suffix="owner-one")
        owner_second = create_tracked_product(client, owner_headers, suffix="owner-two")
        other_product = create_tracked_product(client, other_headers, suffix="other-one")
        owner_list = client.get("/api/tracked-products", headers=owner_headers)
        other_list = client.get("/api/tracked-products", headers=other_headers)

        assert owner_first.status_code == 201
        assert owner_second.status_code == 201
        assert other_product.status_code == 201
        assert owner_list.status_code == 200
        assert other_list.status_code == 200

        owner_items = read_items(json_dict(owner_list))
        other_items = read_items(json_dict(other_list))
        owner_urls = {read_string(item, "source_url") for item in owner_items}
        other_urls = {read_string(item, "source_url") for item in other_items}

        assert owner_urls == {
            "https://shop.example.com/products/owner-one",
            "https://shop.example.com/products/owner-two",
        }
        assert other_urls == {"https://shop.example.com/products/other-one"}

    def test_get_tracked_product_detail_returns_200(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="detail")
        created_payload = json_dict(created_response)
        tracked_product_id = read_string(created_payload, "id")

        detail_response = client.get(
            f"/api/tracked-products/{tracked_product_id}",
            headers=headers,
        )

        assert created_response.status_code == 201
        assert detail_response.status_code == 200
        assert detail_response.json() == created_payload

    def test_get_nonexistent_returns_404(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())

        response = client.get(
            f"/api/tracked-products/{uuid4()}",
            headers=headers,
        )

        assert response.status_code == 404
        assert response.json() == {"detail": "Tracked product not found"}

    def test_get_other_users_product_returns_404(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        owner_headers = auth_headers(email=make_email())
        other_headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, owner_headers, suffix="cross-user")
        tracked_product_id = read_string(json_dict(created_response), "id")

        response = client.get(
            f"/api/tracked-products/{tracked_product_id}",
            headers=other_headers,
        )

        assert created_response.status_code == 201
        assert response.status_code == 404
        assert response.json() == {"detail": "Tracked product not found"}

    def test_update_tracked_product_returns_200(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="patch")
        tracked_product_id = read_string(json_dict(created_response), "id")

        response = client.patch(
            f"/api/tracked-products/{tracked_product_id}",
            headers=headers,
            json={
                "source_title": "Updated tracked product",
                "restock_alert_enabled": True,
                "lowest_price_tracking_enabled": True,
            },
        )

        assert created_response.status_code == 201
        assert response.status_code == 200
        payload = json_dict(response)
        assert read_string(payload, "id") == tracked_product_id
        assert read_string(payload, "source_title") == "Updated tracked product"
        assert payload["restock_alert_enabled"] is True
        assert payload["lowest_price_tracking_enabled"] is True
        assert read_string(payload, "source_url") == "https://shop.example.com/products/patch"
        assert read_string(payload, "monitoring_status") == "active"
        assert read_string(payload, "updated_at") != read_string(
            json_dict(created_response), "updated_at"
        )

    def test_update_with_empty_title_returns_422(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="empty-title")
        tracked_product_id = read_string(json_dict(created_response), "id")

        response = client.patch(
            f"/api/tracked-products/{tracked_product_id}",
            headers=headers,
            json={"source_title": ""},
        )

        assert created_response.status_code == 201
        assert response.status_code == 422

    def test_update_with_whitespace_only_title_returns_422(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="ws-title")
        tracked_product_id = read_string(json_dict(created_response), "id")

        response = client.patch(
            f"/api/tracked-products/{tracked_product_id}",
            headers=headers,
            json={"source_title": "   "},
        )

        assert created_response.status_code == 201
        assert response.status_code == 422

    def test_update_nonexistent_returns_404(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())

        response = client.patch(
            f"/api/tracked-products/{uuid4()}",
            headers=headers,
            json={"source_title": "Missing tracked product"},
        )

        assert response.status_code == 404
        assert response.json() == {"detail": "Tracked product not found"}

    def test_mutating_other_users_product_returns_404(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        owner_headers = auth_headers(email=make_email())
        other_headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, owner_headers, suffix="mutate-cross-user")
        tracked_product_id = read_string(json_dict(created_response), "id")

        responses = [
            client.patch(
                f"/api/tracked-products/{tracked_product_id}",
                headers=other_headers,
                json={"source_title": "Unauthorized update"},
            ),
            client.post(
                f"/api/tracked-products/{tracked_product_id}/archive",
                headers=other_headers,
            ),
            client.post(
                f"/api/tracked-products/{tracked_product_id}/restore",
                headers=other_headers,
            ),
            client.post(
                f"/api/tracked-products/{tracked_product_id}/refresh",
                headers=other_headers,
            ),
        ]

        assert created_response.status_code == 201
        for response in responses:
            assert response.status_code == 404
            assert response.json() == {"detail": "Tracked product not found"}

    def test_archive_tracked_product_returns_200(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="archive")
        tracked_product_id = read_string(json_dict(created_response), "id")

        response = client.post(
            f"/api/tracked-products/{tracked_product_id}/archive",
            headers=headers,
        )

        assert created_response.status_code == 201
        assert response.status_code == 200
        assert read_string(json_dict(response), "monitoring_status") == "archived"

    def test_archive_already_archived_is_idempotent(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="archive")
        tracked_product_id = read_string(json_dict(created_response), "id")

        first_archive_response = client.post(
            f"/api/tracked-products/{tracked_product_id}/archive",
            headers=headers,
        )
        second_archive_response = client.post(
            f"/api/tracked-products/{tracked_product_id}/archive",
            headers=headers,
        )
        assert created_response.status_code == 201
        assert second_archive_response.status_code == 200
        assert first_archive_response.status_code == 200
        assert read_string(json_dict(second_archive_response), "monitoring_status") == "archived"

    def test_restore_tracked_product_returns_200(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="restore")
        tracked_product_id = read_string(json_dict(created_response), "id")

        archive_response = client.post(
            f"/api/tracked-products/{tracked_product_id}/archive",
            headers=headers,
        )
        restore_response = client.post(
            f"/api/tracked-products/{tracked_product_id}/restore",
            headers=headers,
        )

        assert created_response.status_code == 201
        assert archive_response.status_code == 200
        assert restore_response.status_code == 200
        assert read_string(json_dict(restore_response), "monitoring_status") == "active"

    def test_refresh_returns_202(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="refresh")
        tracked_product_id = read_string(json_dict(created_response), "id")

        response = client.post(
            f"/api/tracked-products/{tracked_product_id}/refresh",
            headers=headers,
        )

        assert created_response.status_code == 201
        assert response.status_code == 202
        payload = json_dict(response)
        assert read_string(payload, "id") == tracked_product_id
        assert read_string(payload, "monitoring_status") == "active"
        assert read_string(payload, "last_checked_at")

    def test_unauthenticated_returns_401(
        self,
        client: TestClient,
        auth_headers: AuthHeadersFactory,
    ) -> None:
        headers = auth_headers(email=make_email())
        created_response = create_tracked_product(client, headers, suffix="auth")
        tracked_product_id = read_string(json_dict(created_response), "id")

        responses = [
            client.post("/api/tracked-products", json=tracked_product_payload("unauth")),
            client.get("/api/tracked-products"),
            client.get(f"/api/tracked-products/{tracked_product_id}"),
            client.patch(
                f"/api/tracked-products/{tracked_product_id}",
                json={"source_title": "Unauthorized update"},
            ),
            client.post(f"/api/tracked-products/{tracked_product_id}/archive"),
            client.post(f"/api/tracked-products/{tracked_product_id}/restore"),
            client.post(f"/api/tracked-products/{tracked_product_id}/refresh"),
        ]

        assert created_response.status_code == 201
        for response in responses:
            assert response.status_code == 401
            assert response.json() == {"detail": "Not authenticated"}
