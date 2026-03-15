# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUntypedFunctionDecorator=false

from collections.abc import Callable, Generator
from typing import cast
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.infrastructure.persistence.database import get_session
from app.infrastructure.persistence.models.refresh_token import RefreshTokenTable
from app.infrastructure.persistence.models.user import UserTable
from app.main import app

_ = (UserTable, RefreshTokenTable)


@pytest.fixture(name="engine", scope="session")
def engine_fixture() -> Generator[Engine, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine: Engine) -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
        session.rollback()

    with Session(engine) as cleanup_session:
        for table in reversed(SQLModel.metadata.sorted_tables):
            _ = cleanup_session.exec(delete(table))
        cleanup_session.commit()


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def get_session_override() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_session] = get_session_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(
    client: TestClient,
) -> Callable[[str | None, str], dict[str, str]]:
    def factory(
        email: str | None = None,
        password: str = "password123",
    ) -> dict[str, str]:
        resolved_email = email or f"{uuid4()}@example.com"
        register_response = client.post(
            "/api/auth/register",
            json={"email": resolved_email, "password": password},
        )
        assert register_response.status_code == 201

        login_response = client.post(
            "/api/auth/login",
            json={"email": resolved_email, "password": password},
        )
        assert login_response.status_code == 200

        payload = cast(dict[str, object], login_response.json())
        access_token = payload["access_token"]
        assert isinstance(access_token, str)
        return {"Authorization": f"Bearer {access_token}"}

    return factory
