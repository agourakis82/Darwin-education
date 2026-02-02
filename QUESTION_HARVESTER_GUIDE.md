# Question Harvester Guide

## Overview

The Question Harvester is an automated system for collecting and parsing medical exam questions from Brazilian residency training exams (FMUSP, UNIFESP, ENARE, etc.).

## Quick Start

### 1. List Available Sources

```bash
cd packages/shared
pnpm harvest --sources
```

**Supported Sources:**
- FMUSP - Faculdade de Medicina da USP
- UNIFESP - Universidade Federal de São Paulo
- UNICAMP - Universidade Estadual de Campinas
- UFMG - Universidade Federal de Minas Gerais
- ENARE - Exame Nacional de Residência
- SUS-SP - Sistema de Residência do Estado de São Paulo
- AMRIGS - RS
- UERJ - Universidade do Estado do Rio de Janeiro

### 2. Process Downloaded PDFs

We already have PDFs in `packages/shared/provas-downloaded/`:

```bash
cd packages/shared
pnpm harvest --process ./provas-downloaded --output ./questoes-extracted
```

This will:
- Parse PDF files
- Extract question stems, options, and metadata
- Generate JSON files suitable for database import
- Output SQL insert statements

### 3. Vision Parser (Advanced - For Scanned PDFs)

For PDFs with complex layouts, scanned images, or tables, use the Vision Parser:

```bash
GROK_API_KEY=your_api_key pnpm harvest --process ./provas-downloaded --vision --output ./questoes-extracted
```

Alternatively with other providers:
```bash
ANTHROPIC_API_KEY=xxx pnpm harvest --process --vision
OPENAI_API_KEY=xxx pnpm harvest --process --vision
TOGETHER_API_KEY=xxx pnpm harvest --process --vision
```

## Advanced Usage

### Batch Download All Exams

```bash
pnpm harvest --batch --output ./provas
pnpm harvest --batch fmusp --output ./provas/usp
pnpm harvest --batch enare --concurrency 10
```

### Search Specific Exams

```bash
pnpm harvest --search "FMUSP 2024" --max 5
pnpm harvest --source enare --year 2024
```

### Process with OCR

For PDFs without embedded text:

```bash
pnpm harvest --process ./provas --ocr --output ./questoes
```

## Processing Pipeline

1. **PDF Download** → `./provas-downloaded/`
2. **PDF Parsing** → Extract questions, options, areas, difficulty
3. **LLM Classification** → Use LLM to classify area, topics, difficulty
4. **JSON Generation** → `./questoes-extracted/` (JSON format)
5. **SQL Generation** → Ready for Supabase import
6. **Database Import** → Run SQL in Supabase

## Output Format

### JSON Structure

```json
{
  "id": "q-source-1",
  "stem": "Question text...",
  "options": [
    { "letter": "A", "text": "Option text" },
    { "letter": "B", "text": "Option text" }
  ],
  "correctAnswer": "A",
  "area": "Clínica Médica",
  "topics": ["Topic1", "Topic2"],
  "difficulty": "medium",
  "icd10Codes": ["I10"],
  "atcCodes": ["C03DA01"]
}
```

### SQL Output

The SQL is ready for direct import into Supabase:

```sql
INSERT INTO questions (id, bank_id, stem, options, correct_index, area, irt_difficulty, year, validated_by)
VALUES (...)
```

## Environment Variables

For different LLM providers:

```bash
# Grok (Recommended - cheapest)
export GROK_API_KEY=xxx

# OpenAI GPT-4o
export OPENAI_API_KEY=xxx

# Claude (Anthropic)
export ANTHROPIC_API_KEY=xxx

# Together AI (Budget option)
export TOGETHER_API_KEY=xxx

# Groq (Free tier available)
export GROQ_API_KEY=xxx

# Brave Search (optional)
export BRAVE_API_KEY=xxx
```

## Current Status

**Already Processed:**
- 20 ENAMED 2025 questions extracted and populated in seed file
- Full question content with IRT parameters
- Ready for database import

**Next Steps:**
1. Process additional downloaded PDFs
2. Generate SQL import scripts
3. Import into Supabase question_banks table
4. Validate correctness of extracted questions
5. Add more exams (FMUSP, UNIFESP, ENARE)

## Troubleshooting

### PDF parsing fails
→ Try with `--vision` flag for complex layouts

### Questions not classified correctly
→ Check if LLM API key is set correctly
→ Review question topics and adjust classification prompts

### Encoding issues with special characters
→ Ensure UTF-8 encoding in output files

## Integration with Exam Generation

Once questions are imported into Supabase:

```typescript
import { ENAMEDQuestion } from '@darwin-education/shared';

// Questions available for:
- Simulado (mock exams)
- Montar Prova (custom exam builder)
- Triagem (diagnostic assessment)
- Flashcards (spaced repetition)
```

## Next: Use with QGen

The harvested questions can be used as a corpus for QGen:

```typescript
// Analyze corpus similarity
const features = await corpusAnalysisService.analyzeQuestion(
  questionId,
  stem,
  options,
  correctAnswer
);

// Generate similar questions
const newQuestion = await qgenGenerationService.generateQuestion({
  targetArea: 'clinica_medica',
  targetTopic: 'hypertension',
  targetDifficulty: 2.5
});
```
