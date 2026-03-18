from __future__ import annotations

from fastapi.testclient import TestClient


class TestHealthEndpoint:
    def test_health_preflight_returns_expected_cors_headers(self, client: TestClient) -> None:
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization, content-type",
            },
        )

        assert response.status_code == 200
        assert (
            response.headers.get("access-control-allow-origin")
            == "http://localhost:3000"
        )
        allowed_methods = response.headers["access-control-allow-methods"]
        assert "GET" in allowed_methods
        assert response.headers.get("access-control-allow-credentials") == "true"
        allowed_headers = response.headers["access-control-allow-headers"]
        assert len(allowed_headers) > 0
