# Cover Letter and Structured Abstract — JMIR Medical Education

## Cover Letter

Dear Editors,

We submit the manuscript "Darwin Education: Architecture-First Adaptive Learning With Psychometric and Safety Governance" for consideration in *JMIR Medical Education*.

The manuscript presents an open, reproducible implementation for ENAMED-focused adaptive learning, emphasizing controlled generation pipelines, psychometric instrumentation, and explicit human-review gates. It is positioned as a systems/governance report and does not claim educational efficacy outcomes.

In this v0.3 submission-ready revision, we hardened evidence integrity by:

- replacing stale corpus figures with runtime-verifiable counts,
- distinguishing static source-level derivation from runtime index enumeration,
- marking unresolved performance metrics as `NOT YET COMPUTED`,
- restricting external provenance claims to official INEP sources.

Runtime corpus counts used in manuscript text:

- diseases: raw `252`, unique `215`
- medications: raw `889`, unique `602`

(evidence: `_paperpack/derived/darwin_mfc_runtime_counts.json:13-14`, `_paperpack/derived/darwin_mfc_runtime_counts.json:562-563`)

The manuscript has not been submitted elsewhere. All authors have approved the submission and declare no conflicts of interest.

Sincerely,  
Demetrios Chiuratto Agourakis (ORCID: https://orcid.org/0009-0001-8671-8878)  
Isadora Casagrande Amalcaburio (ORCID: https://orcid.org/0009-0005-6883-1809)

---

## Abstract (JMIR format)

**Background:** AI-enabled tutoring in medical education frequently under-specifies psychometric and safety governance in implementation reports.

**Objective:** To describe a reproducible adaptive-learning architecture with explicit psychometric, safety, and review controls for ENAMED-oriented preparation.

**Methods:** We consolidated repository-level evidence and derived artifacts, requiring numerical claims to be grounded in repository anchors or official INEP sources.

**Results:** Runtime enumeration of Darwin-MFC exported indexes reports diseases `raw=252`, `unique=215`, and medications `raw=889`, `unique=602`. Legacy `368/690` values are treated as historical documentation targets only. Validation thresholds and review gates are implemented as code-level controls.

**Conclusions:** The project provides an evidence-hardened systems artifact for medical-education AI governance; efficacy outcomes require prospective study and are outside the scope of this manuscript.

---

## Keywords

medical education; adaptive learning; psychometrics; educational AI; reproducibility; governance; ENAMED

---

## Author Checklist Notes (JMIR-specific)

- [x] Structured abstract format used
- [x] Manuscript scope restricted to implementation/governance claims
- [x] Runtime corpus counts aligned to latest derived artifact
- [x] Official INEP provenance references included
- [x] Author identities/ORCIDs listed
- [ ] Final repository URL to be inserted at submission
- [x] Versioned Zenodo DOI assigned
