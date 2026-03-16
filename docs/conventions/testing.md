# Cross-Package Testing Strategy

This document defines the monorepo-wide testing strategy for FinDog. It covers boundaries, tooling choices, CI structure, and coverage targets across all three packages. For package-specific conventions (fixture patterns, naming, layer rules), see the architecture docs referenced in each section.

---

## A. Test Taxonomy

| Type | Scope | Who owns it | CI frequency |
|---|---|---|---|
| **Unit** | Single function, class, or component in isolation | Every package | Every push, every branch |
| **Integration** | Multiple real collaborators (DB, HTTP layer, hooks + server) | Backend, Frontend | Every push, every branch |
| **Contract** | API schema agreement between backend and generated client | Backend + api-client | Every push to `develop` and all PRs |
| **E2E** | Full user journey through a real browser | Frontend | PRs to `develop` only |

The rule of thumb: if a test needs a network socket, a browser, or a real database, it's at least integration. If it crosses the backend/frontend boundary via HTTP, it's contract or E2E.

---

## B. Backend Testing (Python / pytest)

> For layer rules, fixture patterns, and naming conventions, see `docs/architecture/backend.md` section 5.

### Directory Layout

```
packages/backend/tests/
├── unit/
│   ├── domain/          # Entity invariants, value objects, domain services
│   └── application/     # UseCase orchestration (mock repository ports)
├── integration/
│   ├── http/            # FastAPI TestClient — full request/response cycle
│   └── persistence/     # Real DB queries, migration smoke tests
└── conftest.py
```

### Unit Tests

**`tests/unit/domain/`** — pure Python, zero framework imports. Test entity invariants, value object validation, and domain service logic. Nothing is mocked because nothing external is touched.

**`tests/unit/application/`** — UseCase tests. Inject mock repository ports (using `unittest.mock.AsyncMock` or a hand-rolled in-memory stub). Assert on the calls made to the port and the value returned. Never import SQLModel or FastAPI here.

```python
# Good: application unit test
async def test_create_product_saves_and_publishes_event():
    repo = AsyncMock(spec=ProductRepository)
    bus = AsyncMock(spec=EventBus)
    interactor = CreateProductInteractor(repo=repo, event_bus=bus)

    result = await interactor.execute(CreateProductRequest(url="https://example.com/item"))

    repo.save.assert_awaited_once()
    bus.publish.assert_awaited_once()
    assert result.url == "https://example.com/item"
```

### Integration Tests

**`tests/integration/http/`** — use `fastapi.testclient.TestClient`. Override `get_session` with the test session fixture. Test auth flows, validation errors, and status codes end-to-end through the HTTP layer.

**`tests/integration/persistence/`** — exercise real SQL queries against an in-memory SQLite engine (or testcontainers for Postgres-specific behavior). Never mock the DB here.

### Fixture Scopes

| Fixture | Scope | Rationale |
|---|---|---|
| `engine` | `session` | Schema creation is expensive; share across the whole test run |
| `client` | `module` | App wiring is stable within a module |
| Mutation helpers (seed data, cleanup) | `function` | Each test gets a clean slate |

### pytest Markers

> **Not yet configured.** The markers below are the intended setup. As of now, no `markers` key exists in `pyproject.toml` — add it before using `-m` selectors in CI.

Declare in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
markers = [
  "unit: pure logic, no I/O",
  "integration: requires DB or HTTP",
  "contract: validates API schema agreement",
]
```

Run selectively:

```bash
pytest -m unit                  # fast, no I/O
pytest -m "integration"         # needs DB
pytest -m "not e2e"             # everything except browser tests
```

### What to Mock vs. What Not to Mock

| Mock this | Never mock this |
|---|---|
| External HTTP calls (price scrapers, email providers) | The database (use real SQLite in-memory) |
| `settings` / environment config | Repository implementations in integration tests |
| Email sending (`smtplib`, third-party SDKs) | FastAPI's own request parsing / validation |
| Repository ports in **unit** tests | CRUD functions in **integration** tests |

---

## C. Frontend Testing (TypeScript / Jest + Playwright)

> For component conventions and design-system rules, see `docs/architecture/frontend.md`.

### Unit Tests (Jest + React Testing Library)

**Components** — render with RTL, assert on visible output and user interactions. Don't test implementation details (internal state, class names). One test file per component, co-located or in `__tests__/`.

**Stores** — call `useStore.getState()` directly. No component wrapper needed. Test state transitions and derived selectors.

**Schema validation** — call Zod schemas with valid and invalid inputs. Assert on `.success` and `.error.issues`.

**Current Jest testMatch paths (implemented):**
- `design-system/**/*.test.tsx` — design-system primitive tests
- `src/features/auth/schemas/**/*.test.ts` — auth Zod schema tests
- `src/features/products/schemas/**/*.test.ts` — product Zod schema tests

```ts
// Store unit test
it('adds a saved product to the list', () => {
  const { addProduct, products } = useSavedProductsStore.getState()
  addProduct({ url: 'https://example.com', title: 'Widget' })
  expect(useSavedProductsStore.getState().products).toHaveLength(1)
})
```

### Integration Tests (Jest + MSW)

Test hooks and feature modules against a mocked HTTP layer using MSW. Use the generated mock handlers from orval so the mocks stay in sync with the real API contract.

```ts
// Use orval-generated handler, not a hand-rolled one
import { getProductsHandler } from '@findog/api-client/msw'

