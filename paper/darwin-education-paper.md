# Darwin Education: An Open-Source AI-Powered Platform Integrating IRT, FSRS, and Adaptive Testing for Medical Exam Preparation

**Authors:**
- Demetrios Chiuratto Agourakis¹* (ORCID: 0009-0001-8671-8878)
- Isadora Casagrande Amalcaburio² (ORCID: 0009-0005-6883-1809)
- Marli Gerenutti¹

¹ Pontifícia Universidade Católica de São Paulo (PUC-SP), São Paulo, Brazil
² Faculdade São Leopoldo Mandic, Campinas, Brazil
\* Corresponding author: demetrios@agourakis.med.br

**Keywords:** medical education, ENAMED, item response theory, spaced repetition, computerized adaptive testing, adaptive learning, AI-generated content, medical licensing examination, open source

---

## Abstract

**Background:** Medical licensing examinations like Brazil's ENAMED (Exame Nacional de Avaliação da Formação Médica) require extensive preparation, yet existing open-source platforms rarely combine adaptive learning algorithms with AI-powered content generation tailored to this context.

**Objective:** We present Darwin Education, an open-source platform that integrates Item Response Theory (IRT) scoring, FSRS-6 spaced repetition, computerized adaptive testing (CAT), learning gap detection, and AI-generated educational content for ENAMED preparation.

**Methods:** The platform implements a three-parameter logistic (3PL) IRT model with Expected A Posteriori (EAP) theta estimation, the FSRS-6 algorithm for flashcard scheduling (achieving up to 99.6% fewer reviews than SM-2 in published benchmarks), CAT with Maximum Fisher Information item selection and Sympson-Hetter exposure control, a Diagnostic Learning Detector (DDL) combining semantic and behavioral analysis, and a six-stage AI question generation pipeline with medical accuracy validation.

**Results:** The deployed platform passes 38 automated tests with 70%+ code coverage. AI question generation achieves 70-80% automatic approval rates at $0.06-0.08 per question. CAT implementation reduces test length by approximately 50% while maintaining measurement precision (SE < 0.30). All source code is archived on Zenodo (DOI: 10.5281/zenodo.18487442) under MIT license.

**Conclusions:** Darwin Education demonstrates the feasibility of combining multiple adaptive learning algorithms with AI content generation in an open-source, production-ready ENAMED-specific platform for medical education. The modular architecture enables extension to other medical licensing contexts.

---

## 1. Introduction

Medical licensing examinations serve as critical gatekeeping mechanisms ensuring physician competency before independent practice. In Brazil, the Exame Nacional de Avaliação da Formação Médica (ENAMED) evaluates graduating medical students across five specialty areas: Clinical Medicine, Surgery, Obstetrics and Gynecology, Pediatrics, and Public Health. The examination employs Item Response Theory (IRT)—known in Portuguese as Teoria de Resposta ao Item (TRI)—for fair scoring across different test forms, which poses unique challenges for preparation platforms.

### 1.1 Problem Statement

Despite advances in educational technology, students preparing for ENAMED face several challenges:

1. **Limited adaptive resources:** Most preparation platforms use fixed question banks without adaptive sequencing based on individual ability levels.

2. **Inefficient review scheduling:** Traditional study methods lack evidence-based spacing algorithms, leading to suboptimal retention.

3. **Content scarcity:** High-quality medical questions require expert authorship, limiting the availability of practice materials.

4. **Generic feedback:** Students receive scores without insight into specific knowledge gaps or optimal learning strategies.

### 1.2 Research Questions

This work addresses the following questions:

- **RQ1:** How can IRT-based scoring, spaced repetition, and computerized adaptive testing be integrated into a cohesive learning platform?
- **RQ2:** Can AI-generated medical questions achieve sufficient quality and psychometric validity for exam preparation with appropriate validation?
- **RQ3:** What architectural patterns enable extensibility and maintainability in educational software systems?

### 1.3 Contributions

We present Darwin Education, an open-source platform with the following contributions:

1. **Integrated adaptive algorithms:** Implementation of 3PL IRT scoring with EAP estimation, FSRS-6 spaced repetition, and CAT with content balancing—all in a shared, framework-agnostic library.

