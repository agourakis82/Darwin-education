# Preprint-Ready Evidence Pack

This folder contains the reproducible evidence pack generated from repository-observed implementation only.

## What Was Generated

- Repository inventory and architecture map
- Data/calibration artifact audit plus extracted/inferred schemas
- Safety pipeline evidence and safety metric computation template
- Reproducibility capsule with environment snapshots
- Benchmark probe (best effort) and fallback mock benchmark stub
- Preprint manuscript skeleton (Markdown + Mermaid + table templates)

## Quick Index

- `repo_inventory.md`
- `architecture_map.md`
- `data_audit.md`
- `safety_pipeline.md`
- `safety_metrics_template.md`
- `repro_capsule.md`
- `benchmarks.md`
- `keyword_hits.csv` and `keyword_hits.json`
- `schemas/`
- `env/`
- `preprint/`
- `run_manifest.json`

## Reproducible Commands

```bash
# Full rerun
bash _paperpack/scripts/run_all.sh

# Recompute safety metrics template
python3 _paperpack/scripts/compute_safety_metrics.py --out-dir _paperpack

# Compute real safety metrics from labeled review data
python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack
```

## Executive Summary

### What was found
- Psychometric/adaptive stack including MIRT 5D, DIF, and spaced repetition implementations (`packages/shared/src/calculators/mirt.ts:2-2`, `packages/shared/src/calculators/dif.ts:2-2`, `packages/shared/src/calculators/fsrs.ts:2-2`).
- Generation + validation + review workflow with thresholds and human-in-the-loop endpoints (`apps/web/lib/qgen/services/qgen-validation-service.ts:35-35`, `apps/web/app/api/qgen/review/route.ts:134-134`).
- Hallucination/citation verification pipeline with audit persistence (`apps/web/lib/theory-gen/services/citation-verification-service.ts:182-182`, `infrastructure/supabase/migrations/007_theory_generation_system.sql:165-165`).
- ENAMED ETL references and local microdata artifacts are present (`infrastructure/supabase/seed/enamed-2025-etl/README.md:1-1`, `microdados_enamed_2025_19-01-26/DADOS/microdados2025_parametros_itens.txt:1-1`).

### What is missing
- Runtime-verifiable installed package counts for Darwin-MFC `368/690`: NOT FOUND (documentation claims exist, runtime adapters include fallback/stub mode).
- Full benchmark execution status: `RUN_OK`; blockers: NOT FOUND.
- Labeled expert-review CSV for computing real sensitivity/specificity metrics: NOT FOUND.
- Deterministic seed contract for generation pipelines: NOT FOUND.

### Top 10 files for manuscript writing
1. `packages/shared/src/calculators/mirt.ts`
2. `packages/shared/src/calculators/dif.ts`
3. `packages/shared/src/calculators/fsrs.ts`
4. `packages/shared/src/calculators/unified-learner-model.ts`
5. `apps/web/lib/qgen/services/qgen-generation-service.ts`
6. `apps/web/lib/qgen/services/qgen-validation-service.ts`
7. `apps/web/lib/theory-gen/services/citation-verification-service.ts`
8. `apps/web/lib/ddl/services/ddl-service.ts`
9. `infrastructure/supabase/seed/enamed-2025-etl/README.md`
10. `infrastructure/supabase/migrations/qgen/001_qgen_core_tables.sql`

### Exact next commands for real metrics
```bash
# 1) Satisfy Node/pnpm prerequisites (if needed)
nvm install 20 && nvm use 20
corepack enable && corepack prepare pnpm@9.0.0 --activate
pnpm install

# 2) Run minimal benchmark probe again
bash _paperpack/scripts/benchmark_probe.sh

# 3) Run shared tests for latency/failure proxies
pnpm --filter @darwin-education/shared test

# 4) Compute safety metrics from real review labels
python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack
```
