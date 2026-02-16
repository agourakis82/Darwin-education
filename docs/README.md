# Darwin Education Documentation

This directory contains technical documentation for the Darwin Education platform.

---

## Document Index

### 0. [BRAND_KIT_LOGO_SPEC_V1.md](BRAND_KIT_LOGO_SPEC_V1.md)
**Darwin Logo and Brand Kit Specification**

Production-ready logo system specification including:
- Logo lockups and variants
- Naming convention and export matrix
- Quality gate checklist
- App icon and favicon requirements
- Repository placement and handoff flow

**Audience**: Designers, product owners, frontend engineers
**When to read**: Before generating or approving any Darwin logo assets

---

### 0.1 [brand/LOGO_PROMPT_PACK_V1.md](brand/LOGO_PROMPT_PACK_V1.md)
**Prompt Pack for Logo Generation (30 prompts)**

Includes:
- Symbol exploration prompts
- Horizontal and stacked lockup prompts
- Monochrome stress-test prompts
- App icon and favicon-oriented prompts

**Audience**: Designers and content creators generating logo candidates
**When to read**: During logo exploration and iteration cycles

---

### 0.2 [brand/LOGO_SCORECARD_V1.md](brand/LOGO_SCORECARD_V1.md)
**Automatic Logo Selection Matrix**

Includes:
- Weighted scoring criteria
- Critical fail gates
- Approval thresholds
- CLI usage for automatic ranking

**Audience**: Design review committee and product owners
**When to read**: During candidate selection and approval

---

### 0.3 [brand/LOGO_INTEGRATION_WEB_PLAN_V1.md](brand/LOGO_INTEGRATION_WEB_PLAN_V1.md)
**Web Integration Plan (Header, Auth, Favicon, OG)**

Decision-complete plan including:
- Required assets
- File-level implementation steps
- Acceptance criteria
- Rollback strategy

**Audience**: Frontend engineers and technical leads
**When to read**: Before implementing the final logo in production

---

### 1. [darwin-education-technical-spec.md](darwin-education-technical-spec.md)
**Comprehensive Technical Specification (2000+ lines)**

Complete technical analysis integrating:
- **Part I**: SOTA Literature Review (2024-2025)
  - IRT/CAT research
  - FSRS-6 vs SM-2 benchmarks
  - Learning analytics dashboards
  - Gamification in medical education
  - Healthcare UX trends

- **Part II**: Feature Design Specifications
  - Simulado CAT (Computerized Adaptive Testing)
  - Flashcards FSRS-6 (Free Spaced Repetition Scheduler)
  - Trilhas Adaptativas (Bayesian Knowledge Tracing)
  - Dashboard de Desempenho (Enhanced Analytics)
  - Gamification Enhancements

- **Part III**: Database Schema Optimization
  - IRT calibration pipeline (warm-start)
  - FSRS schema extensions
  - Analytics views enhancements

- **Part IV**: Architecture Extensions
  - React Native + Expo for mobile

**Audience**: Technical leads, architects, researchers
**When to read**: For in-depth understanding of design rationale and research evidence

---

### 2. [implementation-summary.md](implementation-summary.md)
**Executive Summary & Quick Reference**

Condensed version covering:
- Deliverables overview
- Prioritized recommendations (P0-P4)
- Database schema extensions (SQL snippets)
- Success metrics
- Next steps

**Audience**: Product managers, stakeholders, developers
**When to read**: For quick overview and decision-making

---

## Implementation Files

### 3. [packages/shared/src/calculators/fsrs.ts](../packages/shared/src/calculators/fsrs.ts)
**FSRS-6 Algorithm Implementation**

- Complete 21-parameter FSRS-6 model
- Retrievability formula: `R(t, S) = (1 + t/(9*S))^(-1)`
- SM-2 → FSRS migration utility
- Default weights optimized on 20,000+ users
- Review scheduling, statistics, rating UI

**Features**:
- ✅ `createFSRSCard()` - Initialize new card
- ✅ `scheduleCard()` - Update after review
- ✅ `getDueCards()` - Get review queue
- ✅ `migrateSM2toFSRS()` - Migration from SM-2
- ✅ `calculateFSRSStats()` - Learning statistics

---

### 4. [packages/shared/src/algorithms/cat.ts](../packages/shared/src/algorithms/cat.ts)
**CAT (Computerized Adaptive Testing) Implementation**

- Maximum Fisher Information (MFI) item selection
- Session management
- Exposure control framework
- Content balancing for 5 ENAMED areas

**Features**:
- ✅ `initCATSession()` - Start new CAT session
- ✅ `selectNextItem()` - MFI-based selection
- 🚧 `updateCATSession()` - Update after response (partial)
- 🚧 Content balancing - Ensure coverage across areas
- 🚧 Stopping rules - SE threshold, min/max items

**Status**: Partial implementation (core selection logic complete)

---

### 5. [infrastructure/supabase/migrations/005_fsrs_and_cat_extensions.sql](../infrastructure/supabase/migrations/005_fsrs_and_cat_extensions.sql)
**Database Migration for FSRS & CAT**

Complete SQL migration including:

