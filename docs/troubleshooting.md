# Troubleshooting

## Docker Compose fails to start
1. Verify `.env` file exists (run `bash scripts/bootstrap.sh` to create from `.env.example`)
2. Check for port conflicts on host ports `8001` (backend), `8002` (frontend), `5432` (DB — not exposed by default)
3. Run `docker compose -f docker/compose.yml -f docker/compose.override.yml down -v` then restart

Port mapping summary:
- Backend: host `8001` -> container `8000`
- Frontend: host `8002` -> container `3000`
- DB (PostgreSQL): port `5432`, not exposed to host by default

## Backend import errors
1. Confirm dependencies are installed in `packages/backend` (`pip install -e .`)
2. Verify `PYTHONPATH` and working directory match the package root

## Extension API call failures
1. Check `host_permissions` in `manifest.json` includes the backend URL — the extension has a `manifest.json` with basic MV3 permissions
2. Confirm API calls go through the background service worker, not content scripts
