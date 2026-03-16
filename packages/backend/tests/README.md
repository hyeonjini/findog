# Backend Tests

PyTest. 14 test files covering unit and integration layers.

## Structure

```text
tests/
  unit/
    domain/            # Pure domain logic (no mocks)
    application/       # Use case tests (mock ports)
  integration/
    http/              # TestClient full-cycle tests
  conftest.py          # engine, session, client, auth_headers fixtures
```

## Coverage

| Layer | Scope |
|---|---|
| `unit/domain` | Domain entities and value objects |
| `unit/application` | Auth interactors (4), tracking interactors (4) |
| `integration/http` | health, auth endpoints, tracked-product endpoints, users endpoint |

## Run

```bash
cd packages/backend && python -m pytest tests/ -v
```