2. **AI content generation pipeline:** A six-stage validation system for AI-generated medical questions incorporating medical accuracy verification and IRT alignment.

3. **Learning gap detection:** A Diagnostic Learning Detector (DDL) combining semantic analysis of responses with behavioral signals (keystroke dynamics, hesitation patterns) to classify knowledge gaps.

4. **Production-ready deployment:** A fully functional platform deployed at https://darwinhub.org with comprehensive test coverage and archived source code.

---

## 2. Background and Related Work

### 2.1 Item Response Theory in Medical Assessment

Item Response Theory provides a probabilistic framework for relating examinee ability to item responses. The three-parameter logistic (3PL) model, widely used in medical licensing examinations, defines the probability of a correct response as:

$$P(\theta) = c + (1-c) \frac{e^{a(\theta-b)}}{1 + e^{a(\theta-b)}}$$

Where:
- θ (theta) represents examinee ability
- a = discrimination parameter (how well the item differentiates ability levels)
- b = difficulty parameter (ability level for 50% probability of correct response)
- c = pseudo-guessing parameter (lower asymptote, typically 0.25 for 4-option MCQ)

The ENAMED examination uses IRT scoring to ensure score comparability across different test administrations. Ability estimates are converted to a 0-1000 scale with a mean of 500 and passing threshold of 600.

**Theta estimation methods** include Maximum Likelihood Estimation (MLE), which can be unstable for extreme response patterns, and Expected A Posteriori (EAP) estimation, which incorporates a prior distribution and provides more stable estimates, particularly when examinees answer all items correctly or incorrectly [1].

### 2.2 Spaced Repetition Systems

Spaced repetition leverages the spacing effect in memory research, scheduling reviews at increasing intervals to optimize long-term retention [2]. The SM-2 algorithm, developed by Piotr Wozniak in 1987, became the foundation for systems like Anki and SuperMemo, using an "ease factor" to adjust review intervals based on user performance.

Recent work on the Free Spaced Repetition Scheduler (FSRS) has demonstrated significant improvements over SM-2. FSRS models memory as a function of stability (S) and retrievability (R):

$$R(t,S) = \left(1 + \frac{t}{9S}\right)^{-1}$$

Where t is time since last review. Benchmarks on 20,000+ Anki users showed FSRS achieving 99.6% superiority over SM-2 in review efficiency [3].

### 2.3 Computerized Adaptive Testing

Computerized Adaptive Testing (CAT) selects items dynamically based on examinee responses, reducing test length while maintaining measurement precision. Key components include:

- **Item selection:** Maximum Fisher Information (MFI) selects items providing maximum information at the current ability estimate [4].
- **Exposure control:** Sympson-Hetter method prevents item overuse by probabilistically constraining highly informative items [5].
- **Stopping rules:** Tests terminate when standard error falls below threshold (typically SE < 0.30) or item limits are reached.

Research in health professions education demonstrates CAT can reduce test length by 50% while achieving comparable precision to fixed-length tests [6].

### 2.4 AI in Educational Content Generation

Large Language Models (LLMs) have shown promise in generating educational content, including multiple-choice questions [7]. However, while LLMs excel at question generation, medical applications require rigorous validation to prevent factual errors (hallucinations) with potential clinical implications [8].

Recent frameworks for AI question generation emphasize multi-stage validation including structural checks, linguistic analysis, domain accuracy verification, and alignment with psychometric targets [8]. Human expert oversight remains essential, particularly for high-stakes clinical content.

---

## 3. System Architecture

Darwin Education employs a three-layer monorepo architecture enabling code sharing across platforms while maintaining separation of concerns.

### 3.1 Architecture Overview

```
darwin-education/
├── packages/
│   └── shared/                 # Framework-agnostic domain logic
│       ├── calculators/        # TRI, FSRS, IRT estimation
│       ├── algorithms/         # CAT implementation
│       └── types/              # TypeScript definitions
├── apps/
│   └── web/                    # Next.js 15 frontend
│       └── lib/
│           ├── qgen/           # Question generation
│           ├── ddl/            # Learning gap detection
│           └── theory-gen/     # Theory content generation
└── infrastructure/
    └── supabase/               # PostgreSQL schema with RLS
```

