# ETL Framework Implementation Summary

**Date:** 2026-01-24
**Status:** Phase 1 - Foundation Complete ✅

## What Has Been Built

### 1. etl-core Framework
Complete reusable ETL infrastructure for question source plugins.

**Directory Structure:**
```
infrastructure/supabase/seed/etl-core/
├── types/
│   └── plugin.ts              # Plugin interface definitions (ETLPlugin, CompleteQuestion, etc.)
├── utils/
│   ├── cache.ts               # CacheManager class for PDF caching
│   ├── sql.ts                 # SQL utilities (sqlValue, escapeSql, generateInsert, generateUpsert)
│   ├── http.ts                # HTTP downloader with retry logic
│   ├── pdf.ts                 # PDF text extraction and question pattern matching
│   └── irt.ts                 # IRT parameter estimation (metadata-based)
├── registry/
│   ├── plugin-registry.ts     # PluginRegistry class for plugin discovery
│   ├── plugin-runner.ts       # runPlugin() executor with full error handling
│   └── validators/            # (Future: schema, IRT, content validators)
└── README.md                  # (To be created: framework documentation)
```

**Core Files Created:**
- `etl-core/types/plugin.ts` (187 lines)
  - `ETLPlugin` interface: scrape → parse → transform → validate → load pipeline
  - `CompleteQuestion` interface with IRT parameters and metadata
  - `QuestionMetadata` for tracking institution tier, exam type, position, area

- `etl-core/utils/cache.ts` (66 lines)
  - `CacheManager` class: ensureCacheDir, getCachePath, isCached, saveToCache, readFromCache

- `etl-core/utils/sql.ts` (102 lines)
  - `sqlValue()`: Safe SQL conversion for any type (includes JSONB handling)
  - `escapeSql()`: Single quote escaping
  - `generateInsert()`, `generateUpsert()`: SQL generation
  - `formatOptionsAsJsonb()`: Question options → JSONB array
  - `generateDeterministicId()`: Reproducible question IDs

- `etl-core/utils/http.ts` (88 lines)
  - `downloadFile()`: Retry logic with exponential backoff, PDF validation, timeout handling
  - `urlAccessible()`: HEAD request to test URL availability

- `etl-core/utils/pdf.ts` (139 lines)
  - `extractPDFText()`: pdf-parse wrapper (with fallback error message)
  - `extractQuestionsFromText()`: Multiple regex patterns for question extraction
  - `extractAnswerKey()`: Gabarito extraction from PDF text
  - `extractOptions()`: Multiple choice options parsing
  - `cleanPDFText()`: PDF text normalization

- `etl-core/utils/irt.ts` (171 lines)
  - `estimateIRTFromMetadata()`: Metadata-based IRT parameter estimation
  - `validateIRTParameters()`: Bounds checking
  - `formatIRTParameters()`: Display formatting

- `etl-core/registry/plugin-registry.ts` (49 lines)
  - `PluginRegistry` class: register, get, list, has, getTotalQuestionCount, getSummary

- `etl-core/registry/plugin-runner.ts` (119 lines)
  - `runPlugin()`: Execute single plugin with full pipeline
  - `runPluginsInParallel()`: Batch execution with summary reporting

### 2. Metadata-Based IRT Estimation (in shared package)

**Files Created:**
- `packages/shared/src/config/irt-estimation-config.ts` (113 lines)
  - `IRT_ESTIMATION_CONFIG`: Default configuration with all coefficients
  - Institution tier classifications (TIER_1_NATIONAL, TIER_2_REGIONAL_STRONG, TIER_3_REGIONAL)
  - Exam type mappings (R1, R2, R3, national, concurso)
  - Area name mappings to Darwin's 5 medical specialties

- `packages/shared/src/calculators/irt-estimation.ts` (182 lines)
  - `estimateIRTFromMetadata()`: Combined heuristic estimation
  - `validateIRTParameters()`: Bounds validation
  - `formatIRTParameters()`: Display formatting
  - `calculateConfidenceIntervals()`: Uncertainty quantification

**Estimation Algorithm:**
- **Difficulty (b):** baseValue + institutionAdj + yearDrift + examTypeAdj + positionAdj + areaAdj
  - Institution tier: TIER_1_NATIONAL +0.4, TIER_3_REGIONAL -0.25
  - Year drift: +0.1 per year older (older exams easier)
  - Position: Q1 -0.3, middle 0, Q100 +0.3 (early questions easier)
  - Area: surgery +0.15, public health -0.15
  - Bounds: [-2.5, +2.5]

- **Discrimination (a):** baseValue × institutionMult × examTypeMult
  - Institution tier: TIER_1_NATIONAL 1.2×, TIER_3_REGIONAL 0.9×
  - Exam type: R1 1.1×, national 1.15×
  - Bounds: [0.7, 1.4]

- **Guessing (c):** 0.25 for 4-option, 0.20 for 5-option

- **Confidence:** 0.8 for TIER_1, 0.7 for TIER_2, 0.5 for TIER_3

