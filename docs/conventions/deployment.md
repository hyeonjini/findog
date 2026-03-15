# Merge to Deploy Workflow

This document defines how to keep the local Docker Compose environment in sync after a PR is merged into `develop`.

## Overview

When `develop` is updated by merge, run the compose scripts from repository root to start a fresh environment with the latest code.

## Procedure

- Stop existing services (and remove associated volumes):

  ```bash
  bash scripts/remove.sh
  ```

- Start backend/frontend/postgres with auto migration bootstrap:

  ```bash
  bash scripts/run.sh
  ```

- Validate services are available:

  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/docs
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8002
  ```

## Why this works

- `scripts/run.sh` ensures `.env` exists (created from `.env.example` when missing).
- `docker compose` runs Postgres init scripts from `db/migrations` on first DB startup.
- Backend swagger is exposed at `http://localhost:8001/docs`.
- Frontend is available at `http://localhost:8002`.

## When to run after merge

- Run immediately after merge into `develop` if service behavior changed, dependencies changed, or environment variables changed.
- If no behavioral change landed, an existing running stack can be kept, but a restart is required when ports/services were modified.

## Troubleshooting

- **Port conflicts**: stop local processes using 5432, 8001, or 8002 before running.
- **Stale DB state**: run `bash scripts/remove.sh` to reset volumes, then rerun `bash scripts/run.sh`.
- **Service startup failures**: rerun `bash scripts/check.sh` and inspect compose logs with

  ```bash
  docker compose -f docker/compose.yml -f docker/compose.override.yml logs
  ```

## Idempotency expectations

- Running `bash scripts/run.sh` without `.env` should create `.env` automatically and still boot services.
- Running `bash scripts/remove.sh` repeatedly should safely handle an already stopped stack.
