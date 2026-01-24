# ENAMED 2025 ETL Pipeline

Complete ETL (Extract-Transform-Load) pipeline for importing ENAMED 2025 official microdata into Darwin Education.

## 🎯 Overview

This pipeline integrates three key data sources:

1. **IRT Parameters** (Microdata) - Official calibration from INEP
2. **Question Content** (INEP Portal PDFs) - Exam questions and answer key
3. **Participant Data** (Microdata) - ~915K exam responses for validation

## 📊 Data Statistics

| Component | Count | Source |
|-----------|-------|--------|
| Total exam items | 100 | ENAMED 2025 |
| Valid items (IRT params) | 90 | Microdata |
| Excluded items | 3 | Low fit statistics |
| Valid participants | ~900K | ENADE + Demais |
| Difficulty range (b) | -3.54 to +2.42 | Microdata |
| Biserial correlation | -0.15 to +0.65 | Microdata |

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 20+
node --version

# Copy microdata to project root
# The data should be at:
# ./microdados_enamed_2025_19-01-26/
```

### Installation

```bash
cd infrastructure/supabase/seed/enamed-2025-etl

# Option 1: Using pnpm (recommended)
pnpm install

# Option 2: Using npm
npm install

# Option 3: Manual (no package manager)
# Just run the scripts directly - TypeScript files use only Node builtins
node test-parse.mjs  # Test parsing
```

### Execution

```bash
# Full pipeline (requires PDF dependencies)
npx tsx index.ts --full

# IRT-only mode (just microdata, no PDF parsing)
npx tsx index.ts --irt-only

# Only download/parse PDFs
npx tsx index.ts --scrape

# Only parse microdata
npx tsx index.ts --parse

# Only validate scores
npx tsx index.ts --validate

# With sample size limit (testing)
npx tsx index.ts --sample 1000

# Verbose output
npx tsx index.ts --verbose
```

## 📁 Module Structure

```
enamed-2025-etl/
├── index.ts                    # Main orchestrator
├── config.ts                   # Constants & paths
├── types.ts                    # TypeScript definitions
│
├── scrapers/
│   ├── inep-portal.ts         # Download exam PDFs
│   └── pdf-parser.ts          # Extract questions from PDFs
│
├── parsers/
│   ├── item-parameters.ts     # Parse IRT microdata
│   └── participant-data.ts    # Parse exam responses
│
├── transformers/
│   ├── irt-estimator.ts       # Estimate discrimination (a)
│   ├── area-mapper.ts         # Map medical specialties
│   └── question-merger.ts     # Merge content + IRT
│
├── validators/
│   └── score-validator.ts     # Compare Darwin vs INEP
│
└── loaders/
    └── sql-generator.ts       # Generate Supabase seed SQL
```

## 🔄 Pipeline Workflow

### Phase 1: Extract

**IRT Parameters** (`microdados2025_parametros_itens.txt`)
- 93 items with difficulty (b), biserial, fit statistics
- 90 valid items (ITEM_MANTIDO=1)
- 3 excluded items (low fit)

**Exam PDFs** (INEP Portal)
- Caderno 1 & 2 (exam booklets)
- Answer key (gabarito)
- Cached locally for replay

**Participant Data** (Microdata)
- ENADE: ~915K records (23 files)
- Demais: ~26K records (13 files)
- Responses, scores, area breakdown

### Phase 2: Transform

**IRT Estimation**
```typescript
// Missing discrimination (a) estimated from biserial correlation
a = |biserial| × K_FACTOR  // K_FACTOR = 3.0 (tunable)
// Range: [0.3, 2.5]
// Fallback: 1.0 (Rasch model) if biserial < 0.05
```

**Area Mapping**
```typescript
// 5 medical specialties (20 questions each):
1: Clínica Médica (Internal Medicine)
2: Cirurgia (Surgery)
3: Pediatria (Pediatrics)
4: Ginecologia e Obstetrícia (OB/GYN)
5: Saúde Coletiva (Public Health)
```

**Question Merger**
- Match scraped PDFs with IRT params by item number
- Validate gabarito against scraped content
- Generate unique question IDs
- Create placeholders for missing content

### Phase 3: Validate

Compare Darwin TRI calculator against official PROFICIENCIA scores:

```typescript
Targets:
- Pearson correlation: > 0.95
- Mean Absolute Error: < 0.2 theta
- RMSE: < 0.3 theta
- 70%+ estimates within 0.25 theta
```

### Phase 4: Load

Generate Supabase seed SQL:
- `05_enamed_2025_questions.sql` - 90 complete questions
- `06_enamed_2025_statistics.sql` - Score distributions
- Validation report (JSON)

## 📋 Key IRT Parameters

| Parameter | Symbol | Range | Meaning |
|-----------|--------|-------|---------|
| Difficulty | b | -4 to +4 | Theta required for 50% P(correct) |
| Discrimination | a | 0.3-2.5 | How well item separates abilities |
| Guessing | c | 0.25 | Pseudo-chance (4-option MC) |
| Infit/Outfit | - | 0.5-1.5 | Model fit statistics |

**Formula** (3PL Model):
```
P(θ) = c + (1-c) / (1 + exp(-a(θ-b)))
```

## 🛠️ Configuration

Edit `config.ts` to adjust:

```typescript
// IRT Parameter Estimation
IRT_CONFIG = {
  K_FACTOR: 3.0,              // Calibration constant for a
  MIN_DISCRIMINATION: 0.3,    // Lower bound
  MAX_DISCRIMINATION: 2.5,    // Upper bound
  DEFAULT_DISCRIMINATION: 1.0,// Rasch fallback
  DEFAULT_GUESSING: 0.25,     // For 4-option MC
}

