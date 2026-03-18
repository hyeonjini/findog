# API Client Architecture

**Package**: `@findog/api-client` · **Location**: `packages/api-client/`

The API client is **generated code**. Never hand-write types or hooks inside this package.

---

## Purpose

Single source of truth for the HTTP contract between the backend and all TypeScript consumers (frontend, Chrome extension). Generated directly from the backend's OpenAPI schema so the contract is always in sync.

Consumers:
- `packages/frontend` — React Query hooks for data fetching
- `packages/chrome-extension` — typed fetch calls via the background service worker

---

## Generation Tool: orval

[orval](https://orval.dev) reads the OpenAPI spec and emits three output targets in one run.

### Configuration: `packages/api-client/orval.config.ts`

```ts
import { defineConfig } from 'orval';

export default defineConfig({
  // Target 1: React Query hooks + axios calls, split by OpenAPI tag
  endpoints: {
    input: '../../openapi.json',
    output: {
      mode: 'tags-split',          // one file per tag (e.g. users.ts, products.ts)
      target: './src/endpoints',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/mutator/axios-instance.ts',
          name: 'axiosInstance',   // custom axios instance with auth headers
        },
      },
    },
  },

  // Target 2: Zod validation schemas
  schemas: {
    input: '../../openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/schemas',
      client: 'zod',
    },
  },

  // Target 3: MSW request handlers for tests and Storybook
  mocks: {
    input: '../../openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/mocks',
      client: 'msw',
    },
  },
});
```

The custom axios mutator (`src/mutator/axios-instance.ts`) attaches the JWT bearer token and handles 401 refresh logic. It is **not** generated — keep it in source control and never overwrite it during generation.

---

## Generated Directory Structure

```
packages/api-client/
├── orval.config.ts              # generation config (committed)
├── src/
│   ├── mutator/
│   │   └── axios-instance.ts    # hand-written, NOT regenerated
│   ├── endpoints/               # generated — React Query hooks
│   │   ├── users.ts
│   │   ├── products.ts
│   │   └── ...
│   ├── schemas/                 # generated — Zod schemas
│   │   ├── users.ts
│   │   ├── products.ts
│   │   └── ...
│   └── mocks/                   # generated — MSW handlers
│       ├── users.ts
│       ├── products.ts
│       └── ...
└── index.ts                     # re-exports everything (committed)
```

Files under `endpoints/`, `schemas/`, and `mocks/` are fully generated. Do not edit them by hand.

---

## Workflow: Backend Change to Client Update

```
1. Modify backend router / Pydantic schema
2. bash scripts/export-openapi.sh        # writes openapi.json to repo root
3. pnpm api:generate                     # runs orval, rewrites generated files
4. git add openapi.json packages/api-client/src/
5. git commit                            # schema + client in ONE commit
```

The `openapi.json` and the generated client **must always be committed together**. A schema file without a matching client update (or vice versa) will break CI.

### `scripts/export-openapi.sh`

Starts the FastAPI app in export mode and writes the OpenAPI JSON:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd packages/backend
python -c "
import json
from app.main import app
with open('../../openapi.json', 'w') as f:
    json.dump(app.openapi(), f, indent=2)
"
```

### `pnpm api:generate`

Defined in `packages/api-client/package.json`:

```json
{
  "scripts": {
    "generate": "orval"
  }
}
```

Root `package.json` workspace script:

```json
{
  "scripts": {
    "api:generate": "pnpm --filter @findog/api-client generate"
  }
}
```

---

## CI Staleness Check

The CI pipeline regenerates the client and fails if the working tree is dirty:

```yaml
# .github/workflows/ci.yml (relevant step)
- name: Check API client is up to date
  run: |
    bash scripts/export-openapi.sh
    pnpm api:generate
    git diff --exit-code openapi.json packages/api-client/src/
```

If this step fails, the developer forgot to run `export-openapi.sh` + `api:generate` before committing.

---

## Anti-Patterns

| Don't | Do instead |
|---|---|
| Hand-write types in `packages/api-client/src/` | Add/change the Pydantic schema in the backend, then regenerate |
| Import `@findog/api-client` from the backend | The backend owns the contract; it never consumes its own client |
| Commit `openapi.json` without regenerating the client | Always run `pnpm api:generate` after exporting the schema |
| Commit generated files without `openapi.json` | Schema and client travel together in one atomic commit |
| Edit generated files to work around a backend bug | Fix the backend, regenerate |
| Use the raw axios instance directly in components | Use the generated React Query hooks from `endpoints/` |
