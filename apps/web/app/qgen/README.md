# QGen-DDL Dashboard

## Overview

The QGen-DDL (Question Generation with Differential Diagnosis of Learning) dashboard provides a comprehensive interface for generating, validating, and managing high-quality medical exam questions calibrated for ENAMED (Brazilian medical licensing exam).

## Features

### 1. **Generate Tab** - Single Question Generation
Create individual questions with full configuration:
- **Area Selection**: Choose from 5 medical specialties (Clínica Médica, Cirurgia, GO, Pediatria, Saúde Coletiva)
- **Topic Targeting**: Optional specific topic selection within each area
- **Difficulty Level**: 1 (easy) to 5 (hard) with IRT calibration
- **Cognitive Level**: Select from Bloom's taxonomy (K, C, A, An, S, E)
- **Question Type**: Conceptual, Clinical Case, Interpretation, or Calculation
- **Clinical Case Toggle**: Require or allow medical vignettes

**Output**:
- Full question with stem, 4 options, and explanation
- IRT parameters (difficulty, discrimination, guessing probability)
- Validation score with flags
- Generation time

### 2. **Batch Tab** - Bulk Question Generation
Generate multiple questions efficiently:
- **Quantity**: 5-50 questions per batch
- **Difficulty Range**: Set min-max difficulty spread
- **Bloom Level Selection**: Choose which cognitive levels to include
- **Concurrency Control**: Adjust parallel generation (1-5)
- **Area Selection**: Single area or mixed (up to 50 questions)

**Output**:
- Summary: total, successful, failed, execution time
- Individual results with success/failure indicators
- Real-time progress tracking

### 3. **Exam Tab** - Full Exam Generation
Create complete exams following ENAMED guidelines:
- **Exam Configuration**:
  - Custom name (e.g., "ENAMED Simulado 2024")
  - Question count: 20-200 (typical: 100)
  - Area distribution: ENAMED default or customized
  - Clinical case requirement

- **Automatic Features**:
  - Balanced difficulty distribution
  - Proportional area coverage
  - Bloom level variety
  - Individual validation

**Output**:
- Exam ID for tracking
- Complete question set with metadata
- Area breakdown statistics
- Difficulty distribution
- Average validation score

### 4. **Analytics Tab** - Generation Statistics
Real-time monitoring dashboard:

**Overview Metrics**:
- Total questions generated
- Approved, pending, rejected counts
- Overall approval rate (%)
- Average validation score (%)

**Breakdowns**:
- **By Area**: Distribution across specialties with approval rates
- **By Difficulty**: 1-5 scale with quality scores
- **By Bloom Level**: K, C, A, An, S, E distribution

**Quality Insights**:
- Common validation flags
- Medical accuracy issues
- Distractor quality metrics
- Originality assessment

### 5. **Review Tab** - Human Review Queue
Manage quality assurance:

**Review Queue**:
- Sortable by area, priority (HIGH/MEDIUM/LOW)
- Priority based on validation score (low score = high priority)
- Question preview with metadata
- Validation flags highlighted

**Review Actions**:
- ✓ **Approve**: Pass directly to question bank
- ✎ **Revise**: Edit stem, options, or explanation
- ✕ **Reject**: Remove with feedback

**Feedback System**:
- Quality ratings (medical accuracy, clarity, distractor quality)
- Text feedback for revisions
- Automatic status updates

## Usage Flow

### Scenario 1: Generate Single Question
1. Open **Generate tab**
2. Select area: "Clínica Médica"
3. Select topic: "Cardiologia" (optional)
4. Set difficulty: 3 (medium)
5. Click "Gerar Questão"
6. Review preview with validation score
7. If quality ≥ 70%, can proceed to batch or review

### Scenario 2: Create ENAMED Simulado
1. Open **Exam tab**
2. Name: "ENAMED Simulado Mensal"
3. Questions: 100
4. Distribution: ENAMED (automatic)
5. Click "Gerar Prova (100 questões)"
6. Wait for generation (2-3 min)
7. Export or use directly in adaptive system

### Scenario 3: Review Generated Questions
1. Open **Review tab**
2. Filter by priority: "HIGH"
3. Review failing validation items
4. Either approve, revise, or reject
5. Monitor approval rate in **Analytics tab**

### Scenario 4: DDL-Adaptive Generation
Use programmatically:
```javascript
const response = await fetch('/api/qgen/adaptive', {
  method: 'POST',
  body: JSON.stringify({
    ddlClassification: {
      primary_type: 'LE', // Epistemic gap
      primary_confidence: 'HIGH',
      primary_probability: 0.85
    },
    studentProfile: {
      userId: 'student123',
      currentTheta: 0.5,
      recentPerformance: [],
      learningHistory: {
        questionsAttempted: 50,
        averageScore: 0.65,
        weakAreas: ['Cardiologia'],
        strongAreas: ['Pneumologia']
      }
    }
  })
});
```

## Configuration Options

### Target Areas
- `clinica_medica`: Internal Medicine (30%)
- `cirurgia`: Surgery (20%)
- `ginecologia_obstetricia`: OB/GYN (15%)
- `pediatria`: Pediatrics (15%)
- `saude_coletiva`: Public Health (20%)

### Bloom Levels
1. **KNOWLEDGE** (K): Remember facts
2. **COMPREHENSION** (C): Explain concepts
3. **APPLICATION** (A): Apply knowledge
4. **ANALYSIS** (An): Analyze relationships
5. **SYNTHESIS** (S): Create new understanding
6. **EVALUATION** (E): Make judgments