// Validation Thresholds
VALIDATION_THRESHOLDS = {
  MIN_CORRELATION: 0.9,
  MAX_MAE: 0.3,
  MAX_RMSE: 0.4,
  PERCENT_WITHIN_025: 0.7,
}
```

## 📊 Output Files

Generated in `outputs/` directory:

| File | Purpose | Size |
|------|---------|------|
| `05_enamed_2025_questions.sql` | Supabase seed SQL | ~500KB |
| `06_enamed_2025_statistics.sql` | Statistics table | ~50KB |
| `validation-report.json` | Validation metrics | ~100KB |
| `enamed_2025_*.pdf` | Cached exam PDFs | ~5MB each |

## 🧪 Testing

```bash
# Test parsing microdata (no dependencies)
node test-parse.mjs

# Output shows:
# - 90 valid items
# - Difficulty statistics
# - Biserial correlation stats
```

## ⚙️ Dependencies

### Built-in (Node.js)
- `fs` - File I/O
- `readline` - Stream parsing
- `path` - Path utilities
- `crypto` - UUID generation (v4)

### Optional (for full pipeline)
- `pdf-parse` - PDF text extraction
- `tsx` or `ts-node` - TypeScript execution
- `@darwin-education/shared` - TRI calculator (validation only)

### Installation
```bash
pnpm install pdf-parse
# or
npm install pdf-parse
```

## 🔗 Integration

### Import into Supabase

```bash
# After ETL completes, run:
psql $DATABASE_URL < infrastructure/supabase/seed/05_enamed_2025_questions.sql

# Verify:
SELECT COUNT(*) FROM questions WHERE year = 2025;  -- Should be ~90
SELECT * FROM enamed_statistics;
```

### Use in Darwin Application

```typescript
import { calculateTRIScore, estimateThetaEAP } from '@darwin-education/shared';

// Questions automatically available via Supabase
const exam = await db.from('exams').select('question_ids').single();
const questions = await db.from('questions').select().in('id', exam.question_ids);

// Score exam
const score = calculateTRIScore(responses, questionMap);
// Now aligned with official ENAMED scoring!
```

## 🐛 Troubleshooting

### PDF Download Fails
```bash
# PDFs are cached locally, retry uses cache
# Manual cache reset:
rm -rf infrastructure/supabase/seed/enamed-2025-etl/outputs/pdfs/*
```

### IRT Validation Low Correlation
Check `config.ts` K_FACTOR tuning:
```typescript
// Increase K_FACTOR if discrimination too low
// Decrease if too high
// Re-run validation after adjustment
```

### Missing Question Content
ETL falls back to IRT-only mode:
```bash
npx tsx index.ts --irt-only
# Generates placeholders with valid IRT params
# Content can be added manually later
```

## 📚 References

- **ENAMED**: Exame Nacional de Avaliação da Formação Médica
- **IRT/TRI**: Item Response Theory (Teoria de Resposta ao Item)
- **3PL**: 3-Parameter Logistic Model
- **Biserial Correlation**: Relationship between item score and total score
- **EAP**: Expected A Posteriori (theta estimation method)

## 📝 License

Darwin Education - Internal use only

## 🤝 Support

For issues with:
- **Microdata parsing**: Check microdata path in `config.ts`
- **PDF extraction**: Requires `pdf-parse` dependency
- **Validation errors**: Review `validation-report.json`
- **SQL generation**: Check Supabase schema compatibility
