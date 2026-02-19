# AGENTS.md — Preprint Evidence Workflow

This repository includes a reproducible preprint package under `_paperpack/`.
This document defines conventions for manuscript-safe edits and evidence integrity.

## 1) Naming Conventions (Preprint Package)

- Manuscript source:
  - `_paperpack/preprint/preprint.md`
- Cover letters:
  - `_paperpack/preprint/cover_CE_AI.md`
  - `_paperpack/preprint/cover_JMIR_MedEd.md`
- Submission checklist:
  - `_paperpack/preprint/submission_checklist.md`
- Versioned change notes:
  - `_paperpack/preprint/CHANGELOG.md`
- Derived runtime artifacts:
  - `_paperpack/derived/darwin_mfc_runtime_counts.json`
  - `_paperpack/derived/darwin_mfc_duplicates.csv`
  - `_paperpack/derived/darwin_mfc_runtime_log.txt`
- Claims audit (current cycle):
  - `_paperpack/preprint/claim_audit_v0.3.md`

For new manuscript-cycle artifacts, use suffixes with explicit version tags (example: `*_v0.3.md`).

## 2) Evidence Citation Rules in Manuscript

All numerical claims must follow one of four statuses:

1. `repo-anchored`
2. `INEP-anchored`
3. `NOT YET COMPUTED`
4. `NOT FOUND`

### 2.1 Repo-Anchored Claims

- Use exact repository file anchors in the form:
  - ``relative/path/file.ext:start-end``
- Anchors must point to committed files or derived artifacts in `_paperpack/derived/`.
- Prefer runtime artifacts over static estimates when both exist.

### 2.2 INEP-Anchored Claims

When claims reference public ENAMED provenance/governance:

- Cite only official INEP URLs in References:
  - Microdados ENAMED portal (19/01/2026)
  - INEP publication news (20/01/2026)
  - Nota Técnica nº 19/2025 (Angoff + TRI)
  - INEP microdata governance/LGPD page

If details are not explicitly present in repo or those official pages, mark `NOT FOUND`.

## 3) Reproducibility Commands

Run from repository root:

```bash
# Full evidence pack
bash _paperpack/scripts/run_all.sh

# Runtime-verifiable Darwin-MFC counts
bash _paperpack/scripts/run_darwin_mfc_runtime_counts.sh

# Pack verification only
bash _paperpack/scripts/verify_pack.sh
```

Record command, timestamp, and summary outputs in `_paperpack/benchmarks.md` or dedicated log files.

## 4) Do-Not-Do List

- Do not overclaim educational efficacy or clinical decision performance.
- Do not include unanchored numerical claims.
- Do not paste full scripts into the manuscript body.
- Do not cite hidden or non-public sources for key claims.
- Do not use branch names in formal data/code availability statements.
- Do not hardcode stale count targets (example: old 368/690 targets) as current truth.
- Do not expose secrets, tokens, or private credentials in text, logs, or appendices.

## 5) v0.3 Priority Checks

- Runtime counts must come from `_paperpack/derived/darwin_mfc_runtime_counts.json`.
- Manuscript must explain static vs runtime counting differences.
- Safety claims with explicit numbers must be code-anchored; otherwise rewrite generically.
- Any unavailable measured metric must be labeled `NOT YET COMPUTED`.
