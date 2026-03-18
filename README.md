# FinDog

상품 가격 추적 웹 앱. 사용자가 저장한 상품의 최저가를 검색하고, 재입고 알림을 보내며, 가격 추이를 대시보드에서 확인할 수 있다.

## Current State

- **Backend**: FastAPI + Clean Architecture. Auth (register/login/refresh/logout) + tracked-product CRUD (create/update/archive/restore/list/detail/refresh) 구현 완료. 14개 테스트 파일.
- **Frontend**: Next.js App Router. Auth forms + product management dashboard (list/detail/create/update/archive). Orval-generated API client 연동.
- **API Client**: Orval 생성 TypeScript client. React Query hooks + Zod schemas + MSW mocks + custom axios mutator.
- **Chrome Extension**: MV3 skeleton. 미구현.

## Quick Start

```bash
bash scripts/bootstrap.sh
cp .env.example .env
bash scripts/run.sh
```

## Repo Layout

- `packages/backend`: FastAPI 서버 (auth + product CRUD, Clean Architecture)
- `packages/frontend`: Next.js 웹 클라이언트 (auth + product dashboard)
- `packages/chrome-extension`: Manifest V3 extension (skeleton)
- `packages/api-client`: Orval-generated TypeScript client
- `db/migrations`: SQL migration files (V001-V003 applied)
- `docs`: architecture/ADR/conventions/troubleshooting

## Default Delivery Loop

1. Branch from `develop` with `feature/<scope>-<short-desc>`.
2. Implement and open a PR targeting `develop`.
3. Address user, human, and Codex review comments on the same PR branch until merge.
4. After merge into `develop`, refresh the running Docker stack with `bash scripts/run.sh`.