## Architecture

### Plugin Lifecycle
```
ETLPlugin
├── initialize()          # Setup (create dirs, connect to DB)
├── scrape()             # Download PDFs/data from source
├── parse()              # Extract raw questions from PDFs
├── transform()          # Add IRT, metadata, area classification
├── validate()           # Check quality and bounds
└── load()               # Generate SQL and return file path
```

### Data Flow
```
Raw PDF → Text → Questions → Options Parsed → IRT Estimated →
SQL Generated → File Path Returned
```

### Type System
- `RawQuestion`: stem, options, correctAnswer (from PDF)
- `ParsedQuestions`: array of RawQuestion + parse stats
- `CompleteQuestion`: RawQuestion + IRT parameters + metadata
- `CompleteQuestions`: array of CompleteQuestion + validation stats

## Plugin Interface

```typescript
export interface ETLPlugin {
  id: string;                    // e.g., 'enare-2024'
  name: string;
  description: string;
  version: string;

  initialize(): Promise<void>;
  scrape(): Promise<ScrapedData>;
  parse(data: ScrapedData): Promise<ParsedQuestions>;
  transform(questions: ParsedQuestions): Promise<CompleteQuestions>;
  validate(questions: CompleteQuestions): Promise<ValidationResult>;
  load(questions: CompleteQuestions): Promise<string>;

  estimatedQuestionCount(): number;
  supportedYears(): number[];
  requiresManualSetup(): boolean;
}
```

## Next Steps

### Phase 2: ENAMED Refactoring
- Move `enamed-2025-etl/` → `sources/enamed-2025/`
- Create `sources/enamed-2025/plugin.ts` implementing ETLPlugin
- Update imports to use etl-core utilities
- Verify generated SQL matches existing `05_enamed_2025_questions.sql`

### Phase 3: New Plugins Implementation
1. **ENARE** (300 questions)
   - URL: `https://conhecimento.fgv.br/concursos/enare{YY}`
   - FGV table-based PDF format
   - Institution tier: TIER_1_NATIONAL

2. **USP/UNIFESP** (500 questions)
   - URL: `https://www.fuvest.br/residencia-medica/provas-anteriores/`
   - Varied PDF formats across years
   - Handle specialty-specific exams

3. **REVALIDA** (250 questions)
   - URL: INEP portal (same as ENAMED)
   - INEP standard format
   - Skip discursive; objective only
   - Institution tier: TIER_1_NATIONAL but low area confidence

4. **Regional** (1,200 questions)
   - AMRIGS (RS), SURCE (CE), SUS-SP (Quadrix)
   - Different formats by organizing body
   - Institution tier: TIER_2_REGIONAL_STRONG or TIER_3_REGIONAL

### Phase 4: Unified CLI
- `infrastructure/supabase/seed/etl.ts` entry point
- Commands: list, run, batch, info
- Add to package.json: `"etl": "tsx infrastructure/supabase/seed/etl.ts"`

### Phase 5: Database Schema
- Add columns for IRT metadata tracking
- Create indices for low-confidence questions
- Create view for admin review queue

## Quick Reference

### Create a New Plugin

1. Create `sources/{plugin-id}/plugin.ts`:
```typescript
import type { ETLPlugin } from '../../etl-core/types/plugin';

export class MyPlugin implements ETLPlugin {
  id = 'my-plugin';
  name = 'My Source';
  description = 'Description';
  version = '1.0.0';

  async initialize() { /* setup */ }
  async scrape() { /* download PDFs */ }
  async parse(data) { /* extract questions */ }
  async transform(questions) { /* add IRT */ }
  async validate(questions) { /* check quality */ }
  async load(questions) { /* generate SQL */ }

  estimatedQuestionCount() { return 100; }
  supportedYears() { return [2024]; }
  requiresManualSetup() { return false; }
}
```

2. Register in CLI:
```typescript
registry.register(new MyPlugin());
```

3. Run:
```bash
pnpm etl run my-plugin
```

## Verification Checklist

- ✅ etl-core directory structure created
- ✅ Plugin interface defined
- ✅ Core utilities implemented (cache, SQL, HTTP, PDF, IRT)
- ✅ Plugin registry and runner created
- ✅ Metadata-based IRT estimation in shared package
- ⏳ ENAMED refactored as first plugin (in progress)
- ⏳ CLI implementation
- ⏳ Database schema updates
- ⏳ New plugins (ENARE, USP, REVALIDA, Regional)

## Statistics

**Framework Size:**
- etl-core: ~880 lines of TypeScript
- shared package: ~295 lines of TypeScript
- Total: ~1,175 lines of reusable infrastructure

**Expected Question Coverage:**
- Phase 1 (Foundation): 90 (ENAMED only)
- After ENAMED refactor: 90
- After ENARE: 390
- After USP/UNIFESP: 890
- After REVALIDA: 1,140
- After Regional: 2,340+

---

**Status:** Framework foundation complete ✅ Ready for plugin implementation