**Part 1: FSRS-6 Extensions**
- Rename `flashcard_sm2_states` → `flashcard_review_states`
- Add FSRS columns (difficulty, stability, reps, lapses, state)
- Create `user_fsrs_weights` table for personalized weights

**Part 2: CAT Extensions**
- Add CAT columns to `exam_attempts` (is_adaptive, stopping_reason, theta_trajectory)
- Create `item_exposure_log` table
- Create exposure rate view

**Part 3: IRT Calibration Pipeline**
- Create `irt_response_log` table
- Create `irt_calibration_batches` table
- Create `irt_parameter_history` table
- Add trigger to auto-update question parameters

**Part 4: Analytics Views**
- `v_algorithm_performance` - FSRS vs SM-2 comparison
- `v_cat_session_summary` - CAT session statistics
- `v_item_statistics` - Item-level calibration data

**Part 5: RLS Policies**
- User-level access control for FSRS weights
- Admin-only access for exposure logs

**Part 6: Helper Functions**
- `migrate_card_to_fsrs()` - Migrate single card
- `migrate_user_cards_to_fsrs()` - Bulk migration

**Part 7: Seed Data**
- Default FSRS weights for all users

---

## Quick Start Guide

### For Developers

1. **Read**: [implementation-summary.md](implementation-summary.md) for overview
2. **Deep Dive**: [darwin-education-technical-spec.md](darwin-education-technical-spec.md) for specific features
3. **Implement**: Use reference implementations in `packages/shared/`
4. **Deploy**: Run migration `005_fsrs_and_cat_extensions.sql`

### For Product Managers

1. **Read**: [implementation-summary.md](implementation-summary.md)
2. **Prioritize**: Review Phase 1, 2, 3 roadmap
3. **Success Metrics**: See section in implementation summary
4. **Approve**: Database schema changes (migration 005)

### For Researchers

1. **Read**: Part I of [darwin-education-technical-spec.md](darwin-education-technical-spec.md)
2. **Review**: Literature sources at end of each section
3. **Contribute**: Parameter optimization (FSRS weights, IRT calibration)

---

## Key Recommendations (At a Glance)

| Priority | Feature | Impact | Complexity | Timeline |
|----------|---------|--------|------------|----------|
| **P0** | FSRS Migration | -20-30% reviews | Medium | 4-8 weeks |
| **P1** | CAT Implementation | -50% test length | High | 8-16 weeks |
| **P2** | IRT Calibration | Continuous refinement | High | 8-16 weeks |
| **P3** | Dashboard Enhancements | Self-regulation | Low | 4-8 weeks |
| **P4** | React Native Mobile | 80% code sharing | Medium | 12 weeks |

---

## Research Sources

### IRT & CAT
- [PMC10624130 - CAT for Health Professionals](https://pmc.ncbi.nlm.nih.gov/articles/PMC10624130/)
- [arXiv:2502.19275 - Deep CAT with RL](https://arxiv.org/html/2502.19275)

### FSRS
- [Expertium Benchmark - 99.6% superiority over SM-2](https://expertium.github.io/Benchmark.html)
- [SuperMemo Dethroned by FSRS](https://supermemopedia.com/wiki/SuperMemo_dethroned_by_FSRS)
- [LECTOR - LLM + FSRS - arXiv:2508.03275](https://arxiv.org/html/2508.03275v1)

### Learning Analytics
- [LearningViz Dashboard - Springer 2024](https://link.springer.com/article/10.1186/s40561-024-00346-1)
- [Dashboard Design for Self-Regulation - JLA 2024](https://learning-analytics.info/index.php/JLA/article/view/8529)

### Gamification
- [Gamification in Medical Education - PMC10778414](https://pmc.ncbi.nlm.nih.gov/articles/PMC10778414/)
- [RCT on Gamification - ResearchGate 2024](https://www.researchgate.net/publication/395422293)

### Healthcare UX
- [Healthcare UX Trends 2025 - Webstacks](https://www.webstacks.com/blog/healthcare-ux-design)
- [Healthcare App Design - Mindster 2025](https://mindster.com/mindster-blogs/healthcare-app-design-guide/)

---

## Architecture Diagrams

### Current Architecture
```
darwin-education/
├── apps/
│   └── web/              # Next.js 15
├── packages/
│   └── shared/           # TRI, SM-2, Types
└── infrastructure/
    └── supabase/         # PostgreSQL + RLS
```

### Extended Architecture (After Implementation)
```
darwin-education/
├── apps/
│   ├── web/              # Next.js 15
│   └── mobile/           # React Native + Expo (NEW)
├── packages/
│   ├── shared/           # TRI, SM-2, FSRS, CAT (EXTENDED)
│   └── ui-mobile/        # Mobile UI components (NEW)
└── infrastructure/
    ├── supabase/         # PostgreSQL (EXTENDED)
    └── calibration/      # Python/R service (NEW)
```

---

## Contact & Support

For questions about this documentation:
- Technical questions: Create issue in GitHub
- Architecture decisions: See `CLAUDE.md` in project root
- Research collaboration: Contact technical lead

---

**Last Updated**: 2026-01-30
**Version**: 2.0
