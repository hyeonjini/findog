# Backend

FastAPI + Clean Architecture + DDD 기반 서버 패키지.

## Implemented Modules

| Module | Endpoints |
|---|---|
| `auth` | register, login, refresh, logout |
| `tracking` | create, update, archive, restore, list, detail, refresh |
| `user` | `/users/me` |
| `health` | `/api/health` |

## Structure

```text
app/
  domain/              # Entities, VOs, Repository ports (Protocol)
  application/         # Use cases (interactors)
  infrastructure/      # SQLModel models, repository impls
  presentation/
    http/
      routers/         # FastAPI routers + Pydantic request/response schemas
```

## DI Pattern

`Annotated[T, Depends(...)]` type aliases. Providers instantiate infrastructure impls from `SessionDep`. Never instantiate sessions inside endpoints.

## Commands

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
cd packages/backend && python -m pytest tests/ -v
```

## Tests

14 test files across `unit/domain`, `unit/application`, `integration/http`. See `tests/README.md`.
