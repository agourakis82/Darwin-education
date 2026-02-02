# QGen-DDL Integration Guide

## Overview

QGen-DDL is now fully integrated into Darwin-education. It provides:
- **Adaptive question generation** based on DDL (Differential Diagnosis of Learning) classifications
- **6-stage validation pipeline** for quality control
- **Medical accuracy verification** using LLM-based fact checking
- **IRT (Item Response Theory) calibration** for ENAMED alignment

## Quick Start

### 1. Database Setup

Apply the migration to your Supabase instance:

```bash
# In Supabase > SQL Editor, copy and run:
# File: infrastructure/supabase/migrations/qgen/001_qgen_core_tables.sql
# File: infrastructure/supabase/seed/qgen_misconceptions.sql
```

### 2. Environment Configuration

Add to `apps/web/.env.local`:

```env
# Existing variables (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# New: LLM Configuration
GROK_API_KEY=your-grok-api-key
```

### 3. Run the Application

```bash
cd /home/demetrios/Darwin-education

# Install dependencies (if needed)
pnpm install

# Build everything
pnpm build

# Start development server
pnpm dev
```

Visit: `http://localhost:3000/qgen`

## API Endpoints

### Single Question Generation
```bash
POST /api/qgen/generate
Content-Type: application/json

{
  "config": {
    "targetArea": "clinica_medica",
    "targetDifficulty": 3,
    "targetBloomLevel": "APPLICATION",
    "targetQuestionType": "CLINICAL_CASE",
    "requireClinicalCase": true
  },
  "validateAfterGeneration": true,
  "runMedicalVerification": true
}
```

### Batch Generation
```bash
POST /api/qgen/generate/batch
Content-Type: application/json

{
  "configs": [
    { "targetArea": "clinica_medica", "targetDifficulty": 3 },
    { "targetArea": "cirurgia", "targetDifficulty": 4 }
  ],
  "options": {
    "concurrency": 3,
    "retryAttempts": 2,
    "validateAfterGeneration": true
  }
}
```

### Full Exam Generation
```bash
POST /api/qgen/exam
Content-Type: application/json

{
  "examName": "ENAMED Simulado",
  "totalQuestions": 100,
  "requireClinicalCase": true
}
```

### DDL-Adaptive Question
```bash
POST /api/qgen/adaptive
Content-Type: application/json

{
  "ddlClassification": {
    "primary_type": "LE",
    "primary_confidence": "HIGH",
    "primary_probability": 0.85
  },
  "studentProfile": {
    "userId": "user123",
    "currentTheta": 0.5,
    "recentPerformance": [],
    "learningHistory": {
      "questionsAttempted": 50,
      "averageScore": 0.65,
      "weakAreas": ["Cardiologia"],
      "strongAreas": ["Pneumologia"]
    }
  }
}
```

## Features

### 1. Question Generation
- **Adaptive**: Generates questions based on DDL gap classifications
- **Calibrated**: Uses IRT 3PL model for ENAMED alignment
- **Diverse**: Supports clinical cases, conceptual, interpretation, and calculation questions
- **Bloom-aligned**: Generates at appropriate cognitive levels (K-C-A-An-S-E)

### 2. Validation Pipeline (6 stages)
1. **Structural**: Stem length, option count, format
2. **Linguistic**: Hedging markers, absolutes, readability
3. **Medical Accuracy**: Fact-checking via LLM
4. **Distractor Quality**: Plausibility, misconception targeting
5. **Originality**: Template detection
6. **IRT Estimation**: Difficulty and Bloom alignment

### 3. Medical Verification
- Detects outdated medical terms (e.g., "diabetes mellitus insulino-dependente" → "diabetes tipo 1")
- Flags dangerous treatment patterns (e.g., ASA in children with fever → Reye syndrome risk)
- Checks drug interactions automatically
- Validates clinical scenario plausibility

### 4. DDL Integration
Maps learning gap types to generation strategies:

| Gap Type | Bloom Levels | Question Type | Difficulty Mod | Focus |
|----------|---|---|---|---|
| **LE** (Epistemic) | K-C | Conceptual, Case | -0.5 | foundational concepts |
| **LEm** (Emotional) | C-A | Clinical Case | -0.3 | step-by-step reasoning |
| **LIE** (Integration) | An-S-E | Clinical Case | 0.0 | multi-concept integration |
| **MIXED** | C-A | Clinical Case | -0.2 | balanced approach |
| **NONE** | An-S-E | Challenging | +0.3 | push to next level |

## Monitoring & Analytics

Access the Analytics dashboard at `/qgen`:
- **Overview**: Generation count, approval rates, average quality scores
- **By Area**: Performance breakdown across 5 medical specialties
- **By Difficulty**: Distribution across difficulty levels 1-5
- **By Bloom Level**: Distribution across cognitive levels

## Troubleshooting

### Questions not generating
1. Check GROK_API_KEY is set correctly
2. Check Supabase connection with: `curl https://your-project.supabase.co/rest/v1/`
3. Check API logs at: http://localhost:3000/api/qgen/stats

### Validation failures
- Check validation service logs in browser console
- Visit `/qgen?tab=analytics` to see common failure patterns
- Review medical verification flags for accuracy issues

### Slow generation
- Reduce batch concurrency in settings (default: 3)
- Check GROK API rate limits
- Consider using lighter question types (Conceptual < Clinical Case)

## Architecture

```
┌─ Frontend (Next.js 15)
│  ├─ /qgen/page.tsx (Dashboard)
│  ├─ /qgen/components/* (UI Components)
│  └─ API Client Layer
│
├─ API Routes (/api/qgen/*)
│  ├─ /generate (single)
│  ├─ /generate/batch
│  ├─ /exam
│  ├─ /adaptive
│  ├─ /validate
│  ├─ /review
│  ├─ /stats
│  ├─ /misconceptions
│  └─ /corpus
│
├─ Services (TypeScript)
│  ├─ CorpusAnalysisService
│  ├─ PromptBuilderService
│  ├─ QGenGenerationService
│  ├─ QGenValidationService
│  ├─ DDLIntegrationService
│  └─ MedicalVerificationService
│
├─ Types (@darwin-education/shared)
│  ├─ QGenGeneratedQuestion
│  ├─ QGenValidationResult
│  ├─ QGenGenerationConfig
│  └─ ...
│
└─ Database (Supabase PostgreSQL)
   ├─ qgen_generated_questions
   ├─ qgen_validation_results
   ├─ qgen_misconceptions
   ├─ qgen_medical_areas
   └─ ... (15+ tables)
```

## Next Steps

### For Feature Enhancement
1. **Content Integration**: Add subject-specific content from Darwin-MFC
2. **Analytics**: Export generated questions to exams
3. **Feedback Loop**: Improve generation based on human reviews
4. **Caching**: Cache frequently generated question templates

### For Production Deployment
1. Monitor GROK API costs and set rate limits
2. Implement question deduplication
3. Add audit logging for compliance
4. Set up automated backup of generated questions
5. Consider implementing a question cache/registry

## Support

For issues or questions, refer to:
- Implementation Plan: `/home/demetrios/.claude/plans/composed-purring-pnueli.md`
- Full Transcript: `/home/demetrios/.claude/projects/-home-demetrios-Darwin-education/7c1d33a1-3e9f-4d9e-ad2f-75673deca6bc.jsonl`