server.use(getProductsHandler({ status: 200, data: mockProducts }))
```

Never write `rest.get('/api/products', ...)` by hand. If the endpoint shape changes, orval regenerates the handler and the test breaks at the right place.

### E2E Tests (Playwright)

One spec file per user journey. Journeys map to features, not pages.

```
packages/frontend/e2e/
├── auth.spec.ts          # sign-up, login, logout
├── save-product.spec.ts  # extension-triggered save flow
└── price-history.spec.ts # view saved products + trend chart
```

**Page Object Model** — each page or major UI section gets a POM class. Selectors live in the POM, not scattered across specs.

**Auth fixture** — create a reusable Playwright fixture that logs in once per worker and shares the storage state. Don't repeat login steps in every spec.

**Seed data** — call the backend API directly (not through the UI) to set up preconditions. Keeps tests fast and deterministic.

```ts
test.beforeEach(async ({ request }) => {
  await request.post('/api/products', { data: seedProduct })
})
```

### What to Test at Each Level

| What | Unit | Integration | E2E |
|---|---|---|---|
| Component renders correctly | Yes | No | No |
| Store state transitions | Yes | No | No |
| Zod schema rejects bad input | Yes | No | No |
| Hook fetches and transforms data | No | Yes | No |
| Optimistic update rolls back on error | No | Yes | No |
| User can save a product end-to-end | No | No | Yes |
| Auth redirect on expired token | No | Yes | Yes |
| Price history chart displays data | No | No | Yes |

---

## D. Chrome Extension Testing (Vitest)

> **Not yet set up.** The extension is a skeleton (no TypeScript, no CRXJS, no `vitest.config.ts`). The patterns below are the intended approach for when the extension is built out.

The extension runs in three distinct contexts: background service worker, content script, and popup. Each context has different globals and constraints.

### Chrome API Mocking

Use `vitest-chrome` to provide a typed `chrome` global in all test files. Configure it once in `vitest.setup.ts`:

```ts
import 'vitest-chrome'
// chrome.runtime, chrome.storage, chrome.tabs etc. are now available as vi.fn()
```

Never import the real `chrome` object in tests. Never test `chrome.runtime.onMessage.addListener` wiring directly — that's framework plumbing. Test the handler functions in isolation.

### Background Service Worker

Extract message handlers into plain async functions. Test those functions directly.

```ts
// background/handlers/save-product.ts
export async function handleSaveProduct(payload: SaveProductPayload) { ... }

// test
it('calls the API and returns the saved product', async () => {
  vi.mocked(apiClient.saveProduct).mockResolvedValue(mockProduct)
  const result = await handleSaveProduct({ url: 'https://example.com' })
  expect(result).toEqual(mockProduct)
})
```

### Content Scripts

Use `jsdom` as the Vitest environment. Test DOM manipulation and message dispatch without a real browser.

```ts
// vitest.config.ts (content script tests)
{ environment: 'jsdom' }
```

### Popup

Test with `@testing-library/react` plus the `vitest-chrome` mock. The popup is a React app — apply the same RTL patterns as the frontend unit tests.

---

## E. Contract Testing Strategy

The backend owns the OpenAPI schema (ADR-0001). Three layers enforce that the TypeScript client stays in sync.

### Layer 1: orval Validation

`orval.config.ts` sets `validation: true`. Running `orval` against a malformed or incompatible spec fails the generation step. This catches schema regressions before any TypeScript is compiled.

```ts
// orval.config.ts
export default defineConfig({
  findog: {
    input: { target: './openapi.json', validation: true },
    output: { ... }
  }
})
```

### Layer 2: pytest Contract Test

> **Not yet implemented.** The `@pytest.mark.contract` marker is not registered in `pyproject.toml` and no contract test file exists yet.

A dedicated test marked `@pytest.mark.contract` compares the committed `openapi.json` against the schema the live app actually serves:

```python
@pytest.mark.contract
def test_openapi_schema_matches_committed_file(client):
    live_schema = client.get("/openapi.json").json()
    committed = json.loads(Path("openapi.json").read_text())
    assert live_schema == committed, (
        "openapi.json is stale. Run `scripts/export-schema.sh` and commit the result."
    )
