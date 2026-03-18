from __future__ import annotations

import asyncio
import logging

from ...application.pricing.commands.check_all_prices import CheckAllPricesInteractor
from ...domain.pricing.ports import PlatformAdapter, SearchStrategy
from ..persistence.repositories.price_history_repository import (
    SqlaPriceHistoryRepository,
)
from ..persistence.repositories.tracked_product_repository import (
    SqlaTrackedProductRepository,
)
from .session_factory import SchedulerSessionFactory

logger = logging.getLogger(__name__)


async def start_price_check_loop(
    session_factory: SchedulerSessionFactory,
    adapters: dict[str, PlatformAdapter],
    strategy: SearchStrategy,
    interval_minutes: int,
) -> None:
    """Run price checking in an infinite async loop with configurable interval."""
    logger.info(
        "Price check scheduler started (interval=%d minutes)", interval_minutes
    )
    interval_seconds = interval_minutes * 60

    while True:
        logger.info("Price check cycle starting...")
        session = session_factory.create_session()
        try:
            tracking_repo = SqlaTrackedProductRepository(session)
            price_history_repo = SqlaPriceHistoryRepository(session)

            interactor = CheckAllPricesInteractor(
                tracking_repo=tracking_repo,
                price_history_repo=price_history_repo,
                strategy=strategy,
                adapters=adapters,
            )
            saved = await asyncio.to_thread(interactor.execute)
            logger.info(
                "Price check cycle complete - %d price points saved", len(saved)
            )
        except asyncio.CancelledError:
            logger.info("Price check scheduler shutting down")
            raise
        except Exception:
            logger.exception("Price check cycle failed")
        finally:
            session.close()

        await asyncio.sleep(interval_seconds)
