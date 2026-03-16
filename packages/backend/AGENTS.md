# Backend Package

Python 3.12 + FastAPI + Pydantic + SQLModel. Clean Architecture + DDD.

**Status**: Implemented. Full auth cycle (register/login/refresh/logout) + tracked-product CRUD (create/update/archive/restore/list/detail). All Clean Architecture layers wired with DI. 14 test files covering unit (domain + application) and integration (HTTP endpoints).

## LAYER RULES

```
presentation -> application -> domain <- infrastructure
                                 ^
                           (implements ports)
```

| Layer | CAN import | CANNOT import |
|---|---|---|
| `domain` | Python stdlib only | FastAPI, SQLModel, Pydantic, infrastructure |
| `application` | `domain` | FastAPI, SQLModel, infrastructure |
| `infrastructure` | `domain`, `application` (ports only), SQLModel | `presentation` |
| `presentation` | `application`, `domain` (types only), FastAPI | `infrastructure` directly |

## NEW MODULE CHECKLIST

1. `domain/<module>/` - Entity, VO, Repository Port (Protocol)
2. `application/<module>/` - UseCase consuming port
3. `infrastructure/<module>/` - Repository impl + SQLModel model
4. `presentation/http/routers/` - Router + Pydantic schemas
5. `presentation/http/router.py` - Register new router
6. `main.py` - Wire DI bindings
7. `db/migrations/` - SQL migration file
8. `tests/` - Unit + integration tests

## NAMING

| Item | Convention | Example |
|---|---|---|
| File | `snake_case` | `user_repository.py` |
| Entity/VO | `PascalCase` | `User`, `Email` |
| Port | `Protocol` suffix | `UserRepository(Protocol)` |
| Impl | `Sqla` prefix | `SqlaUserRepository` |
| UseCase | Verb phrase | `CreateUserInteractor` |
| Router func | `snake_case` verb | `create_user()` |
| Schema | Purpose suffix | `UserCreateRequest`, `UserPublicResponse` |
| Test file | `test_` prefix | `test_create_user.py` |
| Migration | Versioned | `V{NNN}__{desc}.sql` |

## DI PATTERN

Use `Annotated[T, Depends(...)]` type aliases. Compose deps. Never instantiate sessions in endpoints.

## MODEL HIERARCHY

`Base -> Create/Update -> Table(table=True) -> Public(response)`. Never return `table=True` models from endpoints.

## TESTING

```
tests/
  unit/domain/           # Pure domain logic (no mocks)
  unit/application/      # UseCase tests (mock ports)
  integration/http/      # TestClient full cycle (auth, health, products, users)
  integration/persistence/  # Real test DB (not yet populated)
  conftest.py            # engine, session, client, auth_headers fixtures
```

Test naming: `test_<expected_behavior>` - describes outcome, not method.

## IMPLEMENTED MODULES

| Domain | Endpoints | Use Cases | Tests |
|---|---|---|---|
| `auth` | register, login, refresh, logout | 4 interactors | 2 unit + 1 integration |
| `tracking` | create, update, archive, restore, list, detail, refresh | 5 interactors (CQRS split) | 4 unit + 1 integration |
| `user` | `/users/me` | via auth dependency | 1 integration |
| `health` | `/api/health` | — | 1 integration |

## COMPOSITION ROOT (`app/main.py`)

DI wiring uses `Annotated[Port, Depends(provider)]` aliases. Providers instantiate infrastructure impls from `SessionDep`. Router inclusion uses dynamic import with fallback state tracking.

## ANTI-PATTERNS

- No FastAPI/SQLModel/Pydantic imports in `domain/`
- No `table=True` models as API responses
- No `# type: ignore` without explanatory comment
- No bare `except:` - catch specific types
- No mutable default arguments
- No sessions/engines instantiated inside endpoints

## REFERENCE

Full conventions: `docs/architecture/backend.md`
