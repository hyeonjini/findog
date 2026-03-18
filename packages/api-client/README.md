# API Client

Backend OpenAPI spec에서 Orval로 생성된 TypeScript client.

## Stack

React Query hooks + Zod schemas + MSW mocks + custom axios mutator

## Structure

```text
src/
  endpoints/           # Generated react-query hooks (auth, tracked-products, users, health)
  schemas/             # Generated Zod schemas
  mocks/               # Generated MSW handlers + faker data
  mutator/
    axios-instance.ts  # Hand-written: token refresh queue + storage
  index.ts             # Package barrel export
```

## Commands

```bash
pnpm --filter api-client generate   # Regenerate from /openapi.json
```

## Rule

Generated files (`endpoints/`, `schemas/`, `mocks/`) contain `Do not edit manually` headers. Do NOT edit them. Regenerate instead.
