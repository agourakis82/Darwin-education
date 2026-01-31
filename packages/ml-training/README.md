# ML Training

This package contains offline training utilities for Darwin Education analytics models.

## Setup

```bash
cd packages/ml-training
poetry install
```

## Training

```bash
bash scripts/train_all_models.sh
```

## Environment

Set these variables before running training jobs:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Outputs (models, reports) should be written to `packages/ml-training/artifacts/`.