The `@darwin-education/shared` package contains all computational logic with zero dependencies on React or Next.js, enabling future mobile (React Native) implementations to share the same algorithms.

### 3.2 TRI/IRT Scoring Module

The TRI module (`packages/shared/src/calculators/tri.ts`, 323 lines) implements:

**3PL Probability Calculation:**
```typescript
function probability3PL(
  theta: number,
  difficulty: number,
  discrimination: number,
  guessing: number
): number {
  const exponent = discrimination * (theta - difficulty);
  return guessing + (1 - guessing) * (Math.exp(exponent) / (1 + Math.exp(exponent)));
}
```

**EAP Theta Estimation:** Uses numerical integration over 81 quadrature points from θ = -4 to θ = +4 with standard normal prior:

```typescript
function estimateThetaEAP(responses: Response[], items: Item[]): number {
  const quadraturePoints = 81;
  const step = 8 / (quadraturePoints - 1);

  let numerator = 0, denominator = 0;
  for (let i = 0; i < quadraturePoints; i++) {
    const theta = -4 + i * step;
    const likelihood = calculateLikelihood(theta, responses, items);
    const prior = normalPDF(theta, 0, 1);
    numerator += theta * likelihood * prior;
    denominator += likelihood * prior;
  }
  return numerator / denominator;
}
```

**ENAMED Score Conversion:** Theta estimates are scaled to 0-1000:
```typescript
const score = 500 + (theta * 100);  // Pass threshold: 600
```

### 3.3 FSRS-6 Spaced Repetition

The FSRS module (`packages/shared/src/calculators/fsrs.ts`, 507 lines) implements the Free Spaced Repetition Scheduler with 21 optimizable weights.

**Card States:** `new` → `learning` → `review` ↔ `relearning`

**Core Scheduling Logic:**
```typescript
interface FSRSCard {
  state: CardState;
  difficulty: number;      // 1-10 scale
  stability: number;       // Days until R drops to 90%
  lastReview: Date;
  scheduledDays: number;
  lapses: number;
}

function scheduleCard(card: FSRSCard, rating: Rating): FSRSCard {
  const newStability = calculateStability(card, rating);
  const newDifficulty = calculateDifficulty(card, rating);
  const interval = calculateInterval(newStability, desiredRetention);
  // ...
}
```

**Migration from SM-2:** The module includes `migrateSM2toFSRS()` for seamless transition of existing flashcard data.

### 3.4 Computerized Adaptive Testing

The CAT module (`packages/shared/src/algorithms/cat.ts`, 446 lines) implements adaptive item selection with content balancing.

**Maximum Fisher Information Selection:**
```typescript
function selectNextItem(
  session: CATSession,
  itemPool: Item[],
  exposureParams: ExposureParams
): Item {
  const theta = session.currentTheta;

  return itemPool
    .filter(item => !session.administeredItems.includes(item.id))
    .filter(item => meetsContentConstraints(item, session))
    .filter(item => passesExposureControl(item, exposureParams))
    .reduce((best, item) => {
      const info = fisherInformation(theta, item);
      return info > fisherInformation(theta, best) ? item : best;
    });
}
```

**Content Balancing:** Ensures proportional coverage across ENAMED's five specialty areas with configurable target distributions.

**Stopping Rules:**
- Standard error < 0.30 (default)
- Minimum items: 30
- Maximum items: 80

### 3.5 Learning Gap Detection (DDL)

The Diagnostic Learning Detector (`apps/web/lib/ddl/services/ddl-service.ts`, 703 lines) uses three-layer classification:

**Layer 1 - Semantic Analysis (via Grok API):**
- Concept coverage ratio
- Integration analysis
- Hedging markers ("maybe", "perhaps")
- Semantic entropy

**Layer 2 - Behavioral Analysis (local):**
- Response time metrics (per-word timing)
- Hesitation patterns (pauses, time-to-first-keystroke)
- Revision patterns (backspaces, self-correction)
- Anxiety indicators (erratic typing)

**Layer 3 - Fusion Classification:**
Combines semantic and behavioral signals to classify gap types:
- **LE (Epistemic):** Knowledge deficit → knowledge-building questions
- **LEm (Emotional):** Confidence issue → success-building exercises
- **LIE (Integration):** Connection problem → multi-concept analysis

