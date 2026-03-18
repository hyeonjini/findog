from fastapi import APIRouter

from app.presentation.http.routers.auth import router as auth_router
from app.presentation.http.routers.health import router as health_router
from app.presentation.http.routers.price_history import router as price_history_router
from app.presentation.http.routers.tracked_products import router as tracked_products_router
from app.presentation.http.routers.users import router as users_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(tracked_products_router)
api_router.include_router(price_history_router)
api_router.include_router(users_router)
