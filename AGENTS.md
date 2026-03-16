# PROJECT OVERVIEW
Project Name: FinDog
Services provided:
1) Users install the Chrome Extension and log in
2) On any shopping page they like, users click the Chrome Extension icon and press the save button
- Like adding a bookmark
- Similar to Evernote web clipper
3) The following core features are performed
- Core Feature 1: Search for the user-saved product across pre-configured E-Commerce platforms and find the lowest price
- Core Feature 2: If a user-saved product is out of stock, periodically check and send an email notification when it is restocked
*Core features are not yet implemented; they will be powered by LLM in the future, evolved incrementally, and require a well-defined development strategy*
4) Users can view their saved product list and price trends on the Frontend (price trends are periodically stored in the DB starting from the date the product was added)

**Maturity**: Scaffold — all packages are skeleton only (~41 lines of code). Architecture docs are comprehensive but implementation has not begun. Only `GET /api/health` endpoint exists.

# GENERAL GUIDELINES
- For new features, always create a new feature branch from the `develop` branch
- When merged into `develop`, refresh the development Docker environment using the scripts in `scripts/`

## Session-Persistent Delivery Workflow
Use this workflow in every session, including new sessions, unless the user explicitly requests an exception.

1. Start from `develop` and create a `feature/*` branch for new feature work.
2. Implement on that branch and open a PR targeting `develop`.
3. Keep review follow-up commits on the same PR branch until the PR is merged.
4. When the user or Codex provides review comments, evaluate each comment, fix valid issues, verify again, and push updates to the same branch.
5. Reply in the review thread using the repository review convention after each addressed item.
6. Repeat the review-response-push loop until the PR is merged into `develop`.
7. After merge into `develop`, refresh the Docker environment immediately so containers reflect the latest code and remain running.

# ARCHITECTURE OVERVIEW
## PACKAGE STRUCTURE
```
db: PostgreSQL SQL files with mandatory versioning
docker: Docker and docker-compose configuration files
docs: Collection of rules and conventions to follow
packages/backend: Server-side code for the project
packages/chrome-extension: Chrome Extension code for the project
packages/frontend: Web client code for the project
scripts: Docker image build and publish command scripts
k8s: Reserved for future use, not used at this stage
```
# TECHNOLOGY STACK
- Frontend: React + TypeScript + Next.js + Zod (validate) + Storybook UI Library + Radix + Jest (unit) + Playwright(E2E) + Zustand
- Backend: Python + FastAPI + Pydentic + SQLModel + PyTest + Swagger (with UI)

## Key Architectural Patterns
1. DI
2. Clean Architecture: Application (UseCase) + Domain (Repository, Entity, Aggregate Root, Domain...) + Infrastructure + Presentational
3. Domain Driven: Internal event bus for decupled communication
4. Design System: Reusable components and design tokens are centralized in `packages/frontend/design-system`

# DOCUMENTATION INDEX

## Architecture (per-package, comprehensive)
- Backend (Clean Architecture + DDD, FastAPI, testing): [`docs/architecture/backend.md`](docs/architecture/backend.md)
- Frontend (Next.js, Radix, Zustand, Zod, Storybook, testing): [`docs/architecture/frontend.md`](docs/architecture/frontend.md)
- Chrome Extension (MV3, messaging, security, CRXJS, testing): [`docs/architecture/chrome-extension.md`](docs/architecture/chrome-extension.md)
- API Client (orval generation, OpenAPI workflow, CI staleness): [`docs/architecture/api-client.md`](docs/architecture/api-client.md)

## Conventions (cross-package)
- Coding (commit messages, branch naming, PR rules, code review): [`docs/conventions/coding.md`](docs/conventions/coding.md)
- Testing (test taxonomy, per-package strategy, contract testing, CI pipeline): [`docs/conventions/testing.md`](docs/conventions/testing.md)
- Code Review Workflow (Codex + Human review handling): [`docs/conventions/code-review-workflow.md`](docs/conventions/code-review-workflow.md)
- Deployment Workflow (post-merge compose flow): [`docs/conventions/deployment.md`](docs/conventions/deployment.md)

## Decisions & Reference
- ADR 0001 — Service Boundaries: [`docs/adr/0001-boundaries.md`](docs/adr/0001-boundaries.md)
- UI Design Notes: [`docs/ui/README.md`](docs/ui/README.md)
- Troubleshooting: [`docs/troubleshooting.md`](docs/troubleshooting.md)

