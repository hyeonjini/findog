# Backend Architecture & Conventions

**Stack**: Python 3.12+ · FastAPI · Pydantic · SQLModel · PyTest

---

## 1. Layer Architecture (Clean Architecture + DDD)

```
packages/backend/app/
├── main.py                          # App factory, composition root
├── domain/                          # Layer 1: Pure Python, ZERO framework imports
│   ├── entities/                    # Entity classes (identity-based equality)
│   ├── value_objects/               # Immutable value objects (frozen dataclass)
│   ├── enums/                       # Domain enums
│   ├── exceptions/                  # Domain-specific exceptions
│   ├── ports/                       # Abstract interfaces (Protocol classes)
│   └── services/                    # Pure domain logic
├── application/                     # Layer 2: Use cases / Interactors
│   ├── commands/                    # Write operations (one file per use case)
│   ├── queries/                     # Read operations
│   └── common/
│       ├── ports/                   # Application-level port interfaces
│       └── services/               # Cross-cutting application services
├── infrastructure/                  # Layer 3: Adapters / Implementations
│   ├── persistence/                # Repository implementations (SQLModel)
│   │   ├── models/                 # SQLModel table=True models
│   │   └── repositories/          # Port implementations
│   ├── security/                   # JWT, hashing
│   └── external/                   # Third-party API clients
├── presentation/                   # Layer 4: HTTP / Controllers
│   └── http/
│       ├── router.py              # APIRouter aggregator
│       ├── routers/               # One file per resource
│       ├── schemas/               # Pydantic request/response DTOs
│       └── dependencies/         # FastAPI Depends factories
└── shared/                         # Cross-cutting utilities
    ├── event_bus.py               # Internal event bus interface + impl
    └── errors.py                  # Shared error types
```

### Layer Dependency Rules

```
presentation → application → domain ← infrastructure
                                ↑
                          (implements ports)
```

| Layer | CAN import | CANNOT import |
|---|---|---|
| `domain` | Python stdlib only | FastAPI, SQLModel, Pydantic, infrastructure |
| `application` | `domain` | FastAPI, SQLModel, infrastructure |
| `infrastructure` | `domain`, `application` (ports only), SQLModel, Pydantic | `presentation` |
| `presentation` | `application`, `domain` (types only), FastAPI, Pydantic | `infrastructure` directly |

### Adding a New Module (End-to-End Checklist)

```
1. domain/<module>/           → Entity, Value Objects, Repository Port (Protocol)
2. application/<module>/      → UseCase (Interactor) consuming the port
3. infrastructure/<module>/   → Repository implementation + SQLModel model
4. presentation/http/routers/ → Router file with endpoint + Pydantic schemas
5. presentation/http/router.py → Register the new router
6. main.py                    → Wire DI bindings
7. db/migrations/             → Add SQL migration file
8. tests/                     → Unit + integration tests
```

---

## 2. Naming Conventions

### Files & Directories

| Item | Convention | Example |
|---|---|---|
| Directory | `snake_case`, singular | `domain/entity/`, `application/command/` |
| Python file | `snake_case` | `user_repository.py`, `create_user.py` |
| Test file | `test_` prefix | `test_create_user.py` |
| Migration | `V{NNN}__{description}.sql` | `V002__create_products.sql` |

### Classes & Functions

| Item | Convention | Example |
|---|---|---|
| Entity | `PascalCase` | `User`, `Product` |
| Value Object | `PascalCase` | `Email`, `ProductUrl` |
| Repository Port | `PascalCase` + `Repository` | `UserRepository(Protocol)` |
| Repository Impl | `Sqla` prefix | `SqlaUserRepository` |
| UseCase / Interactor | `PascalCase` verb phrase | `CreateUserInteractor` |
| Router function | `snake_case` verb | `create_user()`, `get_products()` |
| Pydantic schema | `PascalCase` + purpose suffix | `UserCreateRequest`, `UserPublicResponse` |
| Exception | `PascalCase` + `Error` | `UserNotFoundError`, `InvalidEmailError` |
| Enum | `PascalCase` | `UserRole`, `ProductStatus` |
| Constant | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |

### SQLModel / Pydantic Model Hierarchy

```python
# 1. Base — shared fields, NO table, NO sensitive data
class UserBase(SQLModel):
    email: str
    is_active: bool = True

# 2. Create — input for creation (write-only fields like password)
class UserCreate(UserBase):
    password: str

# 3. Update — partial input (all Optional)
class UserUpdate(SQLModel):
    email: str | None = None
    password: str | None = None

# 4. Table — DB model (adds id, timestamps, hashed fields)
class UserTable(UserBase, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# 5. Public — API response (never exposes hashed_password)
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime
```

**Rules:**
- `table=True` only on the leaf DB model class, never on base/intermediate classes.
- Never return `table=True` models directly from endpoints — always use a `Public` response schema.
- Use `model_dump(exclude_unset=True)` for partial updates.

---

## 3. FastAPI Conventions

### Router & Endpoint Naming

