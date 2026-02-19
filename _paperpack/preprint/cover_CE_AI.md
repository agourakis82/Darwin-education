# Cover Letter and Structured Abstract — Computers & Education: Artificial Intelligence

## Cover Letter

Dear Editors,

We submit the manuscript "Darwin Education: Architecture-First Adaptive Learning With Psychometric and Safety Governance" for consideration in *Computers & Education: Artificial Intelligence*.

This work reports a reproducible software architecture for adaptive learning in medical-exam preparation, emphasizing measurement, governance, and safety controls over generation-only behavior. The manuscript is explicitly scoped as an implementation/governance report, not an educational efficacy trial.

Key evidence-hardening updates in this submission version (v0.3) include:

- runtime-verifiable corpus accounting from exported Darwin-MFC indexes,
- explicit separation between static source-level counting and runtime enumeration,
- removal of overclaims and downgrade of unresolved metrics to `NOT YET COMPUTED`,
- direct references to official INEP ENAMED publication and governance URLs.

Current runtime corpus counts are:

- diseases: raw `252`, unique `215`
- medications: raw `889`, unique `602`

(evidence: `_paperpack/derived/darwin_mfc_runtime_counts.json:13-14`, `_paperpack/derived/darwin_mfc_runtime_counts.json:562-563`)

The manuscript has not been submitted elsewhere, and all authors have approved the submission.

Sincerely,  
Demetrios Chiuratto Agourakis (ORCID: https://orcid.org/0009-0001-8671-8878)  
Isadora Casagrande Amalcaburio (ORCID: https://orcid.org/0009-0005-6883-1809)

---

## Structured Abstract (C&E:AI style)

**Background:** Adaptive educational AI systems are often assessed without explicit governance of psychometric grounding and safety controls.

**Objective:** To document a reproducible, architecture-first adaptive-learning implementation with psychometric inference, safety gating, and human review.

**Methods:** We audited repository code and generated reproducible artifacts under `_paperpack/`, requiring numerical claims to be repository-anchored, INEP-anchored, or marked `NOT YET COMPUTED`.

**Results:** Runtime enumeration of exported Darwin-MFC indexes reports diseases `raw=252`, `unique=215`, and medications `raw=889`, `unique=602`. Legacy `368/690` values are treated as historical targets only.

**Conclusions:** The system demonstrates a governance-oriented implementation pattern for educational AI in a high-stakes domain. Outcome efficacy remains out of scope for this paper version.

**Implications:** The package provides a defensible claim-to-evidence trail suitable for reproducible systems reporting.

---

## Highlights

- Architecture-first framing (implementation and governance; no efficacy overclaim)
- Runtime corpus accounting from live exported indexes
- Explicit static-versus-runtime counting distinction
- INEP provenance references and LGPD governance context included
- Reproducible pipeline via `_paperpack/scripts/run_all.sh`

---

## Keywords

adaptive learning; psychometrics; educational AI; reproducibility; governance; ENAMED; safety instrumentation
