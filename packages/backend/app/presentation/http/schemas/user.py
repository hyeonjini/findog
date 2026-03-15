from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserPublicResponse(BaseModel):
    id: UUID
    email: str
    created_at: datetime
