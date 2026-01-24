# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Development
pnpm dev              # Start all apps (Next.js on :3000)
pnpm build            # Build all packages and apps
pnpm lint             # Lint all code
pnpm type-check       # TypeScript check
pnpm format           # Format with Prettier
pnpm clean            # Clean all builds and node_modules

# Single workspace
cd apps/web && pnpm dev
cd packages/shared && pnpm type-check
```

## Architecture Overview

This is a **Turbo monorepo** with three layers:

### 1. `@darwin-education/shared` (Calculation & Types)

**Purpose**: Domain logic shared between web and future mobile app.

**Key Modules**:
- `types/education.ts` (309 lines) — Complete type definitions:
  - `ENAMEDQuestion`: Exam question with IRT parameters
  - `TRIScore`: Exam result with theta ability estimate and area breakdown
  - `SM2State`: Flashcard spaced repetition state
  - `ENAMEDArea`: 5 medical specialties (clinica_medica, cirurgia, ginecologia_obstetricia, pediatria, saude_coletiva)

- `calculators/tri.ts` (322 lines) — **TRI/IRT Scoring**:
  - `probability3PL()` — 3-parameter logistic model for item response
  - `estimateThetaEAP()` — Expected a posteriori theta estimation (more stable than MLE)
  - `standardError()` — Theta estimate uncertainty
  - `calculateTRIScore()` — Full exam scoring pipeline
  - `predictPassProbability()` — Pass probability given current performance
  - Constants: THETA_MIN=-4, THETA_MAX=4, SCALE_MEAN=500, PASS_THRESHOLD=600

- `calculators/sm2.ts` (269 lines) — **SM-2 Spaced Repetition**:
  - `processReview()` — Update card state after rating (quality 0-5)
  - `calculateNewEaseFactor()` — Ease factor adjustment formula
  - `getDueCards()` — Review queue ordered by days overdue
  - `calculateStats()` — Learning statistics (learning/reviewing/mature cards)
  - Constants: MIN_EASE_FACTOR=1.3, DEFAULT_EASE_FACTOR=2.5

**Extension Points**:
- To add new IRT models, implement new estimation functions alongside `estimateThetaEAP()`
- To modify SM-2 intervals, adjust `INITIAL_INTERVALS` constants
- Domain logic is framework-agnostic; no dependencies on React or Next.js

### 2. `@darwin-education/web` (Next.js 15 Frontend)

**Purpose**: ENAMED exam prep UI.

**Key Features**:
- Uses App Router with React Server Components
- Home page shows 6 feature cards (Simulado, Flashcards, Trilhas, Monte sua Prova, Desempenho, Conteúdo Médico)
- Tailwind CSS with custom ENAMED color palette (primary + accent)
- Zustand for state management (from dependencies)
- `next dev --turbopack` for faster iteration

**Configuration**:
- `next.config.ts`: Transpiles `@darwin-education/shared`, disables React compiler
- Environment: Supabase URL and ANON_KEY in `apps/web/.env.local`
- Dark mode by default (`html lang="pt-BR" className="dark"`)

**Extension Points**:
- New pages go in `app/` (e.g., `app/simulado/page.tsx`)
- Use `@darwin-education/shared` types for data structures
- Supabase client imported from `@supabase/supabase-js`
- Medical data available from `@darwin-mfc/medical-data` NPM package

### 3. `infrastructure/supabase` (Database Schema)

**Purpose**: PostgreSQL schema with RLS policies.

**Key Tables**:
- `profiles` — User profiles, XP, streaks, subscription tier
- `question_banks` — Question sources (official_enamed, ai_generated, community, etc.)
- `questions` — IRT parameters (difficulty, discrimination, guessing), ontology, references
- `exams` & `exam_attempts` — Exam definitions and user attempts with TRI scores
- `flashcards` & `flashcard_reviews` — Flashcards with SM-2 state per user
- `study_paths` & `study_modules` — Learning paths with progression tracking

**Deployment**:
1. Copy `schema.sql` to Supabase > SQL Editor
2. Run entire script to set up tables, RLS, and triggers
3. Tables auto-initialize user progress on auth signup

## Key Architectural Decisions

### Monorepo with Turbo

**Why**: Shared logic (`@darwin-education/shared`) is framework-agnostic, enabling code reuse across web and future mobile (React Native).

**Workspace Dependency**: Web app uses `"@darwin-education/shared": "workspace:*"` in package.json (pnpm feature to symlink local packages).

### TRI Scoring (IRT 3PL Model)

**Context**: ENAMED uses Item Response Theory for adaptive testing. Each question has:
- `difficulty` (b): -4 to +4 (higher = harder)
- `discrimination` (a): How well it separates high/low ability students
- `guessing` (c): 0.25 for 4-option multiple choice

**Algorithm**:
- `estimateThetaEAP()` uses numerical integration (81 points, -4 to +4) for robust theta estimation
- Theta converted to 0-1000 scale: `score = 500 + (theta * 100)`
- Pass threshold: 600

**Why EAP over MLE?**: EAP is more stable for extreme patterns (all correct/all wrong). MLE struggles at boundaries.

### SM-2 Spaced Repetition

**Ease Factor**: Ranges 1.3-3.0, adjusted after each review based on quality rating (0-5).

**Initial Intervals**: 1 day → 6 days → N×EF days

**Reset on Failure**: Quality < 3 resets repetitions to 0 but penalizes ease factor (-0.2).

## Domain Context: ENAMED

**ENAMED** = Exame Nacional de Avaliação da Formação Médica (Brazilian medical licensing exam).

**Structure**:
- 5 areas: Internal Medicine, Surgery, OB/GYN, Pediatrics, Public Health
- 100 questions, 5-hour exam (300 minutes)
- TRI-based scoring for fair difficulty normalization
- Questions linked to ICD-10 diseases and ATC medications

**Medical Data Integration**:
- `@darwin-mfc/medical-data` NPM package exports 368 diseases, 690 medications, 13 protocols
- Questions ontology references ICD-10 and ATC codes for content mapping

## Deployment & Environment

### Development
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Turbo Caching
- Turbo caches build outputs and task results across workspaces
- Run `pnpm clean` to reset cache (e.g., when tweaking turbo.json)
- Global dependencies: `**/.env.*local` — cache invalidates when env changes

## Common Tasks

### Adding a New Feature Page

1. Create `apps/web/app/[feature]/page.tsx`
2. Import types from `@darwin-education/shared`:
   ```typescript
   import { calculateTRIScore, ENAMEDQuestion } from '@darwin-education/shared';
   ```
3. Fetch questions from Supabase using `@supabase/supabase-js`
4. Use domain calculators (TRI, SM-2) to score/schedule

### Extending the SM-2 Algorithm

Modify `packages/shared/src/calculators/sm2.ts`:
- Ease factor formula in `calculateNewEaseFactor()`
- Initial intervals in `INITIAL_INTERVALS` constant
- Review priority logic in `getDueCards()`

Changes auto-sync to web app (workspace dependency).

### Adding a New Question Type

1. Extend `ENAMEDQuestion` in `packages/shared/src/types/education.ts`
2. Update database schema in `infrastructure/supabase/schema.sql`
3. Add new IRT model if needed in `packages/shared/src/calculators/tri.ts`
4. Fetch and render in web app

## Related Repositories

- **Darwin-MFC**: Medical reference platform, source of diseases/medications/protocols
  - GitHub: https://github.com/agourakis82/darwin-mfc
- **@darwin-mfc/medical-data**: NPM package with consolidated medical data
  - NPM: https://www.npmjs.com/package/@darwin-mfc/medical-data
  - v1.0.0 exports `doencasConsolidadas`, `medicamentosConsolidados`, protocols, types

## Performance Notes

- **TRI Scoring**: O(n) for n questions; EAP integration uses 81 fixed points regardless of n
- **SM-2 Scheduling**: O(k log k) where k = due cards (sorting by days overdue)
- **Turbo Caching**: First build slower, subsequent builds much faster if inputs unchanged
- **Next.js Turbopack**: Experimental but significantly faster than Webpack in `pnpm dev`
