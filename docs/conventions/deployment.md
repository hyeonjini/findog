# Merge to Deploy Workflow

This document defines how to keep the Docker Compose environment in sync after a PR is merged into `develop`.

## Overview

When `develop` is updated by merge, update local `develop` and rerun the compose scripts from repository root so the running containers reflect the latest merged code.

## Procedure

- Update local `develop` first:

  ```bash
  git checkout develop
  git pull --ff-only origin develop
  ```

- Rebuild and refresh backend/frontend/postgres with the standard post-merge entrypoint:

  ```bash
  bash scripts/redeploy.sh
  ```

- Confirm containers are running:

  ```bash
  docker compose -f docker/compose.yml -f docker/compose.override.yml ps
  ```

- Validate services are available:

  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/docs
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8002
  ```

## Why this works

- `scripts/run.sh` ensures `.env` exists (created from `.env.example` when missing).
- `scripts/redeploy.sh` gives one standard post-merge rebuild-and-refresh entrypoint without deleting local Docker volumes.
- Compose services use `restart: unless-stopped`, so containers recover automatically unless they are intentionally stopped.
- `docker compose` runs Postgres init scripts from `db/migrations` on first DB startup.
- Backend swagger is exposed at `http://localhost:8001/docs`.
- Frontend is available at `http://localhost:8002`.

## When to run after merge

- Run immediately after every merge into `develop`.
- If dependencies, ports, services, or environment variables changed, treat the redeploy as mandatory before considering the environment healthy.
- The default expectation is that the Docker stack remains running after the merge workflow completes.

## Troubleshooting

- **Port conflicts**: stop local processes using 5432, 8001, or 8002 before running.
- **Stale DB state**: run `bash scripts/remove.sh` to reset volumes, then rerun `bash scripts/redeploy.sh`.
- **Service startup failures**: rerun `bash scripts/check.sh` and inspect compose logs with

  ```bash
  docker compose -f docker/compose.yml -f docker/compose.override.yml logs
  ```

## Idempotency expectations

- Running `bash scripts/run.sh` without `.env` should create `.env` automatically and still boot services.
- Running `bash scripts/remove.sh` repeatedly should safely handle an already stopped stack.
- Running `bash scripts/redeploy.sh` repeatedly should rebuild and refresh the stack into the latest local state without removing local volumes.
