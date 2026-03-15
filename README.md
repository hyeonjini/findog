# findog

FinDog 프로젝트 초기 부트스트랩 저장소입니다.

## Quick Start
1. `bash scripts/bootstrap.sh`
2. `cp .env.example .env` (bootstrap에서 자동 생성됨)
3. `docker compose -f docker/compose.yml -f docker/compose.override.yml up --build`

## Repo Layout
- `packages/backend`: FastAPI backend skeleton
- `packages/frontend`: Next.js frontend skeleton
- `packages/chrome-extension`: Manifest V3 extension skeleton
- `packages/api-client`: generated TS client placeholder
- `db/migrations`: SQL migration files
- `docs`: architecture/ADR/troubleshooting
