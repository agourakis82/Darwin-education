# Medical content overrides

This folder allows adding/patching medical content **without editing** the `darwin-MFC` submodule.

It is consumed by `scripts/import_medical_content.ts` during the Supabase sync.

## Structure

- `medical-content/overrides/diseases/*.json`
- `medical-content/overrides/medications/*.json`
- Drafts (not imported): `medical-content/overrides/**/_drafts/*.json`

Each JSON file must contain at least an `id` (string). The importer will:

- deep-merge the JSON into the matching Darwin-MFC entry (by `id`), and
- insert it as a new entry if that `id` does not exist in Darwin-MFC.

## Evidence policy (high stakes)

- Every clinical claim should have section-level citations (see existing payload shapes).
- Citation `refId`s must resolve via:
  - `darwin-MFC/lib/data/references.ts`, or
  - `apps/web/lib/darwinMfc/local-references.ts` (preferred for missing refs).
- Avoid unreliable sources (blogs, social media, unverified pages). Prefer societies/consensus, PubMed/DOI, and official `.gov.br` sources when applicable.

## Quick template (disease)

```json
{
  "id": "rinite-alergica",
  "fullContent": {
    "epidemiologia": {
      "prevalencia": "…",
      "fatoresRisco": ["…"],
      "citations": [{ "refId": "…" }]
    }
  },
  "lastUpdate": "2026-02"
}
```
