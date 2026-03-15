# Troubleshooting

## Docker Compose fails to start
1. Verify `.env` file exists (run `bash scripts/bootstrap.sh` to create from `.env.example`)
2. Check for port conflicts (`5432`, `8000`, `3000`)
3. Run `docker compose -f docker/compose.yml -f docker/compose.override.yml down -v` then restart

## Backend import errors
1. Confirm dependencies are installed in `packages/backend` (`pip install -e .`)
2. Verify `PYTHONPATH` and working directory match the package root

## Extension API call failures
1. Check `host_permissions` in `manifest.json` includes the backend URL
2. Confirm API calls go through the background service worker, not content scripts