```

This test runs in CI on every push to `develop` and on all PRs. A stale `openapi.json` blocks merge.

### Layer 3: TypeScript Compiler

After orval regeneration, `tsc --noEmit` on `packages/api-client` and `packages/frontend` catches any type mismatches introduced by schema changes. This runs as part of the `api-client staleness check` CI job (see section F).

---

## F. CI Pipeline Structure

> **Not yet created.** `.github/workflows/` does not exist. The structure below is the intended design — implement it when CI is set up.

```
push (any branch)
├── backend-unit          pytest -m unit
├── backend-integration   pytest -m integration
├── frontend-unit         jest --testPathPattern=unit
├── extension-unit        vitest run
└── type-check            tsc --noEmit (all packages)

push to develop / PR to develop
├── (all jobs above, in parallel)
├── contract              pytest -m contract + orval validation
├── api-client-staleness  diff generated client vs committed; fail if dirty
└── e2e                   playwright test (runs after unit + integration pass)
```

### Key Rules

**Parallel unit jobs** — each package's unit tests run in a separate job with no dependencies between them. Total unit feedback time should stay under 3 minutes.

**E2E only on PRs to `develop`** — E2E is slow and requires a running stack. Don't run it on every feature branch push. Developers get fast feedback from unit + integration; E2E is the final gate before `develop`.

**api-client staleness check** — after running `orval`, `git diff --exit-code packages/api-client` fails the job if any generated file changed. This forces developers to commit regenerated client code alongside API changes. A dirty diff blocks merge.

**Contract tests block merge** — the `contract` job is a required status check on PRs to `develop`. A stale `openapi.json` or a type mismatch in the generated client must be resolved before merge.

### Coverage Targets

| Package | Target | Measured on |
|---|---|---|
| `packages/backend` | 80% line coverage on `app/domain/` | pytest-cov, unit job |
| `packages/frontend` | 70% line coverage on `src/stores/` | jest --coverage, unit job |
| `packages/chrome-extension` | 70% line coverage on `src/background/handlers/` | vitest --coverage, unit job |

Coverage is a floor, not a goal. A test that exists only to hit a number is worse than no test. Focus coverage enforcement on the layers that contain real logic: domain, stores, and background handlers.

---

## G. Quick Reference Card

```
BACKEND
  Unit domain    → pytest -m unit tests/unit/domain/
  Unit app       → pytest -m unit tests/unit/application/   (mock ports)
  Integration    → pytest -m integration                     (real SQLite)
  Contract       → pytest -m contract                        (schema diff)

FRONTEND
  Unit           → jest --testPathPattern=unit               (RTL + store)
  Integration    → jest --testPathPattern=integration        (MSW handlers)
  E2E            → playwright test                           (POM + API seed)

EXTENSION
  All            → vitest run                                (vitest-chrome mock)

CROSS-CUTTING
  Type check     → tsc --noEmit (run in api-client + frontend + extension)
  Client sync    → orval && git diff --exit-code packages/api-client
  Schema sync    → pytest -m contract (openapi.json diff)

MOCKING RULES
  Mock           → external HTTP, email, settings, repo ports (unit only)
  Never mock     → DB in integration tests, FastAPI validation, orval handlers
```

---

## Related Documents

- `docs/architecture/backend.md` — layer rules, fixture patterns, naming conventions
- `docs/architecture/frontend.md` — component conventions, design-system rules
- `docs/adr/0001-boundaries.md` — why the backend owns the API schema
- `docs/troubleshooting.md` — common test environment issues
