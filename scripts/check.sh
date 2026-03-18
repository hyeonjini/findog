#!/usr/bin/env bash
set -euo pipefail

echo "[check] verifying required files"

test -f AGENTS.md
test -f .env.example
test -f docker/compose.yml
test -f scripts/run.sh
test -f scripts/remove.sh
test -f scripts/redeploy.sh

echo "[check] basic structure ok"