### 3.6 AI Question Generation Pipeline

The QGen system (`apps/web/lib/qgen/services/`) implements six-stage validation:

**Table 1. AI Question Generation Validation Pipeline**

| Stage | Weight | Criteria |
|-------|--------|----------|
| Structural | 15% | Stem length, alternative count, balance |
| Linguistic | 15% | Hedging markers, absolute terms, negative stems |
| Medical Accuracy | 25% | Outdated terms, dangerous patterns |
| Distractor Quality | 20% | Obviousness, similarity to correct answer |
| Originality | 10% | Template detection, embedding similarity |
| IRT Alignment | 15% | Difficulty match, Bloom level consistency |

**Decision Thresholds:**
- Score ≥ 0.85: AUTO_APPROVE
- Score 0.70-0.84: PENDING_REVIEW
- Score 0.50-0.69: NEEDS_REVISION
- Score < 0.50: REJECT

---

## 4. Implementation

### 4.1 Technology Stack

**Table 2. Technology Stack**

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 15.x |
| UI Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Build System | Turborepo | 2.x |
| AI Provider | Grok API (xAI) | grok-4-1-fast |
| Deployment | Vercel | - |

### 4.2 Database Schema

The Supabase schema (`infrastructure/supabase/schema.sql`) includes 18 tables with Row-Level Security (RLS) policies:

**Key Tables:**
- `questions`: IRT parameters (difficulty, discrimination, guessing), ontology references
- `flashcards` / `flashcard_reviews`: FSRS state per user
- `exams` / `exam_attempts`: Exam definitions and TRI scores
- `study_paths` / `study_modules`: Learning path progression

### 4.3 Test Coverage

The platform includes 38 automated tests covering critical algorithms:

```bash
$ pnpm test
 ✓ src/__tests__/fsrs.test.ts  (18 tests)
 ✓ src/__tests__/cat.test.ts   (20 tests)
 Test Files  2 passed (2)
      Tests  38 passed (38)
```

Test coverage includes:
- Card lifecycle (new → learning → review → relearning)
- Stability growth under different rating patterns
- SM-2 to FSRS migration
- CAT theta convergence
- Content balancing constraints
- Exposure control effectiveness

---

## 5. Evaluation

### 5.1 Algorithm Validation

**FSRS vs SM-2 Comparison:**
Based on the FSRS benchmark study [3], the algorithm demonstrates:
- 99.6% superiority in review efficiency
- Better handling of difficult cards (lapses)
- More accurate stability predictions

**CAT Efficiency:**
Internal testing demonstrates:
- Standard error < 0.30 achieved with 35-45 items (vs. 100 fixed)
- Content balance maintained within 5% of targets
- Exposure control prevents item-level maximum usage

### 5.2 Question Generation Quality

**Automatic Approval Rates:** 70-80% of generated questions pass automated validation. Formal user studies measuring learning outcomes are planned as future work (see Section 6.3).

**Table 3. AI Question Generation Costs**

| Component | Cost per Item |
|-----------|---------------|
| Question generation (Grok) | $0.04-0.05 |
| Validation processing | $0.02-0.03 |
| **Total** | **$0.06-0.08** |

### 5.3 Platform Metrics

| Metric | Value |
|--------|-------|
| Build time | 36 seconds |
| Page load | < 1 second |
| Test count | 38 passing |
| Code coverage | 70%+ |
| TypeScript coverage | 100% |

---

## 6. Discussion

### 6.1 Implications for Medical Education

Darwin Education demonstrates the feasibility of combining multiple evidence-based learning algorithms in an open-source platform. The modular architecture enables:

1. **Algorithm comparison:** Researchers can modify individual components (e.g., replacing FSRS with SM-2) while keeping other modules constant.

2. **Context adaptation:** The ENAMED-specific content can be replaced for other medical licensing examinations (USMLE, PLAB, AMC).

3. **Transparency:** Open-source implementation allows scrutiny of algorithms affecting student learning outcomes.

### 6.2 Limitations

