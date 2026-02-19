# Submission Checklist v0.3.2 (Evidence-Hardened + Packaging)

## 1) Manuscript Integrity

- [x] Scope is architecture-first (no educational efficacy claims)
- [x] Scope excludes clinical decision guidance claims
- [x] Numerical claims are either repo-anchored, INEP-anchored, or marked `NOT YET COMPUTED`
- [x] Historical corpus targets (`368/690`) are contextualized as legacy targets only
- [x] Runtime corpus counts are used as current truth (`252/215` diseases, `889/602` medications)
- [x] Static vs runtime counting distinction is explicit
- [x] No scripts pasted inline in manuscript body

## 2) Runtime Corpus Consistency

- [x] Runtime JSON present: `_paperpack/derived/darwin_mfc_runtime_counts.json`
- [x] Duplicates CSV present: `_paperpack/derived/darwin_mfc_duplicates.csv`
- [x] Runtime log present: `_paperpack/derived/darwin_mfc_runtime_log.txt`
- [x] Governance table (raw/unique/duplicate fraction) included in manuscript

Evidence anchors:

- diseases raw/unique: `_paperpack/derived/darwin_mfc_runtime_counts.json:13-14`
- medications raw/unique: `_paperpack/derived/darwin_mfc_runtime_counts.json:562-563`
- historical targets: `_paperpack/derived/darwin_mfc_runtime_counts.json:3777-3781`

## 3) External Provenance (INEP)

- [x] Microdados ENAMED portal URL included (published 19/01/2026)
- [x] INEP publication news URL included (20/01/2026)
- [x] Nota Técnica nº 19/2025 URL included
- [x] INEP microdata governance/LGPD framing URL included
- [x] No external numeric claims beyond official/repo evidence

## 4) Data and Code Availability

- [x] Formal manuscript text uses commit hash, not branch name
- [x] Versioned Zenodo DOI assigned in manuscript (`10.5281/zenodo.18592149`)
- [x] Concept Zenodo DOI assigned in manuscript (`10.5281/zenodo.18487441`)
- [x] Reproduction commands are explicit (`run_all.sh`, runtime counts script)

## 5) Reproducibility Runbook

Primary commands:

```bash
bash _paperpack/scripts/run_all.sh
bash _paperpack/scripts/run_darwin_mfc_runtime_counts.sh
bash _paperpack/scripts/verify_pack.sh
bash _paperpack/scripts/ci_gate.sh
```

Outputs expected:

- `_paperpack/run_manifest.json`
- `_paperpack/logs/verify_pack.log`
- `_paperpack/derived/darwin_mfc_runtime_counts.json`
- `_paperpack/derived/darwin_mfc_duplicates.csv`
- `_paperpack/derived/darwin_mfc_runtime_log.txt`

## 6) Tests and Benchmarks

- [x] Re-run repository tests in this v0.3 cycle
- [x] Record exact command + stdout excerpt + duration in `_paperpack/benchmarks.md`
- [x] Mark unresolved runtime/performance metrics as `NOT YET COMPUTED`

## 7) Final QA Sweep

Required grep terms to eliminate or contextualize:

- `429`, `604`, `368`, `690`
- `proved`, `demonstrated` (for unmeasured outcomes)
- `95% CI across specialties` (unless explicitly anchored)
- `13 domains` (unless explicitly anchored)
- `Pearson r > 0.95` (unless clearly documented target, not fresh measurement)

## 8) Remaining Manual Items Before Submission

- [ ] Author names/ORCIDs completed; affiliations pending
- [x] Final public repository URL
- [x] Zenodo DOI after release deposition
- [ ] Venue-specific formatting polish

## 9) Submission Bundle Packaging (v0.3.2)

- [x] `preprint.pdf` generated from `_paperpack/preprint/preprint.md`
- [x] `submission_bundle/preprint-v0.3.1/` created with required artifacts
- [x] `submission_bundle/preprint-v0.3.1/SHA256SUMS.txt` generated
- [x] `submission_bundle/preprint-v0.3.1.tar.gz` and `.sha256` generated
- [x] `bundle_gate.sh` PASS
