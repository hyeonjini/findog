# Backend Package

Python 3.12 + FastAPI + Pydantic + SQLModel. Clean Architecture + DDD.

**Status**: Skeleton. Only `GET /api/health` implemented. Layer dirs have placeholder READMEs only.

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
  integration/api/       # TestClient full cycle
  integration/persistence/  # Real test DB
  conftest.py            # engine, session, client fixtures
```

Test naming: `test_<expected_behavior>` - describes outcome, not method.

## ANTI-PATTERNS

- No FastAPI/SQLModel/Pydantic imports in `domain/`
- No `table=True` models as API responses
- No `# type: ignore` without explanatory comment
- No bare `except:` - catch specific types
- No mutable default arguments
- No sessions/engines instantiated inside endpoints

## REFERENCE

Full conventions: `docs/architecture/backend.md`
