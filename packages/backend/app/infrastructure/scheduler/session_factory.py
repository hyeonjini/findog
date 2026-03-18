from __future__ import annotations

from sqlmodel import Session

from app.infrastructure.persistence.database import engine


class SchedulerSessionFactory:
    """Creates sync database sessions for scheduler job context (outside request DI)."""

    @staticmethod
    def create_session() -> Session:
        return Session(engine)
