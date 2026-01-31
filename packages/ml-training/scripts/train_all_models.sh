#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

if ! command -v poetry >/dev/null 2>&1; then
  echo "Poetry is required. Install with: pipx install poetry" >&2
  exit 1
fi

if [[ ! -f "src/darwin_ml/models/pass_predictor.py" ]]; then
  echo "Training scripts not implemented yet. Skipping model training."
  exit 0
fi

poetry install --no-interaction --no-ansi

poetry run python -m darwin_ml.models.pass_predictor
poetry run python -m darwin_ml.models.bkt
poetry run python -m darwin_ml.models.recommender
poetry run python -m darwin_ml.models.irt_calibration