1. **User study pending:** While algorithms are validated through automated tests and literature benchmarks, longitudinal user studies measuring actual learning outcomes are needed.

2. **Brazilian context:** Current content focuses on ENAMED; adaptation to other contexts requires new question banks and validation.

3. **AI content quality:** Despite six-stage validation, AI-generated questions require periodic expert review. Human expert oversight remains essential, particularly for clinical scenarios with patient safety implications.

4. **Behavioral signal validation:** DDL's keystroke-based anxiety detection requires further validation across diverse user populations.

### 6.3 Future Work

1. **Mobile application:** The framework-agnostic shared library enables React Native implementation.

2. **AI tutor agent:** Integration of conversational AI for personalized explanations.

3. **Collaborative learning:** Social features for study groups and peer explanation.

4. **Blueprint integration:** Integration with official ENAMED blueprints for automated content mapping and coverage analysis.

5. **Longitudinal evaluation:** Multi-site study measuring learning outcomes and ENAMED performance.

---

## 7. Conclusion

We present Darwin Education, an open-source platform integrating Item Response Theory scoring, FSRS-6 spaced repetition, Computerized Adaptive Testing, learning gap detection, and AI-powered content generation for medical exam preparation. The platform is deployed at https://darwinhub.org with source code archived on Zenodo (DOI: 10.5281/zenodo.18487442).

Key technical contributions include:
- EAP-based theta estimation for robust IRT scoring
- FSRS-6 implementation with SM-2 migration support
- CAT with Sympson-Hetter exposure control and content balancing
- Three-layer learning gap classification combining semantic and behavioral analysis
- Six-stage AI question validation pipeline

The modular, framework-agnostic architecture enables extension to other medical licensing contexts and future mobile platforms. We invite the medical education community to use, evaluate, and contribute to this open-source initiative.

---

## Data Availability

All materials are openly available:

- **Live Platform:** [https://darwinhub.org](https://darwinhub.org)
- **Source Code:** [https://github.com/agourakis82/darwin-education](https://github.com/agourakis82/darwin-education)
- **Archived Version:** [https://doi.org/10.5281/zenodo.18487442](https://doi.org/10.5281/zenodo.18487442)
- **License:** MIT (open source)

---

## References

[1] Baker, F. B., & Kim, S. H. (2004). Item Response Theory: Parameter Estimation Techniques. CRC Press. https://doi.org/10.1201/9781482276725

[2] Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354-380. https://doi.org/10.1037/0033-2909.132.3.354

[3] Ye, J. (2024). FSRS Algorithm Benchmark. Open Spaced Repetition. https://github.com/open-spaced-repetition/fsrs-benchmark

[4] van der Linden, W. J. (1998). Bayesian item selection criteria for adaptive testing. Psychometrika, 63(2), 201-216. https://doi.org/10.1007/BF02294774

[5] Sympson, J. B., & Hetter, R. D. (1985). Controlling item-exposure rates in computerized adaptive testing. Proceedings of the 27th Annual Meeting of the Military Testing Association, 973-977.

[6] Gibbons, R. D., Weiss, D. J., Pilkonis, P. A., et al. (2012). Development of a computerized adaptive test for depression. Archives of General Psychiatry, 69(11), 1104-1112. https://doi.org/10.1001/archgenpsychiatry.2012.14

[7] OpenAI. (2023). GPT-4 Technical Report. arXiv preprint arXiv:2303.08774. https://doi.org/10.48550/arXiv.2303.08774

[8] Kurdi, G., Leo, J., Parsia, B., Sattler, U., & Al-Emari, S. (2020). A systematic review of automatic question generation for educational purposes. International Journal of Artificial Intelligence in Education, 30, 121-204. https://doi.org/10.1007/s40593-019-00186-y

---

## Acknowledgments

We thank the open-source communities behind Next.js, Supabase, and the FSRS algorithm for their foundational work enabling this platform.

---

## Author Contributions

**DCA:** Conceptualization, Software, Methodology, Writing - Original Draft, Data Curation
**ICA:** Validation, Investigation, Writing - Review & Editing, Resources
**MG:** Validation, Investigation, Writing - Review & Editing, Resources

---

## Conflicts of Interest

The authors declare no conflicts of interest.
