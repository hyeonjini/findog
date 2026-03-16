#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/packages/backend"
export OPENAPI_OUTPUT="$ROOT_DIR/openapi.json"
export PYTHONPATH="$ROOT_DIR/packages/backend${PYTHONPATH:+:$PYTHONPATH}"

python3 - <<'PY'
from __future__ import annotations

import json
import os
from pathlib import Path

from app.main import app

output_path = Path(os.environ["OPENAPI_OUTPUT"])
output_path.write_text(json.dumps(app.openapi(), indent=2), encoding="utf-8")

if not output_path.is_file():
    raise RuntimeError(f"OpenAPI file was not created: {output_path}")
PY
