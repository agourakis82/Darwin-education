# Claim Audit v0.3 (Final)

Scope audited:

- `_paperpack/preprint/preprint.md`
- `_paperpack/preprint/cover_CE_AI.md`
- `_paperpack/preprint/cover_JMIR_MedEd.md`
- `_paperpack/preprint/submission_checklist.md`

Audit date: 2026-02-10

## Classification Legend

- `repo-anchored`: verifiable in repository files with `path:line-range`
- `INEP-anchored`: verifiable in official INEP URLs
- `NOT YET COMPUTED`: computation protocol exists but value is not re-executed for this cycle
- `NOT FOUND`: unsupported by repository or official references

## Final Claim Inventory

| Claim | Location | Classification | Evidence |
|---|---|---|---|
| Diseases runtime counts: `raw=252`, `unique=215` | `_paperpack/preprint/preprint.md:19`, `_paperpack/preprint/preprint.md:85` | `repo-anchored` | `_paperpack/derived/darwin_mfc_runtime_counts.json:13-14` |
| Medications runtime counts: `raw=889`, `unique=602` | `_paperpack/preprint/preprint.md:19`, `_paperpack/preprint/preprint.md:86` | `repo-anchored` | `_paperpack/derived/darwin_mfc_runtime_counts.json:562-563` |
| Duplicate fractions: diseases `14.68%`, meds `32.28%` | `_paperpack/preprint/preprint.md:19`, `_paperpack/preprint/preprint.md:85-86` | `repo-anchored` | Derived from runtime raw/unique values at `_paperpack/derived/darwin_mfc_runtime_counts.json:13-14`, `_paperpack/derived/darwin_mfc_runtime_counts.json:562-563` |
| Historical targets `368/690` are legacy-only | `_paperpack/preprint/preprint.md:19`, `_paperpack/preprint/preprint.md:101` | `repo-anchored` | `_paperpack/derived/darwin_mfc_runtime_counts.json:3777-3781` |
| ETL-documented values (`100` total items, `90` valid, `~900K` participants) | `_paperpack/preprint/preprint.md:70-73` | `repo-anchored` | `infrastructure/supabase/seed/enamed-2025-etl/README.md:17-20` |
| ETL valid/excluded split (`90` valid, `3` excluded) | `_paperpack/preprint/preprint.md:73` | `repo-anchored` | `infrastructure/supabase/seed/enamed-2025-etl/README.md:111-113` |
| QGen thresholds `0.85/0.70/0.50` | `_paperpack/preprint/preprint.md:111-113` | `repo-anchored` | `apps/web/lib/qgen/services/qgen-validation-service.ts:35-37` |
| Citation verification cache TTL `7 days` | `_paperpack/preprint/preprint.md:125` | `repo-anchored` | `apps/web/lib/theory-gen/services/citation-verification-service.ts:80` |
| Static-vs-runtime method distinction | `_paperpack/preprint/preprint.md:98-99` | `repo-anchored` | `_paperpack/scripts/derive_darwin_mfc_counts.py:62-131`, `_paperpack/scripts/darwin_mfc_runtime_counts.ts:348-353` |
| ENAMED portal publication date `19/01/2026` | `_paperpack/preprint/preprint.md:59`, `_paperpack/preprint/preprint.md:183` | `INEP-anchored` | https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enamed |
| ENAMED news publication date `20/01/2026` | `_paperpack/preprint/preprint.md:60`, `_paperpack/preprint/preprint.md:184` | `INEP-anchored` | https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enamed/inep-publica-microdados-do-enamed-referente-a-primeira-edicao-do-exame |
| Nota Técnica nº 19/2025 (Angoff + TRI) reference | `_paperpack/preprint/preprint.md:61`, `_paperpack/preprint/preprint.md:185` | `INEP-anchored` | https://download.inep.gov.br/enamed/nota_tecnica_n_19_2025.pdf |
| LGPD governance framing reference | `_paperpack/preprint/preprint.md:62`, `_paperpack/preprint/preprint.md:186` | `INEP-anchored` | https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados |
| Prospective efficacy/safety performance metrics | `_paperpack/preprint/preprint.md:153-157`, `_paperpack/preprint/preprint.md:208` | `NOT YET COMPUTED` | Explicitly marked not executed in this cycle |

## Resolution Summary

- `repo-anchored`: 9
- `INEP-anchored`: 4
- `NOT YET COMPUTED`: 1
- `NOT FOUND`: 0

Conclusion: no unresolved unsupported numeric claim remains in the v0.3 manuscript set.
