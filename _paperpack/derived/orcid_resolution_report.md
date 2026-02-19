# ORCID Resolution Report (Canonical ORCID for This Project)

Date: 2026-02-10

## Goal

Choose the single canonical ORCID for **Demetrios Chiuratto Agourakis** for this repository and preprint package, based on evidence (no guessing), and propagate it consistently.

Public sources were reported to associate two ORCID ids with this author:

- candidate A: `0000-0002-8596-5097`
- candidate B: `0009-0001-8671-8878`

## Evidence Collected

### 1) Zenodo versioned record (preferred source-of-truth for this release)

- Versioned DOI: https://doi.org/10.5281/zenodo.18592149
- Raw HTML saved: `_paperpack/derived/zenodo_doi_version.html`
- Zenodo record JSON saved: `_paperpack/derived/zenodo_record_18592149.json`

In `_paperpack/derived/zenodo_record_18592149.json`, the creator metadata includes:

- `creators[0].orcid` = `0009-0001-8671-8878`

This ties the release DOI directly to ORCID `0009-0001-8671-8878` in machine-readable form.

### 2) ORCID public endpoint corroboration (name match)

Fetched ORCID public JSON endpoints:

- `_paperpack/derived/orcid_0009-0001-8671-8878.json`
- `_paperpack/derived/orcid_0000-0002-8596-5097.json`

Results:

- `0009-0001-8671-8878` resolves and returns:
  - given name: `Demetrios`
  - family name: `Chiuratto Agourakis`
- `0000-0002-8596-5097` returned `404` (no public record via endpoint at time of check).

## Decision

**Canonical ORCID for this project:** `0009-0001-8671-8878` (https://orcid.org/0009-0001-8671-8878)

Rationale:

1. It is explicitly embedded as the creator ORCID in the Zenodo record for the **versioned DOI** of this release.
2. It resolves on the ORCID public endpoint and matches the author name.
3. The alternate reported candidate did not resolve via the same public endpoint at the time of the check.

## Repository Updates

The canonical ORCID `0009-0001-8671-8878` is now used consistently in:

- `CITATION.cff`
- `_paperpack/preprint/preprint.md`
- `_paperpack/preprint/cover_CE_AI.md`
- `_paperpack/preprint/cover_JMIR_MedEd.md`
- `.zenodo.json`

Other ORCID candidates are not kept in user-facing metadata.
