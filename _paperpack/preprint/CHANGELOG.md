# Preprint Changelog

## v0.3.2 (packaging only) — 2026-02-10

### What changed from v0.3.1

- Added packaging scripts for submission-ready artifact generation:
  - `_paperpack/scripts/build_preprint_pdf.sh`
  - `_paperpack/scripts/build_submission_bundle.sh`
  - `_paperpack/scripts/bundle_gate.sh`
- Added DOI/release traceability refinements in manuscript Data and Code Availability:
  - versioned DOI `10.5281/zenodo.18592149`
  - concept DOI `10.5281/zenodo.18487441`
  - pinned release manifest id `v0.3.1_release_2026-02-10T09-16-37Z`
- Generated `preprint.pdf` and submission bundle tarball with SHA256 sums.
- No claim, count, threshold, or scientific interpretation changes.

## v0.3.1 (final hardening) — 2026-02-10

### What changed from v0.3

- Confirmed green Darwin-MFC integration test after submodule dependency installation (`npm --prefix darwin-MFC ci`), with passing log at `_paperpack/logs/v0.3.1_test_darwin_mfc.log`.
- Added manuscript integrity CI gate:
  - `_paperpack/scripts/ci_gate.py`
  - `_paperpack/scripts/ci_gate.sh`
- Integrated `ci_gate` as the final step in `_paperpack/scripts/run_all.sh`.
- Added reproducibility note in manuscript documenting prior `fuse.js` resolution failure and preserved logs.

## v0.3 (evidence hardening) — 2026-02-10

### What changed from v0.2

- Replaced legacy static corpus figures with runtime-exported counts:
  - diseases: `raw=252`, `unique=215`
  - medications: `raw=889`, `unique=602`
- Added governance table (raw, unique, duplicate count, duplicate fraction).
- Added explicit method distinction:
  - static file-level ID extraction
  - runtime exported index enumeration
- Reframed `368/690` as historical targets only.
- Removed/rewrote overclaim-prone statements and unsupported numeric claims.
- Added official INEP URL references (portal, news, nota técnica, governance/LGPD page).
- Updated data/code availability text to use commit hash and DOI placeholder (`TBD`) without fabricated identifiers.
- Added compact “Claim → Evidence” appendix table in the manuscript.
- Updated cover letters and submission checklist for evidence-consistent framing.

### Evidence/Process updates

- Added root `AGENTS.md` with manuscript evidence conventions.
- Added claim audit report: `_paperpack/preprint/claim_audit_v0.3.md`.
- Runtime counting artifacts generated under `_paperpack/derived/`.

### Outstanding items

- Re-run full evidence pipeline and capture v0.3 logs.
- Re-run tests and update `_paperpack/benchmarks.md` with command/output/duration.
- Fill author metadata, public repo URL, and final DOI at submission time.
