# Cross-Package Coding Conventions

Applies to every package: `backend`, `frontend`, `chrome-extension`, `api-client`, `db`.

---

## 1. Commit Messages

Format: [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <short imperative summary>

[optional body — explains WHY, not what]

[optional footer: BREAKING CHANGE / closes #issue]
```

### Allowed Types

| Type | When to use |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `test` | Adding or correcting tests |
| `docs` | Documentation only |
| `chore` | Tooling, deps, config (no production code) |
| `perf` | Performance improvement |
| `revert` | Reverting a previous commit |

### Allowed Scopes

`backend` · `frontend` · `extension` · `api-client` · `db` · `ci` · `docs` · `infra`

Use the scope that owns the change. If a commit touches multiple scopes, split it into separate commits.

### Rules

- Summary line: imperative mood, lowercase, no trailing period, max 72 chars.
- Body: explain **why** the change was needed, not what files changed.
- `BREAKING CHANGE:` footer required whenever an API contract changes.

**Good:**
```
feat(backend): add product restock notification endpoint

Polling alone was insufficient for time-sensitive restock events.
This endpoint lets the scheduler push notifications without polling.
```

**Bad:**
```
Updated user service and fixed some stuff
```

---

## 2. Branch Naming

Pattern: `<type>/<scope>-<short-kebab-desc>`

- Always branch from `develop`.
- Max 50 characters total.
- Use the same type vocabulary as commit types.

```
feature/backend-restock-notification
fix/frontend-price-chart-overflow
docs/api-client-generation-guide
chore/ci-add-staleness-check
```

---

## 3. Pull Request Rules

### Single Purpose

One PR = one logical change. Don't mix a feature with a refactor or a bug fix with a dependency upgrade. If you find yourself writing "also" in the PR title, split the PR.

### Size Limit

Max **400 lines changed** per PR, excluding:
- Generated files (`packages/api-client/src/endpoints/`, `src/schemas/`, `src/mocks/`)
- DB migration files (`db/migrations/*.sql`)
- Lock files

Large PRs must be broken into a stack of smaller ones.

### PR Template

```markdown
## Type
<!-- feat / fix / refactor / test / docs / chore / perf -->

## Contract Impact
<!-- Does this change the OpenAPI schema? Yes / No -->
<!-- If yes: openapi.json and api-client regenerated in this PR? Yes / No -->

## Testing
<!-- What was tested and how -->

## Checklist
- [ ] Self-reviewed diff
- [ ] CI is green
- [ ] No debug statements or commented-out code
- [ ] ADR written if required (see §5)
```

---

## 4. Code Review Checklist

### Author (before requesting review)

- [ ] Read your own diff top to bottom.
- [ ] CI passes (lint, type-check, tests).
- [ ] No `console.log`, `print()`, `breakpoint()`, or `TODO` left in production paths.
- [ ] If the OpenAPI schema changed: `openapi.json` and regenerated client are in the same commit.
- [ ] If a new dependency was added: justified in the PR description.

### Reviewer

- [ ] **Correctness** — does the logic match the stated intent?
- [ ] **Architecture rules** — no layer violations (see `backend.md`), no Radix primitives used directly in frontend, no direct API calls from extension content scripts.
- [ ] **API contract** — if the schema changed, is the client regenerated atomically?
- [ ] **Tests** — new behavior has test coverage; edge cases and error paths are covered.
- [ ] **Security** — no secrets in code, no unvalidated user input reaching the DB, auth checks present on protected endpoints.

---

## 5. When to Write an ADR

Create a new file in `docs/adr/` whenever:

- A **new project-wide dependency** is introduced (e.g. a new ORM, state manager, or test framework).
- **Contract ownership changes** (e.g. moving from hand-written types to generated client).
- The **test strategy changes** at a package level (e.g. switching from Jest to Vitest, adding E2E coverage).
- A **cross-cutting architectural decision** is made that future contributors need to understand.

ADR filename: `NNN-short-kebab-title.md` (e.g. `004-use-orval-for-api-client-generation.md`).

---

## 6. Language-Specific Style

### Python (backend)

- Formatter: `ruff format` (Black-compatible, 88-char line length).
- Linter: `ruff check`. All warnings must be resolved before merge.
- Type hints are **mandatory** on every function signature (parameters and return type).
- Naming: `snake_case` for files, functions, variables; `PascalCase` for classes.
- No `# type: ignore` without an inline explanation.
- No bare `except:` — catch specific exception types.

Full style details live in `docs/architecture/backend.md §4`.

### TypeScript (frontend, extension, api-client)

- Linter: ESLint with the project config. Zero warnings on merge.
- Formatter: Prettier (config at repo root).
- Naming: `PascalCase` for React components and types; `camelCase` for variables and functions; `SCREAMING_SNAKE_CASE` for module-level constants.
- `any` is banned. Use `unknown` and narrow, or define a proper type.
- Prefer explicit return types on exported functions.
- No Radix primitives imported directly in `packages/frontend` — use `design-system` wrappers only.

Full style details live in `docs/architecture/frontend.md`.