### Question Types
- **CLINICAL_CASE**: Medical vignette (realistic scenario)
- **CONCEPTUAL**: Direct knowledge/understanding
- **INTERPRETATION**: Analyze data/findings
- **CALCULATION**: Compute values/dosages

### Difficulty Levels
| Level | ENAMED % | Focus |
|-------|----------|-------|
| 1 (Easy) | 10% | Foundational knowledge |
| 2 (Easy-Med) | 20% | Basic application |
| 3 (Medium) | 40% | Standard application |
| 4 (Med-Hard) | 20% | Complex scenarios |
| 5 (Hard) | 10% | Expert-level synthesis |

## Technical Details

### Validation Pipeline (6 Stages)

1. **Structural** (15% weight)
   - Stem length: 50-500 characters
   - Option count: exactly 4
   - One correct answer
   - Balanced option lengths

2. **Linguistic** (15% weight)
   - Hedging markers: ≤2 per question
   - Absolute terms: appropriate usage
   - Readability: 8-16 grade level
   - Negative stems: avoided when possible

3. **Medical Accuracy** (25% weight)
   - LLM fact-checking
   - Outdated term detection
   - Dangerous pattern flagging
   - Clinical plausibility

4. **Distractor Quality** (20% weight)
   - Plausibility: 0.3-0.9 per distractor
   - Misconception targeting
   - Differentiation from correct answer
   - Avoid implausible options

5. **Originality** (10% weight)
   - Template detection
   - Similarity to corpus
   - Unique clinical scenarios

6. **IRT Estimation** (15% weight)
   - Difficulty alignment (-4 to +4)
   - Bloom level match
   - Discrimination potential (0-2)
   - Guessing probability

### Validation Decision
- **AUTO_APPROVE** (≥85%): Pass directly to bank
- **PENDING_REVIEW** (70-84%): Requires human review
- **NEEDS_REVISION** (50-69%): Edit before approval
- **REJECT** (<50% or dangerous patterns): Discard

### DDL Integration Mapping

When a student's DDL classification is received (e.g., LE = epistemic gap):

| Lacuna Type | Strategy | Difficulty Mod | Target Misconceptions |
|---|---|---|---|
| LE (Epistemic) | Foundational | -0.5 | Factual errors, confusion |
| LEm (Emotional) | Confidence-building | -0.3 | Overthinking, anxiety-induced |
| LIE (Integration) | Multi-concept | 0.0 | Incomplete connections |
| MIXED | Balanced | -0.2 | Multiple gaps |
| NONE | Advancement | +0.3 | Expert traps |

## Performance & Costs

### Generation Speed
- Single question: 10-20s
- Batch (10 questions): 30-50s
- Exam (100 questions): 2-3 minutes

### API Usage
- Grok LLM: ~500-800 tokens per question
- Validation: ~300-500 tokens per question
- Medical verification: ~200-400 tokens per question

### Storage
- ~2-3 KB per generated question
- Validation results: ~500 bytes
- Medical verification: ~1 KB

## Troubleshooting

### Questions not generating
```bash
# Check server logs
tail -f ~/.pm2/logs/next-error.log

# Test API directly
curl -X POST http://localhost:3000/api/qgen/generate \
  -H 'Content-Type: application/json' \
  -d '{"config": {"targetArea": "clinica_medica"}}'
```

### Slow generation
- Reduce concurrency in Batch tab
- Check GROK API rate limits
- Check network latency to Supabase
- Consider generating during off-peak hours

### Validation failures
- Check medical verification logs in browser console
- Review specific validation stage scores
- Consider relaxing medical accuracy threshold

## Integration with Darwin-Education

### Using Generated Questions
```typescript
// In simulado/page.tsx
import { useQGenQuestions } from '@/hooks/useQGenQuestions';

export function SimuladoPage() {
  const { questions, loading } = useQGenQuestions({
    count: 100,
    areas: ['clinica_medica', 'cirurgia']
  });

  // Render exam with TRI scoring
}
```

### Adaptive Question Selection
```typescript
// In trilhas/page.tsx
import { ddlIntegrationService } from '@/lib/qgen';

// Based on DDL classification, get adaptive questions
const mapping = ddlIntegrationService.generateAdaptiveQuestion(
  ddlClassification,
  studentProfile
);

// Pass to generateQuestion API
const question = await fetch('/api/qgen/generate', {
  method: 'POST',
  body: JSON.stringify({ config: mapping.config })
});
```

## Future Enhancements

- [ ] Question deduplication across corpus
- [ ] Template-based generation for consistency
- [ ] Multi-language support (English, Spanish)
- [ ] Export to Moodle/LMS formats
- [ ] Automatic question optimization based on student performance data
- [ ] Integration with Darwin-MFC medical reference data
- [ ] Real-time collaboration for review
- [ ] Advanced analytics: question difficulty curve, discrimination index

## Support

For detailed information:
- **Integration Guide**: `/home/demetrios/Darwin-education/INTEGRATION.md`
- **API Documentation**: See `/api/qgen/*` route files
- **Test Script**: `scripts/test-qgen.sh`

For issues or improvements:
- Check browser console for errors
- Review API logs in browser Network tab
- Run `/scripts/test-qgen.sh` to verify integration
