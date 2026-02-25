# AGENTS.md — Darwin Education Project Guide

This document provides comprehensive guidance for AI coding agents working with the Darwin Education codebase. It covers project architecture, development workflows, and manuscript-safe editing conventions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Development Commands](#4-development-commands)
5. [Code Style Guidelines](#5-code-style-guidelines)
6. [Testing Strategy](#6-testing-strategy)
7. [Environment Configuration](#7-environment-configuration)
8. [Database & Migrations](#8-database--migrations)
9. [AI Integration](#9-ai-integration)
10. [Safety Instrumentation](#10-safety-instrumentation)
11. [Preprint Evidence Workflow](#11-preprint-evidence-workflow)
12. [Deployment](#12-deployment)

---

## 1. Project Overview

**Darwin Education** is an AI-powered platform for ENAMED (Exame Nacional de Avaliação da Formação Médica) exam preparation. It combines adaptive learning algorithms, psychometric calibration, and safety-instrumented AI content generation.

### Key Features

- **Exam Simulation**: Full ENAMED practice exams with TRI (Item Response Theory) scoring
- **Adaptive Testing**: Computerized Adaptive Testing (CAT) using MIRT 5D model
- **Spaced Repetition**: SM-2 and FSRS algorithms for flashcard scheduling
- **Learning Gap Detection**: DDL (Diagnóstico de Lacunas de Aprendizado) system
- **AI Question Generation**: Grok-powered question generation with multi-stage validation
- **Theory Generation**: Automated medical content generation with citation verification
- **Performance Analytics**: Real-time dashboards with psychometric insights

### Domain Context: ENAMED

ENAMED is the Brazilian national medical licensing exam with:
- 5 areas: Internal Medicine, Surgery, OB/GYN, Pediatrics, Public Health
- 100 questions, 5-hour exam (300 minutes)
- TRI-based scoring for fair difficulty normalization

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Language**: TypeScript 5.4+
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 5.0
- **Animation**: Framer Motion
- **Icons**: Lucide React

### Backend & Database
- **Database**: PostgreSQL 16 (via Supabase)
- **Auth**: Supabase Auth (GoTrue)
- **Cache**: Redis 7
- **ORM/Client**: Supabase JavaScript Client

### AI Services
- **Primary**: Grok 4.1-fast (xAI API)
- **Fallback**: Minimax API
- **Integration**: OpenAI-compatible SDK

### Mobile
- **iOS**: SwiftUI native app (XcodeGen project)

### Build & Dev Tools
- **Package Manager**: pnpm 9.0.0
- **Monorepo**: Turbo 2.0
- **Runtime**: Node.js 20.x
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint 9 with TypeScript plugin
- **Formatting**: Prettier

---

## 3. Repository Structure

```
darwin-education/
├── apps/
│   ├── web/                      # Next.js 15 web application
│   │   ├── app/                  # App Router pages
│   │   │   ├── (auth)/           # Auth routes (login, signup)
│   │   │   ├── api/              # API routes
│   │   │   ├── simulado/         # Exam simulation
│   │   │   ├── flashcards/       # Flashcard system
│   │   │   ├── cip/              # Clinical image puzzles
│   │   │   ├── fcr/              # Fractal clinical reasoning
│   │   │   ├── ddl/              # Learning gap detection
│   │   │   ├── qgen/             # Question generation
│   │   │   ├── desempenho/       # Performance dashboard
│   │   │   └── ...
│   │   ├── lib/                  # Utilities and services
│   │   │   ├── ai/               # AI integration (Grok, Minimax)
│   │   │   ├── ddl/              # DDL services and prompts
│   │   │   ├── qgen/             # Question generation services
│   │   │   ├── theory-gen/       # Theory generation pipeline
│   │   │   ├── stores/           # Zustand state stores
│   │   │   ├── supabase/         # Database clients
│   │   │   └── ...
│   │   └── components/           # Shared React components
│   │
│   └── ios-native/               # SwiftUI iOS app
│       ├── DarwinEducation/      # App source
│       └── project.yml           # XcodeGen configuration
│
├── packages/
│   └── shared/                   # Shared domain logic
│       ├── src/
│       │   ├── calculators/      # TRI, SM-2, FSRS algorithms
│       │   ├── types/            # TypeScript definitions
│       │   ├── services/ai/      # AI service clients
│       │   └── __tests__/        # Unit tests
│       └── package.json
│
├── infrastructure/
│   └── supabase/
│       ├── migrations/           # Database migrations (29+ files)
│       ├── seed/                 # ETL scripts for content
│       └── schema.sql            # Full database schema
│
├── _paperpack/                   # Reproducible evidence pack
│   ├── preprint/                 # Manuscript sources
│   ├── derived/                  # Runtime artifacts
│   └── scripts/                  # Reproducibility scripts
│
└── docs/                         # Documentation
```

### Workspace Dependencies

The web app uses the shared package via pnpm workspace:
```json
"@darwin-education/shared": "workspace:*"
```

---

## 4. Development Commands

### Setup
```bash
# Install dependencies
pnpm install

# Setup environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your credentials
```

### Development
```bash
pnpm dev              # Start all apps (Next.js on :3000)
pnpm build            # Build all packages and apps
pnpm lint             # Lint all code
pnpm type-check       # TypeScript check
pnpm format           # Format with Prettier
pnpm clean            # Clean all builds and node_modules
```

### Database
```bash
pnpm db:push          # Deploy migrations
pnpm db:login         # Supabase login
pnpm db:link          # Link to Supabase project
pnpm db:status        # Check Supabase status
```

### Content Management
```bash
pnpm seed:medical-content      # Import Darwin-MFC content
pnpm audit:medical-content     # Audit content evidence
pnpm validate:jsonld           # Validate JSON-LD metadata
```

### Testing
```bash
# Unit tests (in packages/shared)
cd packages/shared && pnpm test

# E2E tests (in apps/web)
cd apps/web && pnpm test:e2e
cd apps/web && pnpm test:e2e:ui     # With UI

# Single workspace
cd apps/web && pnpm dev
cd packages/shared && pnpm type-check
```

---

## 5. Code Style Guidelines

### TypeScript
- Use strict mode enabled
- Avoid `any` type (warn level in ESLint)
- Define interfaces for all data structures
- Use discriminated unions for complex types

```typescript
// Good
interface GenerationRequest {
  source: 'darwin-mfc' | 'manual' | 'hybrid';
  sourceId?: string;
  topicTitle: string;
}

// Avoid
interface GenerationRequest {
  source: string;
  sourceId?: any;
  topicTitle: string;
}
```

### React Components
```typescript
import { FC, ReactNode } from 'react';

interface QuestionCardProps {
  questionId: string;
  onAnswer: (answer: string) => void;
}

export const QuestionCard: FC<QuestionCardProps> = ({
  questionId,
  onAnswer,
}) => {
  // Component logic
  return <div>...</div>;
};
```

### File Organization
```
lib/
├── feature-name/
│   ├── index.ts           # Public exports
│   ├── types.ts           # Type definitions
│   ├── services/          # Business logic
│   ├── prompts/           # LLM prompts
│   └── utils/             # Helpers
```

### ESLint Configuration
- Located in `eslint.config.js`
- TypeScript parser with React support
- Stricter rules for `packages/shared` (no console)
- Custom globals defined for Node.js and browser APIs

### Prettier Configuration
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## 6. Testing Strategy

### Unit Tests
- **Framework**: Vitest
- **Location**: `packages/shared/src/__tests__/`
- **Coverage Goals**:
  - `packages/shared`: ≥80%
  - `apps/web/lib`: ≥70%
  - `apps/web/app`: ≥50% (E2E tested)

### E2E Tests
- **Framework**: Playwright
- **Location**: `apps/web/playwright/`
- **Browsers**: Chromium, WebKit

### Test Commands
```bash
# Run all unit tests
pnpm --filter @darwin-education/shared test

# Run E2E tests
pnpm --filter @darwin-education/web test:e2e

# Watch mode
pnpm --filter @darwin-education/shared test:watch
```

### Example Unit Test
```typescript
import { describe, it, expect } from 'vitest';
import { calculateTRIScore } from '@darwin-education/shared';

describe('TRI Calculator', () => {
  it('should calculate theta correctly', () => {
    const questions = [/* ... */];
    const result = calculateTRIScore(questions);
    expect(result.theta).toBeGreaterThan(-4);
    expect(result.theta).toBeLessThan(4);
  });
});
```

---

## 7. Environment Configuration

### Required Variables
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Public URL
NEXT_PUBLIC_SITE_URL=https://darwinhub.org

# AI APIs (Required for AI features)
XAI_API_KEY=xai-your-key
# or
GROK_API_KEY=xai-your-key

# Minimax (Optional fallback)
MINIMAX_API_KEY=minimax-your-key
MINIMAX_GROUP_ID=your-group-id
```

### Feature Flags
```env
# Closed Beta
BETA_TESTER_EMAILS=alice@example.com,bob@example.com
BETA_TESTER_DOMAINS=mandic.edu.br

# AI Features
ENABLE_AI_FEATURES=true
ENABLE_THEORY_GENERATION=true
ENABLE_CAT_MODE=false

# UX Flags
NEXT_PUBLIC_ENABLE_ONBOARDING=false
```

### Security Notes
- Never commit `.env.local` files
- Use `.env.example` as template
- Keep API keys out of client-side code (use server routes)

---

## 8. Database & Migrations

### Schema Overview

Key tables:
- `profiles` — User profiles, XP, streaks, subscription tier
- `questions` — IRT parameters (difficulty, discrimination, guessing)
- `question_banks` — Question sources
- `exams` & `exam_attempts` — Exam definitions and attempts
- `flashcards` & `flashcard_reviews` — SM-2/FSRS state
- `study_paths` & `study_modules` — Learning progression

### Migration Files
Located in `infrastructure/supabase/migrations/`:
- `001_cip_schema.sql` — Clinical image puzzles
- `003_ai_integration.sql` — AI feature support
- `005_fsrs_and_cat_extensions.sql` — FSRS + CAT
- `007_theory_generation_system.sql` — Theory generation
- `008_cip_achievements_system.sql` — Gamification
- `011_fractal_clinical_reasoning.sql` — FCR system
- `016_research_psychometrics.sql` — Research features
- And more...

### Running Migrations
```bash
# Using Supabase CLI
supabase db push

# Or run SQL directly in Supabase SQL Editor
cat infrastructure/supabase/schema.sql | pbcopy
# Paste and execute in Supabase dashboard
```

---

## 9. AI Integration

### Supported Providers

1. **Grok (xAI)** — Primary provider
   - Model: `grok-4.1-fast`
   - OpenAI-compatible API

2. **Minimax** — Fallback provider
   - Model: `abab6.5-chat`
   - Native API support

### Key AI Services

Located in `apps/web/lib/ai/`:
- `minimax.ts` — LLM client with retry logic
- `cache.ts` — AI response caching
- `cost-tracker.ts` — Token usage tracking
- `clinicalValidator.ts` — Medical content validation

### AI Routes

API endpoints in `apps/web/app/api/`:
- `/api/ai/generate-question` — Question generation
- `/api/ai/explain` — Concept explanations
- `/api/ai/case-study` — Clinical case generation
- `/api/theory-gen/generate` — Theory content generation
- `/api/ddl/analyze` — Learning gap detection

---

## 10. Safety Instrumentation

### Validation Pipeline Thresholds

LLM-generated content is gated by weighted validation:
- **Auto-approval**: ≥ 0.85
- **Pending human review**: ≥ 0.70
- **Mandatory revision**: ≥ 0.50
- **Reject**: < 0.50

### Medical Danger-Pattern Checks

- Clinical contradiction detection
- Medication interaction warnings
- Contraindication validation
- Human review escalation workflow

### Safety Implementation

Located in `apps/web/lib/ai/`:
- `clinicalValidator.ts` — Medical pattern checking
- `questionValidationIntegration.ts` — Validation pipeline

---

## 11. Preprint Evidence Workflow

This repository includes a reproducible preprint package under `_paperpack/`.

### Naming Conventions (Preprint Package)

- **Manuscript source**: `_paperpack/preprint/preprint.md`
- **Cover letters**: `_paperpack/preprint/cover_*.md`
- **Submission checklist**: `_paperpack/preprint/submission_checklist.md`
- **Versioned change notes**: `_paperpack/preprint/CHANGELOG.md`
- **Derived runtime artifacts**:
  - `_paperpack/derived/darwin_mfc_runtime_counts.json`
  - `_paperpack/derived/darwin_mfc_duplicates.csv`
- **Claims audit**: `_paperpack/preprint/claim_audit_v0.3.md`

### Evidence Citation Rules

All numerical claims must follow one of four statuses:
1. `repo-anchored` — Exact file anchors like `relative/path/file.ext:start-end`
2. `INEP-anchored` — Official INEP URLs
3. `NOT YET COMPUTED` — Pending runtime calculation
4. `NOT FOUND` — Unavailable data

### Reproducibility Commands

```bash
# Full evidence pack
bash _paperpack/scripts/run_all.sh

# Runtime-verifiable Darwin-MFC counts
bash _paperpack/scripts/run_darwin_mfc_runtime_counts.sh

# Pack verification only
bash _paperpack/scripts/verify_pack.sh
```

### Do-Not-Do List

- Do not overclaim educational efficacy or clinical decision performance
- Do not include unanchored numerical claims
- Do not paste full scripts into the manuscript body
- Do not cite hidden or non-public sources
- Do not hardcode stale count targets as current truth
- Do not expose secrets, tokens, or credentials

---

## 12. Deployment

### Platforms
- **Frontend**: Vercel (https://darwinhub.org)
- **Database**: Supabase Cloud
- **iOS App**: App Store (planned)

### CI/CD Workflows

Located in `.github/workflows/`:

1. **test.yml** — Run on PR/push to main/develop
   - Type checking
   - Linting
   - Unit tests
   - Build verification
   - JSON-LD validation

2. **deploy.yml** — Deploy to Vercel on main branch

3. **release.yml** — Release automation

### Deployment Commands

```bash
# Production build
pnpm build

# Deploy to Vercel (CI handles this)
vercel --prod
```

### Docker (Optional)

Full stack available via Docker Compose:
```bash
# Start core services
docker-compose up postgres redis web

# Start with Supabase self-hosted
docker-compose --profile supabase up

# Start with monitoring
docker-compose --profile monitoring up
```

---

## Related Resources

- **Documentation**: `docs/` directory
- **Darwin-MFC**: https://github.com/agourakis82/darwin-mfc
- **Medical Data Package**: `@darwin-mfc/medical-data` on NPM
- **Live Site**: https://darwinhub.org

---

*This document is maintained for AI coding agents. For human contributors, see README.md and CONTRIBUTING.md.*
