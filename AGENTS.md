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

# GENERAL GUIDELINES
- For new features, always create a new feature branch from the `develop` branch
- When merged into `develop`, build a Docker image and publish to the development environment using scripts

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

# COMMANDS
- Local bootstrap: `bash scripts/bootstrap.sh`
- Run backend: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Run frontend: `npm run dev --workspace packages/frontend`
- Extension dev build: `npm run dev --workspace packages/chrome-extension`
- Start all containers (dev): `docker compose -f docker/compose.yml -f docker/compose.override.yml up --build`
- Stop all containers: `docker compose -f docker/compose.yml -f docker/compose.override.yml down`
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
3) Review and address the feedback provided by Codex.
4) For items requiring fixes, work on a `fix/*` branch.
5) Merging into `develop` is authorized by the user; upon merge, build a Docker image and publish to the development environment.
