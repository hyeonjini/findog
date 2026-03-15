# pyright: reportMissingImports=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false

from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.infrastructure.persistence.database import get_session


SessionDep = Annotated[Session, Depends(get_session)]
