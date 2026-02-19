# Reproducibility Capsule

## Environment Requirements (Observed)

- Node engine requirement: `package.json:35-35` (expected `>=20`) and `package.json:36-36`
- Package manager lock: `package.json:5-5`
- Python package for ML training present: `packages/ml-training/pyproject.toml:1-1`
- Docker Compose available in repo: `docker-compose.yml:3-3`

## Captured Local Tool Versions

- Python: `Python 3.12.3`
- Pip freeze: see `_paperpack/env/pip_freeze.txt`
- Node: `v20.20.0`
- npm list: see `_paperpack/env/npm_list.txt`
- pnpm list: see `_paperpack/env/pnpm_list.txt`
- yarn list: see `_paperpack/env/yarn_list.txt`
- rustc: `rustc 1.93.0 (254b59607 2026-01-19)`
- cargo: `cargo 1.93.0 (083ac5135 2025-12-15)`
- docker: `Client: Docker Engine - Community`

## Determinism and Seed Notes

- Non-deterministic ID generation observed (`Date.now()` and `Math.random()`): `apps/web/lib/qgen/services/qgen-generation-service.ts:580-580`
- Explicit global random seed configuration for generation/evaluation pipelines: NOT FOUND
- Deterministic replay contract for LLM calls: NOT FOUND
- GPU requirement in repo docs/config: NOT FOUND

## Reproduction Commands

```bash
bash _paperpack/scripts/run_all.sh
python3 _paperpack/scripts/compute_safety_metrics.py --out-dir _paperpack
# with real labels:
python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack
```
