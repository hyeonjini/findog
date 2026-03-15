#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[redeploy] refreshing docker stack"
bash "$ROOT_DIR/scripts/remove.sh"
bash "$ROOT_DIR/scripts/run.sh"
