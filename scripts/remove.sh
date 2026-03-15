#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  echo "[remove] created .env from .env.example"
fi

echo "[remove] stopping and removing all services"
docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/docker/compose.yml" -f "$ROOT_DIR/docker/compose.override.yml" down -v
