#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT_DIR/.env" ]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  echo "[bootstrap] created .env from .env.example"
fi

if command -v npm >/dev/null 2>&1; then
  if [ -f "$ROOT_DIR/package.json" ]; then
    npm install --ignore-scripts >/dev/null 2>&1 || true
  fi
fi

echo "[bootstrap] done"