```python
# routers/users.py
router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=UserPublic)
async def create_user(data: UserCreate, session: SessionDep) -> Any: ...

@router.get("/", response_model=list[UserPublic])
async def list_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any: ...

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: uuid.UUID, session: SessionDep) -> Any: ...

@router.patch("/{user_id}", response_model=UserPublic)
async def update_user(user_id: uuid.UUID, data: UserUpdate, session: SessionDep) -> Any: ...

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, session: SessionDep) -> None: ...
```

### Status Code Convention

| Operation | Success Code |
|---|---|
| GET (single/list) | `200 OK` |
| POST (create) | `201 Created` |
| PATCH/PUT (update) | `200 OK` |
| DELETE | `204 No Content` |
| Validation error | `422 Unprocessable Entity` |
| Not found | `404 Not Found` |
| Auth failure | `401 Unauthorized` |
| Permission denied | `403 Forbidden` |

### Error Response Format

```python
# All error responses follow this shape
{
    "detail": "Human-readable error message"
}

# For validation errors (automatic from Pydantic)
{
    "detail": [
        {
            "loc": ["body", "email"],
            "msg": "invalid email format",
            "type": "value_error"
        }
    ]
}
```

### Dependency Injection Pattern

```python
# dependencies/database.py
from typing import Annotated
from fastapi import Depends
from sqlmodel import Session

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

# dependencies/auth.py
def get_current_user(session: SessionDep, token: TokenDep) -> User:
    # validate JWT, load user
    ...

CurrentUser = Annotated[User, Depends(get_current_user)]
```

**Rules:**
- Use `Annotated[T, Depends(...)]` aliases — keep endpoint signatures clean.
- Compose dependencies: `CurrentUser` depends on `SessionDep` + `TokenDep` automatically.
- Never instantiate sessions or engines inside endpoint functions.

---

## 4. Python Coding Style

### Import Ordering (isort compatible)

```python
# 1. Standard library
import uuid
from datetime import datetime
from typing import Any

# 2. Third-party
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

# 3. Local application
from app.domain.entities.user import User
from app.application.commands.create_user import CreateUserInteractor
```

### Type Hints Policy

- **All** function signatures must have type hints (parameters and return).
- Use `|` union syntax (Python 3.12+): `str | None` not `Optional[str]`.
- Use `list[T]`, `dict[K, V]` (lowercase) not `List[T]`, `Dict[K, V]`.
- Domain entities use `@dataclass(frozen=True)` — not Pydantic `BaseModel`.

### General Rules

- Line length: 88 characters (Black default).
- Formatter: `ruff format` (Black-compatible).
- Linter: `ruff check`.
- No `# type: ignore` or `cast()` without an explanatory comment.
- No bare `except:` — always catch specific exceptions.
- No mutable default arguments.

---

## 5. Testing Strategy

### Directory Structure

```
tests/
├── unit/
│   ├── domain/          # Pure domain logic tests
│   ├── application/     # UseCase tests (mock repositories)
│   └── shared/          # Utility tests
├── integration/
│   ├── api/             # TestClient endpoint tests
│   └── persistence/     # Real DB tests (use test DB)
└── conftest.py          # Shared fixtures
```

### What to Test at Each Level

| Level | Test | Mock |
|---|---|---|
| Unit (domain) | Entity invariants, value object validation, domain service logic | Nothing — pure Python |
| Unit (application) | UseCase orchestration, error paths | Repository ports, external services |
| Integration (API) | Full request/response cycle, auth, validation | External APIs only |
| Integration (DB) | Repository queries, migrations | Nothing — use real test DB |

### Fixture Patterns

```python
# conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel

@pytest.fixture(name="engine", scope="session")
def engine_fixture():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    yield engine

@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session):
    def get_session_override():
        yield session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
```

### Test Naming

```python
# test_create_user.py
class TestCreateUser:
    def test_creates_user_with_valid_data(self, client): ...
    def test_rejects_duplicate_email(self, client): ...
    def test_returns_401_without_auth(self, client): ...
```

**Pattern:** `test_<expected_behavior>` — describes the outcome, not the method.

---

## 6. Event Bus (Internal)

```python
# shared/event_bus.py
from abc import ABC, abstractmethod

class DomainEvent(ABC):
    pass

class EventBus(ABC):
    @abstractmethod
    async def publish(self, events: list[DomainEvent]) -> None: ...

class InMemoryEventBus(EventBus):
    def __init__(self) -> None:
        self._handlers: dict[type, list[Callable]] = {}

    def subscribe(self, event_type: type, handler: Callable) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    async def publish(self, events: list[DomainEvent]) -> None:
        for event in events:
            for handler in self._handlers.get(type(event), []):
                await handler(event)
```

**Usage in UseCase:**
```python
class CreateProductInteractor:
    def __init__(self, repo: ProductRepository, event_bus: EventBus):
        self._repo = repo
        self._event_bus = event_bus

    async def execute(self, data: CreateProductRequest) -> Product:
        product = Product.create(data)        # records domain event
        await self._repo.save(product)
        await self._event_bus.publish(product.pull_events())
        return product
```