# WHERE TO LOOK
- Backend API endpoint additions: `packages/backend/app/presentation/http/routers/*`
- Backend business logic: `packages/backend/app/application/*` + `packages/backend/app/domain/*`
- Authentication / JWT: `packages/backend/app/presentation/http/routers/auth.py` + `packages/backend/app/infrastructure/security/*`
- Backend new module additions: `packages/backend/app/{domain,application,infrastructure,presentation}/<module>`
- Backend shared components: `packages/backend/app/shared/*`
- Server architecture reference: `docs/architecture/backend.md` + `docs/adr/*`
- Frontend architecture reference: `docs/architecture/frontend.md`
- Frontend feature additions: `packages/frontend/src/features/*`
- Frontend page additions: `packages/frontend/src/app/*`
- Frontend shared component additions: `packages/frontend/src/components/*`
- Frontend API client: `packages/api-client/*` + `packages/frontend/src/lib/api/*`
- Frontend design system: `packages/frontend/design-system/*`
- Frontend screen design: `docs/ui/*` + Storybook stories (`*.stories.tsx`)
- Chrome Extension architecture reference: `packages/chrome-extension/src/{popup,content,background}/*`
- Troubleshooting: `docs/troubleshooting.md`

# ANTI PATTERN
- Do NOT import FastAPI/SQLModel/Pydantic in the Domain Layer
- Do NOT return `table=True` models directly as API response models
- Do NOT use Radix primitives directly in the frontend (only through `design-system` wrappers)
- Do NOT call backend API directly from Extension content scripts (must go through background service worker)
- Do NOT modify DB schema manually (all changes must go through `db/migrations/*.sql`)
- Do NOT implement features before documenting shared policies/rules

# CONVENTIONS (ENFORCED BY CONFIG)
- `.editorconfig`: UTF-8, LF, indent 2 (JS/TS/YAML/JSON/SQL), indent 4 (Python), trim trailing whitespace (except .md)
- `tsconfig.base.json`: `strict: true`, `target: ES2022`, `moduleResolution: Bundler`, path alias `@findog/api-client/*`
- `pyproject.toml`: pytest discovers from `tests/` with `pythonpath = ["."]`
- `pnpm-workspace.yaml`: JS packages = `frontend`, `chrome-extension`, `api-client` (backend excluded — Python)
- Package manager: `pnpm@10.0.0` (pinned in root `package.json`)

# TOOLING GAPS (NOT YET CREATED)
- CI/CD: `.github/workflows/` does not exist (pipeline design documented in `docs/conventions/testing.md`)
- Dockerfiles: containers use inline build commands in `compose.yml`
- Linter/formatter configs: `.eslintrc`, `.prettierrc`, `ruff.toml` not created
- `next.config.*` for frontend, `vite.config.ts` / `manifest.config.ts` (CRXJS) for extension
- `scripts/export-openapi.sh` referenced in docs but does not exist
- `scripts/migrate.sh` is a placeholder — no migration runner (Alembic/Flyway) integrated
- `scripts/bootstrap.sh` uses `npm install` despite `pnpm` being declared package manager
- Env validation modules (`src/lib/env.ts`, Pydantic Settings) not implemented

# COMMANDS
- Local bootstrap: `bash scripts/bootstrap.sh`
- Run backend: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`
- Run frontend: `npm run dev --workspace packages/frontend -- --port 8002`
- Extension dev build: `npm run dev --workspace packages/chrome-extension`
- Start all containers (dev): `bash scripts/run.sh`
- Stop all containers: `bash scripts/remove.sh`
- Apply DB migrations: `bash scripts/migrate.sh`
- Quality check: `bash scripts/check.sh`

# GIT
## Strategy for branch
- Base branch: `develop`
- Feature development: `feature/<scope>-<short-desc>`
- Bug fixes: `fix/<scope>-<short-desc>`
- Documentation: `docs/<scope>-<short-desc>`
- Hotfix (exception): `hotfix/<scope>-<short-desc>`

- PR Rules
  - `feature/*`, `fix/*`, `docs/*` -> PR only to `develop`
  - Each PR must contain a single purpose (no mixing features/bugs/docs)
  - Minimum 1 review before merge

- Commit Rules
  - Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
  - Commit messages should prioritize "why" over "what"

# WORKFLOW
1) For new features, always create a `feature/*` branch from the `develop` branch.
2) After feature development, create a PR to the `develop` branch.
3) Review comments from the user, Codex, or human reviewers must be handled on the same PR branch until merge.
4) For each valid review item, fix the code, verify again, push, and reply in the review thread using the documented convention.
5) Repeat the review cycle until the PR is merged into `develop`.
6) After merge into `develop`, refresh the Docker environment with the scripts in `scripts/` so the latest code is reflected while containers remain running.
