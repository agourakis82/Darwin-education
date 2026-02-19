# Safety / Hallucination Control Pipeline

## Implemented Controls (Observed)

- Multi-stage QGen validation pipeline: `apps/web/lib/qgen/services/qgen-validation-service.ts:5-5`
- Stage weights and weighted decision score: `apps/web/lib/qgen/services/qgen-validation-service.ts:22-22`
- Decision thresholds (auto/pending/revision): `apps/web/lib/qgen/services/qgen-validation-service.ts:34-34`
- Critical medical errors force rejection: `apps/web/lib/qgen/services/qgen-validation-service.ts:546-546`
- Rule-based dangerous/outdated pattern checks: `apps/web/lib/qgen/services/qgen-validation-service.ts:312-312` and `apps/web/lib/qgen/services/medical-verification-service.ts:107-107`
- Citation verification and accessibility scoring: `apps/web/lib/theory-gen/services/citation-verification-service.ts:83-83` and `apps/web/lib/theory-gen/services/citation-verification-service.ts:126-126`
- Hallucination detection against claim support: `apps/web/lib/theory-gen/services/citation-verification-service.ts:182-182`
- Audit persistence for citation/hallucination checks: `infrastructure/supabase/migrations/007_theory_generation_system.sql:136-136` and `infrastructure/supabase/migrations/007_theory_generation_system.sql:165-165`
- Audit API exposing risk buckets: `apps/web/app/api/theory-gen/audit/route.ts:92-92`
- Human review API path for escalation/override: `apps/web/app/api/qgen/review/route.ts:134-134`

## Extracted Rubrics and Thresholds

| Control | Value / Rule | Evidence |
|---|---|---|
| QGen auto-approve threshold | `0.85` | `apps/web/lib/qgen/services/qgen-validation-service.ts:35-35` |
| QGen pending-review threshold | `0.70` | `apps/web/lib/qgen/services/qgen-validation-service.ts:36-36` |
| QGen needs-revision threshold | `0.50` | `apps/web/lib/qgen/services/qgen-validation-service.ts:37-37` |
| Medical stage pass cutoff | `score >= 0.7` | `apps/web/lib/qgen/services/qgen-validation-service.ts:178-178` |
| Theory generation auto-approve default | `0.90` | `apps/web/lib/theory-gen/services/generation-service.ts:187-187` |
| Citation support gate for claims | supporting citations require `verificationScore > 0.7` and accessibility | `apps/web/lib/theory-gen/services/citation-verification-service.ts:204-204` |

## Failure Modes (Observed in Code)

- Structural quality issues: `apps/web/lib/qgen/services/qgen-validation-service.ts:100-100`
- Linguistic quality issues: `apps/web/lib/qgen/services/qgen-validation-service.ts:50-50`
- Medical misinformation and dangerous treatment patterns: `apps/web/lib/qgen/services/medical-verification-service.ts:105-105`
- Citation inaccessibility/unverified references: `apps/web/lib/theory-gen/services/citation-verification-service.ts:44-44`
- Unsupported claims/hallucinations: `apps/web/lib/theory-gen/services/citation-verification-service.ts:180-180`

## PROPOSED (not implemented) Taxonomy Extension

The repo contains multiple partial taxonomies, but no single cross-pipeline taxonomy for clinically dangerous errors. Proposed unification:
- Clinical-dangerous treatment recommendation
- Outdated guideline recommendation
- Unsupported high-risk claim
- Citation contradiction
- Structural/clarity ambiguity with patient-safety impact
- Non-critical editorial issue
