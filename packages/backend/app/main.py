import asyncio
import importlib
from collections.abc import AsyncIterator, Awaitable, Callable, Coroutine
from contextlib import asynccontextmanager
from types import ModuleType
from typing import Annotated, Protocol, cast

from fastapi import APIRouter, Depends, FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.domain.auth.ports import PasswordHasher, RefreshTokenRepository, TokenService
from app.domain.pricing.ports import PlatformAdapter, SearchStrategy
from app.domain.tracking.repository import TrackingRepository
from app.domain.user.repository import UserRepository
from app.infrastructure.persistence.repositories.tracked_product_repository import (
    SqlaTrackedProductRepository,
)
from app.infrastructure.persistence.repositories.refresh_token_repository import (
    SqlaRefreshTokenRepository,
)
from app.infrastructure.persistence.repositories.user_repository import SqlaUserRepository
from app.infrastructure.security.password_hasher import BcryptPasswordHasher
from app.infrastructure.security.token_service import JwtTokenService
from app.presentation.http.dependencies.database import SessionDep
from app.shared.config import settings


def get_user_repository(session: SessionDep) -> UserRepository:
    return SqlaUserRepository(session)


def get_refresh_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return SqlaRefreshTokenRepository(session)


def get_tracking_repository(session: SessionDep) -> TrackingRepository:
    return SqlaTrackedProductRepository(session)


def get_password_hasher() -> PasswordHasher:
    return BcryptPasswordHasher()


def get_token_service() -> TokenService:
    return JwtTokenService(
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]
RefreshTokenRepositoryDep = Annotated[
    RefreshTokenRepository,
    Depends(get_refresh_token_repository),
]
TrackingRepositoryDep = Annotated[TrackingRepository, Depends(get_tracking_repository)]
PasswordHasherDep = Annotated[PasswordHasher, Depends(get_password_hasher)]
TokenServiceDep = Annotated[TokenService, Depends(get_token_service)]


class _EnabledPlatformRegistry(Protocol):
    def all_enabled(self) -> dict[str, PlatformAdapter]: ...


class _PlatformRegistryClass(Protocol):
    @classmethod
    def from_yaml(cls, config_path: str) -> _EnabledPlatformRegistry: ...


class _SchedulerSessionFactoryInstance(Protocol):
    def create_session(self) -> object: ...


class _SchedulerSessionFactoryClass(Protocol):
    def __call__(self) -> _SchedulerSessionFactoryInstance: ...


class _StartPriceCheckLoop(Protocol):
    def __call__(
        self,
        *,
        session_factory: _SchedulerSessionFactoryInstance,
        adapters: dict[str, PlatformAdapter],
        strategy: SearchStrategy,
        interval_minutes: int,
    ) -> Coroutine[object, object, None]: ...


def _include_api_router(app: FastAPI, *, allow_deferred_import_error: bool = False) -> None:
    if getattr(app.state, "api_router_included", False):
        return

    deferred_import_error = getattr(app.state, "deferred_api_router_import_error", None)
    if deferred_import_error is not None and not allow_deferred_import_error:
        raise RuntimeError("API router import failed during application setup") from deferred_import_error

    try:
        router_module: ModuleType = importlib.import_module("app.presentation.http.router")
    except ImportError as exc:
        if allow_deferred_import_error:
            app.state.deferred_api_router_import_error = exc
            return
        raise RuntimeError("Failed to import API router") from exc

    api_router = cast(APIRouter, getattr(router_module, "api_router"))

    app.include_router(api_router)
    app.state.api_router_included = True
    if hasattr(app.state, "deferred_api_router_import_error"):
        delattr(app.state, "deferred_api_router_import_error")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    _include_api_router(app)

    scheduler_task: asyncio.Task[None] | None = None
    if settings.SCHEDULER_ENABLED:
        registry_module = importlib.import_module("app.infrastructure.external.registry")
        strategy_module = importlib.import_module("app.infrastructure.external.strategy")
        scheduler_session_factory_module = importlib.import_module(
            "app.infrastructure.scheduler.session_factory"
        )
        scheduler_setup_module = importlib.import_module(
            "app.infrastructure.scheduler.setup"
        )

        platform_registry_cls = cast(
            _PlatformRegistryClass, getattr(registry_module, "PlatformRegistry")
        )
        simple_search_strategy_cls = cast(
            Callable[[], SearchStrategy],
            getattr(strategy_module, "SimpleSearchStrategy"),
        )
        scheduler_session_factory_cls = cast(
            _SchedulerSessionFactoryClass,
            getattr(scheduler_session_factory_module, "SchedulerSessionFactory"),
        )
        start_price_check_loop_fn = cast(
            _StartPriceCheckLoop,
            getattr(scheduler_setup_module, "start_price_check_loop"),
        )

        registry = platform_registry_cls.from_yaml(settings.PLATFORMS_CONFIG_PATH)
        adapters = registry.all_enabled()
        strategy = simple_search_strategy_cls()
        session_factory = scheduler_session_factory_cls()

        scheduler_task = asyncio.create_task(
            start_price_check_loop_fn(
                session_factory=session_factory,
                adapters=adapters,
                strategy=strategy,
                interval_minutes=settings.PRICE_CHECK_INTERVAL_MINUTES,
            )
        )

    yield

    if scheduler_task is not None:
        _ = scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            pass


def create_app() -> FastAPI:
    app = FastAPI(title="FinDog API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:8002"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async def ensure_router(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        _include_api_router(app)
        return await call_next(request)

    _ = app.middleware("http")(ensure_router)

    _include_api_router(app, allow_deferred_import_error=True)

    return app


app = create_app()
