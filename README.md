# findog

FinDog 프로젝트 초기 부트스트랩 저장소입니다.

## Quick Start
1. `bash scripts/bootstrap.sh`
2. `cp .env.example .env` (bootstrap에서 자동 생성됨)
3. `docker compose -f docker/compose.yml -f docker/compose.override.yml up --build`

## Default Delivery Loop
1. Branch from `develop` with `feature/<scope>-<short-desc>`.
2. Implement and open a PR targeting `develop`.
3. Address user, human, and Codex review comments on the same PR branch until merge.
4. After merge into `develop`, refresh the running Docker stack with `bash scripts/redeploy.sh`.

## Repo Layout
- `packages/backend`: FastAPI backend skeleton
- `packages/frontend`: Next.js frontend skeleton
- `packages/chrome-extension`: Manifest V3 extension skeleton
- `packages/api-client`: generated TS client placeholder
- `db/migrations`: SQL migration files
- `docs`: architecture/ADR/troubleshooting
