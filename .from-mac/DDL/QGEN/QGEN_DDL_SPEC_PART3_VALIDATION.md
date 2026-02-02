# QGen-DDL: Sistema de Geração de Questões Médicas
## PARTE 3: PIPELINE DE VALIDAÇÃO E SERVICES

---

## 1. Arquitetura do Pipeline de Validação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       VALIDATION PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                            │
│  │  GENERATED  │                                                            │
│  │  QUESTION   │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STAGE 1: STRUCTURAL VALIDATION                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │   JSON      │  │  Required   │  │  Format     │                  │    │
│  │  │   Schema    │  │  Fields     │  │  Checks     │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  │  Pass/Fail: Hard validation - rejects malformed questions            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STAGE 2: LINGUISTIC ANALYSIS                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │  Hedging    │  │  Length     │  │  Grammar    │                  │    │
│  │  │  Detection  │  │  Balance    │  │  Check      │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  │  Score: 0-1 - flags linguistic issues                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STAGE 3: MEDICAL ACCURACY CHECK                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │  Knowledge  │  │  Guideline  │  │  Dose/Drug  │                  │    │
│  │  │  Base Check │  │  Compliance │  │  Validation │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  │  Score: 0-1 - critical for medical content                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STAGE 4: DISTRACTOR QUALITY                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │ Plausibility│  │  Semantic   │  │ Misconception│                 │    │
│  │  │   Scoring   │  │ Similarity  │  │  Coverage    │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  │  Score: 0-1 - measures discriminative potential                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STAGE 5: ORIGINALITY CHECK                        │    │
│  │  ┌─────────────┐  ┌─────────────┐                                   │    │
│  │  │  Embedding  │  │  Corpus     │                                   │    │
│  │  │  Generation │  │  Similarity │                                   │    │
│  │  └─────────────┘  └─────────────┘                                   │    │
│  │  Score: 0-1 - ensures originality (reject if >0.85 similarity)       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STAGE 6: IRT ESTIMATION                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │  Difficulty │  │Discrimination│ │  Target     │                  │    │
│  │  │  Estimation │  │  Estimation │  │  Alignment  │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  │  Score: 0-1 - measures psychometric appropriateness                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    AGGREGATION & DECISION                            │    │
│  │                                                                      │    │
│  │  Weighted Score = Σ(stage_score × weight)                           │    │
│  │                                                                      │    │
│  │  Weights:                                                            │    │
│  │  • Medical Accuracy: 0.30                                           │    │
│  │  • Distractor Quality: 0.25                                         │    │
│  │  • Linguistic Quality: 0.20                                         │    │
│  │  • Originality: 0.15                                                │    │
│  │  • IRT Alignment: 0.10                                              │    │
│  │                                                                      │    │
│  │  Decision:                                                           │    │
│  │  • Score ≥ 0.85: AUTO_APPROVE                                       │    │
│  │  • Score 0.70-0.84: PENDING_REVIEW                                  │    │
│  │  • Score 0.50-0.69: NEEDS_REVISION                                  │    │
│  │  • Score < 0.50: REJECT                                             │    │
│  │  • Medical Accuracy < 0.70: REJECT (override)                       │    │
│  │  • Originality < 0.15: REJECT (override)                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    OUTPUT                                            │    │
│  │                                                                      │    │
│  │  • Validated Question (with scores)                                 │    │
│  │  • Validation Report                                                │    │
│  │  • Suggested Improvements                                           │    │
│  │  • Human Review Queue (if PENDING_REVIEW)                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Validation Service Implementation

```typescript
// ============================================================
// QGEN VALIDATION SERVICE
// src/lib/qgen/services/validation-service.ts
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  ExtractedFeatures,
  LinguisticFeatures,
  DistractorFeatures,
  LINGUISTIC_PATTERNS,
} from '../types/features';
import { QUALITY_VALIDATION_PROMPT } from '../prompts/quality-validator';

// ============================================================
// TYPES
// ============================================================

interface ValidationResult {
  questionId: string;
  timestamp: string;
  
  // Stage results
  stages: {
    structural: StructuralValidationResult;
    linguistic: LinguisticValidationResult;
    medicalAccuracy: MedicalAccuracyResult;
    distractorQuality: DistractorQualityResult;
    originality: OriginalityResult;
    irtAlignment: IRTAlignmentResult;
  };
  
  // Aggregated scores
  scores: {
    structural: number;      // 0 or 1 (pass/fail)
    linguistic: number;      // 0-1
    medicalAccuracy: number; // 0-1
    distractorQuality: number; // 0-1
    originality: number;     // 0-1
    irtAlignment: number;    // 0-1
    weighted: number;        // 0-1
  };
  
  // Decision
  decision: 'AUTO_APPROVE' | 'PENDING_REVIEW' | 'NEEDS_REVISION' | 'REJECT';
  decisionReason: string;
  
  // Issues and suggestions
  issues: ValidationIssue[];
  suggestions: string[];
  
  // For human review
  humanReviewRequired: boolean;
  reviewPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface StructuralValidationResult {
  passed: boolean;
  hasValidJSON: boolean;
  hasAllRequiredFields: boolean;
  hasValidAlternatives: boolean;
  hasValidGabarito: boolean;
  errors: string[];
}

interface LinguisticValidationResult {
  score: number;
  stemAnalysis: {
    hedgingCount: number;
    absoluteCount: number;
    isNegativeStem: boolean;
    negativeHighlighted: boolean;
  };
  alternativesAnalysis: {
    lengthVariance: number;
    correctAnswerLengthRatio: number;
    absoluteInCorrect: boolean;
    grammaticalIssues: string[];
  };
  readabilityScore: number;
  issues: string[];
}

interface MedicalAccuracyResult {
  score: number;
  llmAssessment: {
    factuallyCorrect: boolean;
    guidelineCompliant: boolean;
    dosesCorrect: boolean;
    diagnosisAccurate: boolean;
    treatmentAppropriate: boolean;
  };
  flaggedConcerns: string[];
  confidence: number;
}

interface DistractorQualityResult {
  score: number;
  perDistractor: Record<string, {
    plausibilityScore: number;
    semanticSimilarityToCorrect: number;
    type: string;
    targetsMisconception: boolean;
  }>;
  overallPlausibility: number;
  typeDistribution: Record<string, number>;
  misconceptionCoverage: number;
}

interface OriginalityResult {
  score: number;
  maxSimilarity: number;
  mostSimilarId: string | null;
  mostSimilarText: string | null;
  isOriginal: boolean;
}

interface IRTAlignmentResult {
  score: number;
  estimatedDifficulty: number;
  targetDifficulty: number;
  difficultyDeviation: number;
  estimatedDiscrimination: number;
  bloomLevelMatch: boolean;
}

interface ValidationIssue {
  stage: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  suggestion: string;
}

// ============================================================
// VALIDATION SERVICE
// ============================================================

export class QGenValidationService {
  private supabase: SupabaseClient;
  private anthropic: Anthropic;
  private embeddingModel: string = 'text-embedding-ada-002';
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  // ============================================================
  // MAIN VALIDATION PIPELINE
  // ============================================================

  async validateQuestion(
    question: any,
    targetConfig: {
      area: string;
      topic: string;
      difficulty: number;
      bloomLevel: string;
    }
  ): Promise<ValidationResult> {
    const questionId = question.id || crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Stage 1: Structural Validation
    const structuralResult = this.validateStructure(question);
    if (!structuralResult.passed) {
      return this.buildRejectionResult(questionId, timestamp, structuralResult, 'STRUCTURAL_FAILURE');
    }
    
    // Stage 2: Linguistic Analysis
    const linguisticResult = this.analyzeLinguistics(question);
    
    // Stage 3: Medical Accuracy (LLM-based)
    const medicalResult = await this.checkMedicalAccuracy(question);
    
    // Stage 4: Distractor Quality
    const distractorResult = await this.analyzeDistractors(question);
    
    // Stage 5: Originality Check
    const originalityResult = await this.checkOriginality(question);
    
    // Stage 6: IRT Alignment
    const irtResult = await this.estimateIRT(question, targetConfig);
    
    // Aggregate and decide
    return this.aggregateResults(
      questionId,
      timestamp,
      {
        structural: structuralResult,
        linguistic: linguisticResult,
        medicalAccuracy: medicalResult,
        distractorQuality: distractorResult,
        originality: originalityResult,
        irtAlignment: irtResult,
      },
      targetConfig
    );
  }

  // ============================================================
  // STAGE 1: STRUCTURAL VALIDATION
  // ============================================================

  private validateStructure(question: any): StructuralValidationResult {
    const errors: string[] = [];
    
    // Check JSON structure
    const hasValidJSON = typeof question === 'object' && question !== null;
    if (!hasValidJSON) {
      errors.push('Invalid JSON structure');
    }
    
    // Check required fields
    const requiredFields = ['enunciado', 'alternativas', 'gabarito'];
    const hasAllRequiredFields = requiredFields.every(field => {
      const has = question.questao?.[field] !== undefined;
      if (!has) errors.push(`Missing required field: ${field}`);
      return has;
    });
    
    // Check alternatives
    const alternatives = question.questao?.alternativas;
    const hasValidAlternatives = 
      alternatives && 
      typeof alternatives === 'object' &&
      Object.keys(alternatives).length >= 4 &&
      Object.keys(alternatives).length <= 5 &&
      Object.values(alternatives).every(v => typeof v === 'string' && v.length > 0);
    
    if (!hasValidAlternatives) {
      errors.push('Invalid alternatives structure (need 4-5 non-empty strings)');
    }
    
    // Check gabarito
    const gabarito = question.questao?.gabarito;
    const validGabaritos = ['A', 'B', 'C', 'D', 'E'];
    const hasValidGabarito = 
      typeof gabarito === 'string' && 
      validGabaritos.includes(gabarito) &&
      alternatives?.[gabarito] !== undefined;
    
    if (!hasValidGabarito) {
      errors.push(`Invalid gabarito: ${gabarito}`);
    }
    
    return {
      passed: hasValidJSON && hasAllRequiredFields && hasValidAlternatives && hasValidGabarito,
      hasValidJSON,
      hasAllRequiredFields,
      hasValidAlternatives,
      hasValidGabarito,
      errors,
    };
  }

  // ============================================================
  // STAGE 2: LINGUISTIC ANALYSIS
  // ============================================================

  private analyzeLinguistics(question: any): LinguisticValidationResult {
    const stem = question.questao?.enunciado || '';
    const alternatives = question.questao?.alternativas || {};
    const gabarito = question.questao?.gabarito || '';
    const issues: string[] = [];
    
    // Analyze stem
    const stemHedging = this.countPatterns(stem, LINGUISTIC_PATTERNS.hedgingMarkers);
    const stemAbsolute = this.countPatterns(stem, LINGUISTIC_PATTERNS.absoluteMarkers);
    const isNegativeStem = LINGUISTIC_PATTERNS.negativeStems.some(
      pattern => stem.toLowerCase().includes(pattern)
    );
    const negativeHighlighted = isNegativeStem && 
      /\b(EXCETO|NÃO|INCORRET|ERRAD)/i.test(stem);
    
    if (isNegativeStem && !negativeHighlighted) {
      issues.push('Negative stem not highlighted (should use CAPS)');
    }
    
    // Analyze alternatives
    const altLengths = Object.entries(alternatives).map(([key, text]) => ({
      key,
      length: (text as string).split(/\s+/).length,
      isCorrect: key === gabarito,
    }));
    
    const avgLength = altLengths.reduce((sum, a) => sum + a.length, 0) / altLengths.length;
    const lengthVariance = Math.sqrt(
      altLengths.reduce((sum, a) => sum + Math.pow(a.length - avgLength, 2), 0) / altLengths.length
    );
    
    const correctAlt = altLengths.find(a => a.isCorrect);
    const correctAnswerLengthRatio = correctAlt ? correctAlt.length / avgLength : 1;
    
    if (correctAnswerLengthRatio > 1.3) {
      issues.push('Correct answer significantly longer than average (potential cue)');
    }
    if (correctAnswerLengthRatio < 0.7) {
      issues.push('Correct answer significantly shorter than average (potential cue)');
    }
    
    // Check for absolute terms in correct answer
    const correctText = alternatives[gabarito] || '';
    const absoluteInCorrect = this.countPatterns(correctText, LINGUISTIC_PATTERNS.absoluteMarkers) > 0;
    
    if (absoluteInCorrect) {
      issues.push('Absolute term found in correct answer (always, never, only)');
    }
    
    // Calculate readability (simplified Flesch)
    const words = stem.split(/\s+/).length;
    const sentences = (stem.match(/[.!?]+/g) || []).length || 1;
    const readabilityScore = Math.max(0, Math.min(1, 1 - (words / sentences - 15) / 30));
    
    // Calculate overall score
    let score = 1.0;
    if (absoluteInCorrect) score -= 0.3;
    if (correctAnswerLengthRatio > 1.3 || correctAnswerLengthRatio < 0.7) score -= 0.2;
    if (isNegativeStem && !negativeHighlighted) score -= 0.15;
    if (lengthVariance > 10) score -= 0.1;
    score = Math.max(0, score);
    
    return {
      score,
      stemAnalysis: {
        hedgingCount: stemHedging,
        absoluteCount: stemAbsolute,
        isNegativeStem,
        negativeHighlighted,
      },
      alternativesAnalysis: {
        lengthVariance,
        correctAnswerLengthRatio,
        absoluteInCorrect,
        grammaticalIssues: [], // Would need NLP for this
      },
      readabilityScore,
      issues,
    };
  }

  private countPatterns(text: string, patterns: string[]): number {
    const lowerText = text.toLowerCase();
    return patterns.reduce((count, pattern) => {
      const regex = new RegExp(`\\b${pattern}`, 'gi');
      return count + (lowerText.match(regex) || []).length;
    }, 0);
  }

  // ============================================================
  // STAGE 3: MEDICAL ACCURACY CHECK
  // ============================================================

  private async checkMedicalAccuracy(question: any): Promise<MedicalAccuracyResult> {
    const prompt = `
Você é um médico especialista revisando questões de prova.
Avalie a ACURÁCIA MÉDICA da seguinte questão:

ENUNCIADO:
${question.questao?.enunciado}

ALTERNATIVAS:
${Object.entries(question.questao?.alternativas || {})
  .map(([k, v]) => `${k}) ${v}`)
  .join('\n')}

GABARITO: ${question.questao?.gabarito}

COMENTÁRIO DO AUTOR:
${question.questao?.comentario || 'Não fornecido'}

ÁREA: ${question.metadados?.area || 'Não especificada'}
TEMA: ${question.metadados?.tema || 'Não especificado'}

Avalie e retorne APENAS JSON:

{
  "factually_correct": true/false,
  "guideline_compliant": true/false,
  "doses_correct": true/false,
  "diagnosis_accurate": true/false,
  "treatment_appropriate": true/false,
  "flagged_concerns": ["lista de problemas médicos"],
  "confidence": 0.0-1.0,
  "overall_score": 0.0-1.0
}
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });
      
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }
      
      const result = this.extractJSON(content.text);
      
      return {
        score: result.overall_score || 0.8,
        llmAssessment: {
          factuallyCorrect: result.factually_correct ?? true,
          guidelineCompliant: result.guideline_compliant ?? true,
          dosesCorrect: result.doses_correct ?? true,
          diagnosisAccurate: result.diagnosis_accurate ?? true,
          treatmentAppropriate: result.treatment_appropriate ?? true,
        },
        flaggedConcerns: result.flagged_concerns || [],
        confidence: result.confidence || 0.8,
      };
    } catch (error) {
      console.error('Medical accuracy check failed:', error);
      return {
        score: 0.5, // Conservative score on failure
        llmAssessment: {
          factuallyCorrect: false,
          guidelineCompliant: false,
          dosesCorrect: false,
          diagnosisAccurate: false,
          treatmentAppropriate: false,
        },
        flaggedConcerns: ['Automated check failed - requires manual review'],
        confidence: 0,
      };
    }
  }

  // ============================================================
  // STAGE 4: DISTRACTOR QUALITY
  // ============================================================

  private async analyzeDistractors(question: any): Promise<DistractorQualityResult> {
    const alternatives = question.questao?.alternativas || {};
    const gabarito = question.questao?.gabarito || '';
    const correctText = alternatives[gabarito] || '';
    
    const perDistractor: Record<string, any> = {};
    let totalPlausibility = 0;
    let distractorCount = 0;
    const typeDistribution: Record<string, number> = {};
    
    for (const [key, text] of Object.entries(alternatives)) {
      if (key === gabarito) continue;
      
      const textStr = text as string;
      
      // Simple plausibility based on length and structure similarity
      const lengthRatio = textStr.length / correctText.length;
      const plausibility = Math.max(0, 1 - Math.abs(1 - lengthRatio) * 0.5);
      
      // Semantic similarity (simplified - would use embeddings in production)
      const sharedWords = this.countSharedWords(textStr, correctText);
      const semanticSimilarity = Math.min(1, sharedWords / 5);
      
      // Type inference
      const type = this.inferDistractorType(textStr, question.metadados?.tipo_distratores?.[key]);
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      
      perDistractor[key] = {
        plausibilityScore: plausibility,
        semanticSimilarityToCorrect: semanticSimilarity,
        type,
        targetsMisconception: question.metadados?.misconceptions_exploradas?.length > 0,
      };
      
      totalPlausibility += plausibility;
      distractorCount++;
    }
    
    const overallPlausibility = distractorCount > 0 ? totalPlausibility / distractorCount : 0;
    
    // Calculate type diversity bonus
    const uniqueTypes = Object.keys(typeDistribution).length;
    const diversityBonus = Math.min(0.2, uniqueTypes * 0.05);
    
    // Misconception coverage
    const misconceptionCoverage = question.metadados?.misconceptions_exploradas?.length > 0 ? 0.2 : 0;
    
    const score = Math.min(1, overallPlausibility + diversityBonus + misconceptionCoverage);
    
    return {
      score,
      perDistractor,
      overallPlausibility,
      typeDistribution,
      misconceptionCoverage,
    };
  }

  private countSharedWords(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    let shared = 0;
    words1.forEach(w => { if (words2.has(w)) shared++; });
    return shared;
  }

  private inferDistractorType(text: string, declaredType?: string): string {
    if (declaredType) return declaredType;
    
    const lowerText = text.toLowerCase();
    
    if (this.countPatterns(text, LINGUISTIC_PATTERNS.absoluteMarkers) > 0) {
      return 'ABSOLUTE_TERM';
    }
    if (lowerText.includes('não') || lowerText.includes('nunca')) {
      return 'INVERTED';
    }
    
    return 'PLAUSIBLE_RELATED';
  }

  // ============================================================
  // STAGE 5: ORIGINALITY CHECK
  // ============================================================

  private async checkOriginality(question: any): Promise<OriginalityResult> {
    const stem = question.questao?.enunciado || '';
    
    // Generate embedding (simplified - would use actual embedding API)
    // For now, use text search
    const { data: similarQuestions, error } = await this.supabase
      .from('qgen_corpus_questions')
      .select('id, stem')
      .textSearch('search_vector', stem.split(' ').slice(0, 5).join(' & '))
      .limit(5);
    
    if (error || !similarQuestions || similarQuestions.length === 0) {
      return {
        score: 1.0,
        maxSimilarity: 0,
        mostSimilarId: null,
        mostSimilarText: null,
        isOriginal: true,
      };
    }
    
    // Calculate simple similarity
    let maxSimilarity = 0;
    let mostSimilarId: string | null = null;
    let mostSimilarText: string | null = null;
    
    for (const corpusQ of similarQuestions) {
      const similarity = this.calculateJaccardSimilarity(stem, corpusQ.stem);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilarId = corpusQ.id;
        mostSimilarText = corpusQ.stem;
      }
    }
    
    const isOriginal = maxSimilarity < 0.85;
    const score = isOriginal ? (1 - maxSimilarity) : 0;
    
    return {
      score,
      maxSimilarity,
      mostSimilarId,
      mostSimilarText: isOriginal ? null : mostSimilarText,
      isOriginal,
    };
  }

  private calculateJaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // ============================================================
  // STAGE 6: IRT ESTIMATION
  // ============================================================

  private async estimateIRT(
    question: any,
    targetConfig: { difficulty: number; bloomLevel: string }
  ): Promise<IRTAlignmentResult> {
    // Heuristic IRT estimation based on question features
    const stem = question.questao?.enunciado || '';
    const alternatives = question.questao?.alternativas || {};
    
    // Factors affecting difficulty
    const wordCount = stem.split(/\s+/).length;
    const hasNegativeStem = LINGUISTIC_PATTERNS.negativeStems.some(
      p => stem.toLowerCase().includes(p)
    );
    const numAlternatives = Object.keys(alternatives).length;
    
    // Base difficulty from word count (longer = harder)
    let estimatedDifficulty = Math.min(2, (wordCount - 50) / 100);
    
    // Adjust for negative stem (slightly harder)
    if (hasNegativeStem) estimatedDifficulty += 0.3;
    
    // Adjust for Bloom level
    const bloomAdjustment: Record<string, number> = {
      'KNOWLEDGE': -0.5,
      'COMPREHENSION': -0.3,
      'APPLICATION': 0,
      'ANALYSIS': 0.3,
      'SYNTHESIS': 0.5,
      'EVALUATION': 0.7,
    };
    const declaredBloom = question.metadados?.nivel_bloom || targetConfig.bloomLevel;
    estimatedDifficulty += bloomAdjustment[declaredBloom] || 0;
    
    // Clamp to reasonable range
    estimatedDifficulty = Math.max(-1.5, Math.min(1.5, estimatedDifficulty));
    
    // Target difficulty (convert 1-5 scale to IRT -1.5 to +1.5)
    const targetDifficultyIRT = (targetConfig.difficulty - 3) * 0.5;
    
    // Calculate deviation
    const difficultyDeviation = Math.abs(estimatedDifficulty - targetDifficultyIRT);
    
    // Estimate discrimination (simplified)
    const estimatedDiscrimination = 1.0 + (numAlternatives - 4) * 0.1;
    
    // Bloom level match
    const bloomLevelMatch = declaredBloom === targetConfig.bloomLevel;
    
    // Score
    let score = 1.0;
    score -= Math.min(0.4, difficultyDeviation * 0.3);
    if (!bloomLevelMatch) score -= 0.2;
    score = Math.max(0, score);
    
    return {
      score,
      estimatedDifficulty,
      targetDifficulty: targetDifficultyIRT,
      difficultyDeviation,
      estimatedDiscrimination,
      bloomLevelMatch,
    };
  }

  // ============================================================
  // AGGREGATION & DECISION
  // ============================================================

  private aggregateResults(
    questionId: string,
    timestamp: string,
    stages: ValidationResult['stages'],
    targetConfig: any
  ): ValidationResult {
    // Weights
    const weights = {
      medicalAccuracy: 0.30,
      distractorQuality: 0.25,
      linguistic: 0.20,
      originality: 0.15,
      irtAlignment: 0.10,
    };
    
    // Calculate weighted score
    const weightedScore = 
      stages.medicalAccuracy.score * weights.medicalAccuracy +
      stages.distractorQuality.score * weights.distractorQuality +
      stages.linguistic.score * weights.linguistic +
      stages.originality.score * weights.originality +
      stages.irtAlignment.score * weights.irtAlignment;
    
    // Collect all issues
    const issues: ValidationIssue[] = [];
    
    // Linguistic issues
    stages.linguistic.issues.forEach(issue => {
      issues.push({
        stage: 'linguistic',
        severity: issue.includes('cue') ? 'HIGH' : 'MEDIUM',
        message: issue,
        suggestion: 'Review alternative lengths and remove absolute terms from correct answer',
      });
    });
    
    // Medical accuracy issues
    stages.medicalAccuracy.flaggedConcerns.forEach(concern => {
      issues.push({
        stage: 'medicalAccuracy',
        severity: 'CRITICAL',
        message: concern,
        suggestion: 'Verify medical accuracy with current guidelines',
      });
    });
    
    // Originality issues
    if (!stages.originality.isOriginal) {
      issues.push({
        stage: 'originality',
        severity: 'HIGH',
        message: `High similarity (${(stages.originality.maxSimilarity * 100).toFixed(0)}%) with corpus question`,
        suggestion: 'Modify question to increase originality',
      });
    }
    
    // Determine decision
    let decision: ValidationResult['decision'];
    let decisionReason: string;
    
    // Override rules
    if (stages.medicalAccuracy.score < 0.70) {
      decision = 'REJECT';
      decisionReason = 'Medical accuracy below threshold (< 0.70)';
    } else if (!stages.originality.isOriginal) {
      decision = 'REJECT';
      decisionReason = 'Insufficient originality (> 0.85 similarity with corpus)';
    } else if (weightedScore >= 0.85) {
      decision = 'AUTO_APPROVE';
      decisionReason = `High quality score (${(weightedScore * 100).toFixed(0)}%)`;
    } else if (weightedScore >= 0.70) {
      decision = 'PENDING_REVIEW';
      decisionReason = `Moderate score (${(weightedScore * 100).toFixed(0)}%) - requires human review`;
    } else if (weightedScore >= 0.50) {
      decision = 'NEEDS_REVISION';
      decisionReason = `Low score (${(weightedScore * 100).toFixed(0)}%) - significant issues found`;
    } else {
      decision = 'REJECT';
      decisionReason = `Very low score (${(weightedScore * 100).toFixed(0)}%)`;
    }
    
    // Review priority
    let reviewPriority: ValidationResult['reviewPriority'];
    if (issues.some(i => i.severity === 'CRITICAL')) {
      reviewPriority = 'CRITICAL';
    } else if (issues.some(i => i.severity === 'HIGH')) {
      reviewPriority = 'HIGH';
    } else if (issues.length > 2) {
      reviewPriority = 'MEDIUM';
    } else {
      reviewPriority = 'LOW';
    }
    
    // Generate suggestions
    const suggestions: string[] = [];
    if (stages.linguistic.score < 0.8) {
      suggestions.push('Improve linguistic quality: balance alternative lengths, remove cues');
    }
    if (stages.distractorQuality.score < 0.7) {
      suggestions.push('Enhance distractor plausibility and variety');
    }
    if (stages.irtAlignment.score < 0.7) {
      suggestions.push(`Adjust difficulty to match target (current: ${stages.irtAlignment.estimatedDifficulty.toFixed(2)}, target: ${stages.irtAlignment.targetDifficulty.toFixed(2)})`);
    }
    
    return {
      questionId,
      timestamp,
      stages,
      scores: {
        structural: stages.structural.passed ? 1 : 0,
        linguistic: stages.linguistic.score,
        medicalAccuracy: stages.medicalAccuracy.score,
        distractorQuality: stages.distractorQuality.score,
        originality: stages.originality.score,
        irtAlignment: stages.irtAlignment.score,
        weighted: weightedScore,
      },
      decision,
      decisionReason,
      issues,
      suggestions,
      humanReviewRequired: decision === 'PENDING_REVIEW' || decision === 'NEEDS_REVISION',
      reviewPriority,
    };
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  private extractJSON(text: string): any {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try direct parse
    return JSON.parse(text.trim());
  }

  private buildRejectionResult(
    questionId: string,
    timestamp: string,
    structuralResult: StructuralValidationResult,
    reason: string
  ): ValidationResult {
    return {
      questionId,
      timestamp,
      stages: {
        structural: structuralResult,
        linguistic: { score: 0, stemAnalysis: {} as any, alternativesAnalysis: {} as any, readabilityScore: 0, issues: [] },
        medicalAccuracy: { score: 0, llmAssessment: {} as any, flaggedConcerns: [], confidence: 0 },
        distractorQuality: { score: 0, perDistractor: {}, overallPlausibility: 0, typeDistribution: {}, misconceptionCoverage: 0 },
        originality: { score: 0, maxSimilarity: 0, mostSimilarId: null, mostSimilarText: null, isOriginal: false },
        irtAlignment: { score: 0, estimatedDifficulty: 0, targetDifficulty: 0, difficultyDeviation: 0, estimatedDiscrimination: 0, bloomLevelMatch: false },
      },
      scores: {
        structural: 0,
        linguistic: 0,
        medicalAccuracy: 0,
        distractorQuality: 0,
        originality: 0,
        irtAlignment: 0,
        weighted: 0,
      },
      decision: 'REJECT',
      decisionReason: `Structural validation failed: ${reason}`,
      issues: structuralResult.errors.map(e => ({
        stage: 'structural',
        severity: 'CRITICAL' as const,
        message: e,
        suggestion: 'Fix structural issues in generated output',
      })),
      suggestions: ['Ensure output follows required JSON schema'],
      humanReviewRequired: false,
      reviewPriority: 'CRITICAL',
    };
  }
}
```

---

## 3. Corpus Analysis Service

```typescript
// ============================================================
// CORPUS ANALYSIS SERVICE
// src/lib/qgen/services/corpus-analysis-service.ts
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ExtractedFeatures,
  StructuralFeatures,
  ClinicalFeatures,
  CognitiveFeatures,
  LinguisticFeatures,
  DistractorFeatures,
  LINGUISTIC_PATTERNS,
  CLINICAL_PATTERNS,
  MEDICAL_CONCEPT_MAP,
} from '../types/features';

export class CorpusAnalysisService {
  private supabase: SupabaseClient;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // ============================================================
  // FEATURE EXTRACTION
  // ============================================================

  async extractFeatures(question: {
    id: string;
    stem: string;
    alternatives: Record<string, string>;
    correctAnswer: string;
    area: string;
    topic: string;
    questionType: string;
  }): Promise<ExtractedFeatures> {
    const startTime = Date.now();
    
    const structural = this.extractStructuralFeatures(question);
    const clinical = question.questionType === 'CLINICAL_CASE' 
      ? this.extractClinicalFeatures(question.stem)
      : null;
    const cognitive = this.extractCognitiveFeatures(question);
    const linguistic = this.extractLinguisticFeatures(question);
    const distractors = this.extractDistractorFeatures(question);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      questionId: question.id,
      extractionTimestamp: new Date().toISOString(),
      extractorVersion: '1.0.0',
      structural,
      clinical,
      cognitive,
      linguistic,
      distractors,
      irt: {
        difficulty: this.estimateDifficulty(structural, cognitive),
        discrimination: 1.0, // Default, needs empirical data
        guessing: 1 / Object.keys(question.alternatives).length,
        source: 'estimated',
      },
      extractionMetadata: {
        confidence: 0.8,
        warnings: [],
        processingTimeMs,
      },
    };
  }

  // ============================================================
  // STRUCTURAL FEATURES
  // ============================================================

  private extractStructuralFeatures(question: {
    stem: string;
    alternatives: Record<string, string>;
    correctAnswer: string;
  }): StructuralFeatures {
    const stem = question.stem;
    const words = stem.split(/\s+/);
    const sentences = stem.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Alternative analysis
    const altEntries = Object.entries(question.alternatives);
    const altLengths = altEntries.map(([key, text]) => ({
      key,
      length: text.split(/\s+/).length,
    }));
    const avgLength = altLengths.reduce((sum, a) => sum + a.length, 0) / altLengths.length;
    const lengthVariance = Math.sqrt(
      altLengths.reduce((sum, a) => sum + Math.pow(a.length - avgLength, 2), 0) / altLengths.length
    );
    
    // Components detection
    const lowerStem = stem.toLowerCase();
    
    return {
      stemWordCount: words.length,
      stemSentenceCount: sentences.length,
      stemCharCount: stem.length,
      avgWordsPerSentence: words.length / Math.max(1, sentences.length),
      
      numAlternatives: altEntries.length,
      alternativesWordCounts: Object.fromEntries(altLengths.map(a => [a.key, a.length])),
      alternativesLengthVariance: lengthVariance,
      longestAlternative: altLengths.reduce((a, b) => a.length > b.length ? a : b).key,
      shortestAlternative: altLengths.reduce((a, b) => a.length < b.length ? a : b).key,
      
      components: {
        hasPatientDemographics: /\d+\s*(anos?|meses?|dias?)/.test(stem),
        hasChiefComplaint: /queixa|procura|apresenta/.test(lowerStem),
        hasTimeEvolution: /há\s*\d+/.test(lowerStem),
        hasPhysicalExam: /exame físico|ao exame/.test(lowerStem),
        hasVitalSigns: /PA|FC|FR|Tax|SpO2/.test(stem),
        hasLabResults: /hemograma|glicemia|creatinina|ureia/.test(lowerStem),
        hasImaging: /raio.?x|RX|tomografia|TC|ressonância|RM|ultrassom|USG/.test(lowerStem),
        hasPathology: /biópsia|histopatológico|anatomopatológico/.test(lowerStem),
        hasMedicationHistory: /uso de|em uso|medicament/.test(lowerStem),
        hasFamilyHistory: /história familiar|antecedentes familiares/.test(lowerStem),
        hasSocialHistory: /tabagis|etilis|uso de drogas/.test(lowerStem),
      },
      
      questionFormat: this.detectQuestionFormat(stem),
      isNegativeStem: LINGUISTIC_PATTERNS.negativeStems.some(p => lowerStem.includes(p)),
      
      questionTarget: {
        asksDiagnosis: /diagnóstico|hipótese diagnóstica/.test(lowerStem),
        asksTreatment: /tratamento|conduta terapêutica|prescrever/.test(lowerStem),
        asksNextStep: /próxim[oa] passo|conduta|a seguir/.test(lowerStem),
        asksMechanism: /mecanismo|fisiopatologia|por que/.test(lowerStem),
        asksPrognosis: /prognóstico|evolução/.test(lowerStem),
        asksEpidemiologic: /prevalência|incidência|risco|odds/.test(lowerStem),
        asksEthical: /ética|bioética|consentimento|sigilo/.test(lowerStem),
      },
    };
  }

  private detectQuestionFormat(stem: string): string {
    for (const [format, pattern] of Object.entries(LINGUISTIC_PATTERNS.questionFormats)) {
      if (pattern.test(stem)) return format;
    }
    return 'Other';
  }

  // ============================================================
  // CLINICAL FEATURES
  // ============================================================

  private extractClinicalFeatures(stem: string): ClinicalFeatures {
    const lowerStem = stem.toLowerCase();
    
    // Age extraction
    const ageMatch = stem.match(CLINICAL_PATTERNS.age);
    let ageValue: number | null = null;
    let ageUnit: ClinicalFeatures['patient']['ageUnit'] = null;
    let ageCategory: ClinicalFeatures['patient']['ageCategory'] = null;
    
    if (ageMatch) {
      ageValue = parseInt(ageMatch[1]);
      const unit = ageMatch[2].toLowerCase();
      if (unit.startsWith('ano')) {
        ageUnit = 'years';
        ageCategory = this.getAgeCategory(ageValue, 'years');
      } else if (unit.startsWith('mes')) {
        ageUnit = 'months';
        ageCategory = this.getAgeCategory(ageValue, 'months');
      } else if (unit.startsWith('dia')) {
        ageUnit = 'days';
        ageCategory = this.getAgeCategory(ageValue, 'days');
      }
    }
    
    // Sex extraction
    let sex: ClinicalFeatures['patient']['sex'] = 'unspecified';
    if (CLINICAL_PATTERNS.sex.male.test(stem)) sex = 'male';
    else if (CLINICAL_PATTERNS.sex.female.test(stem)) sex = 'female';
    
    // Time evolution
    const timeMatch = stem.match(CLINICAL_PATTERNS.timeEvolution);
    let timeEvolutionValue: number | null = null;
    let timeEvolutionUnit: ClinicalFeatures['presentation']['timeEvolutionUnit'] = null;
    
    if (timeMatch) {
      timeEvolutionValue = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      if (unit.startsWith('minuto')) timeEvolutionUnit = 'minutes';
      else if (unit.startsWith('hora')) timeEvolutionUnit = 'hours';
      else if (unit.startsWith('dia')) timeEvolutionUnit = 'days';
      else if (unit.startsWith('semana')) timeEvolutionUnit = 'weeks';
      else if (unit.startsWith('mes') || unit.startsWith('mês')) timeEvolutionUnit = 'months';
      else if (unit.startsWith('ano')) timeEvolutionUnit = 'years';
    }
    
    // Scenario detection
    let scenarioType: ClinicalFeatures['scenario']['type'] = 'OTHER';
    for (const [scenario, pattern] of Object.entries(CLINICAL_PATTERNS.scenarios)) {
      if (pattern.test(stem)) {
        scenarioType = scenario.toUpperCase() as any;
        break;
      }
    }
    
    // Vital signs extraction
    let vitalSigns: ClinicalFeatures['vitalSigns'] = null;
    const vsPatterns = CLINICAL_PATTERNS.vitalSigns;
    const bpMatch = stem.match(vsPatterns.bp);
    const hrMatch = stem.match(vsPatterns.hr);
    const rrMatch = stem.match(vsPatterns.rr);
    const tempMatch = stem.match(vsPatterns.temp);
    const spo2Match = stem.match(vsPatterns.spo2);
    
    if (bpMatch || hrMatch || rrMatch || tempMatch || spo2Match) {
      vitalSigns = {
        bloodPressure: bpMatch ? `${bpMatch[1]}x${bpMatch[2]}` : null,
        heartRate: hrMatch ? parseInt(hrMatch[1]) : null,
        respiratoryRate: rrMatch ? parseInt(rrMatch[1]) : null,
        temperature: tempMatch ? parseFloat(tempMatch[1].replace(',', '.')) : null,
        oxygenSaturation: spo2Match ? parseInt(spo2Match[1]) : null,
        weight: null,
        height: null,
        bmi: null,
      };
    }
    
    return {
      patient: {
        sex,
        ageValue,
        ageUnit,
        ageCategory,
        occupation: null, // Would need NER
        ethnicity: null,
        isPregnant: /gestante|grávida|gravidez/.test(lowerStem),
        gestationalAge: null,
      },
      scenario: {
        type: scenarioType,
        urgencyLevel: this.inferUrgencyLevel(stem, scenarioType),
        setting: '',
      },
      presentation: {
        chiefComplaint: null, // Would need NLP extraction
        timeEvolutionValue,
        timeEvolutionUnit,
        isAcute: timeEvolutionUnit === 'minutes' || timeEvolutionUnit === 'hours' || 
                 (timeEvolutionUnit === 'days' && (timeEvolutionValue || 0) < 7),
        isChronic: timeEvolutionUnit === 'months' || timeEvolutionUnit === 'years',
        isRecurrent: /recorrente|recidivante|repetição/.test(lowerStem),
        associatedSymptoms: [],
      },
      vitalSigns,
      physicalExam: null,
      labTests: null,
      imagingTests: null,
      diagnosis: {
        primary: null,
        differentials: [],
        icd10Codes: [],
      },
    };
  }

  private getAgeCategory(value: number, unit: string): ClinicalFeatures['patient']['ageCategory'] {
    let ageInYears = value;
    if (unit === 'months') ageInYears = value / 12;
    if (unit === 'days') ageInYears = value / 365;
    
    if (ageInYears < 0.08) return 'NEONATE';      // < 28 days
    if (ageInYears < 2) return 'INFANT';
    if (ageInYears < 6) return 'PRESCHOOL';
    if (ageInYears < 12) return 'SCHOOL_AGE';
    if (ageInYears < 18) return 'ADOLESCENT';
    if (ageInYears < 40) return 'YOUNG_ADULT';
    if (ageInYears < 65) return 'MIDDLE_ADULT';
    return 'ELDERLY';
  }

  private inferUrgencyLevel(stem: string, scenario: string): ClinicalFeatures['scenario']['urgencyLevel'] {
    if (scenario === 'EMERGENCY' || scenario === 'ICU') return 'emergent';
    if (/urgência|grave|instável|choque/.test(stem.toLowerCase())) return 'urgent';
    return 'elective';
  }

  // ============================================================
  // COGNITIVE FEATURES
  // ============================================================

  private extractCognitiveFeatures(question: {
    stem: string;
    alternatives: Record<string, string>;
    area: string;
    topic: string;
  }): CognitiveFeatures {
    const lowerStem = question.stem.toLowerCase();
    
    // Detect Bloom level based on question patterns
    let bloomLevel: CognitiveFeatures['bloomLevel'] = 'APPLICATION';
    let bloomConfidence = 0.6;
    
    if (/defina|liste|identifique|nome/.test(lowerStem)) {
      bloomLevel = 'KNOWLEDGE';
      bloomConfidence = 0.8;
    } else if (/explique|descreva|classifique|diferencie/.test(lowerStem)) {
      bloomLevel = 'COMPREHENSION';
      bloomConfidence = 0.7;
    } else if (/diagnóstico|tratamento|conduta/.test(lowerStem)) {
      bloomLevel = 'APPLICATION';
      bloomConfidence = 0.75;
    } else if (/diagnóstico diferencial|análise|compare/.test(lowerStem)) {
      bloomLevel = 'ANALYSIS';
      bloomConfidence = 0.7;
    } else if (/planej|elabor|propon/.test(lowerStem)) {
      bloomLevel = 'SYNTHESIS';
      bloomConfidence = 0.65;
    } else if (/melhor|mais adequad|prioriz|julg/.test(lowerStem)) {
      bloomLevel = 'EVALUATION';
      bloomConfidence = 0.7;
    }
    
    // Extract key concepts
    const concepts = this.extractKeyConcepts(question.stem, question.area);
    
    // Determine required integrations
    const integrations = concepts.length > 1 ? [{
      from: concepts[0]?.concept || '',
      to: concepts[1]?.concept || '',
      type: 'causal' as const,
      description: 'Inferred integration between main concepts',
    }] : [];
    
    return {
      bloomLevel,
      bloomConfidence,
      
      cognitiveDomains: {
        requiresRecall: bloomLevel === 'KNOWLEDGE',
        requiresUnderstanding: bloomLevel === 'COMPREHENSION' || bloomLevel !== 'KNOWLEDGE',
        requiresApplication: ['APPLICATION', 'ANALYSIS', 'SYNTHESIS', 'EVALUATION'].includes(bloomLevel),
        requiresAnalysis: ['ANALYSIS', 'SYNTHESIS', 'EVALUATION'].includes(bloomLevel),
        requiresSynthesis: ['SYNTHESIS', 'EVALUATION'].includes(bloomLevel),
        requiresEvaluation: bloomLevel === 'EVALUATION',
      },
      
      knowledgeTypes: {
        factual: /define|liste|identifique/.test(lowerStem),
        conceptual: /mecanismo|fisiopatologia|princípio/.test(lowerStem),
        procedural: /como|técnica|procedimento/.test(lowerStem),
        metacognitive: false,
      },
      
      requiredSkills: {
        calculation: /calcul|dose|volume|taxa/.test(lowerStem),
        interpretation: /interpret|análise de|resultado/.test(lowerStem),
        clinicalReasoning: /diagnóstico|conduta|tratamento/.test(lowerStem),
        ethicalReasoning: /ética|bioética|autonomia|consentimento/.test(lowerStem),
        integration: concepts.length > 2,
        patternRecognition: /típic|clássic|característic/.test(lowerStem),
      },
      
      keyConcepts: concepts,
      requiredIntegrations: integrations,
      prerequisiteConcepts: [],
      
      complexity: {
        conceptCount: concepts.length,
        integrationCount: integrations.length,
        cognitiveLoadEstimate: Math.min(1, concepts.length * 0.15 + integrations.length * 0.2),
        estimatedTimeSeconds: 60 + question.stem.length / 10,
      },
    };
  }

  private extractKeyConcepts(stem: string, area: string): CognitiveFeatures['keyConcepts'] {
    const concepts: CognitiveFeatures['keyConcepts'] = [];
    const lowerStem = stem.toLowerCase();
    
    // Check each medical concept category
    for (const [category, terms] of Object.entries(MEDICAL_CONCEPT_MAP)) {
      for (const term of terms) {
        if (lowerStem.includes(term.toLowerCase())) {
          concepts.push({
            concept: term,
            weight: 0.5,
            required: true,
            category,
          });
        }
      }
    }
    
    // Limit and normalize weights
    const topConcepts = concepts.slice(0, 5);
    const totalWeight = topConcepts.reduce((sum, c) => sum + c.weight, 0) || 1;
    topConcepts.forEach(c => c.weight = c.weight / totalWeight);
    
    return topConcepts;
  }

  // ============================================================
  // LINGUISTIC FEATURES
  // ============================================================

  private extractLinguisticFeatures(question: {
    stem: string;
    alternatives: Record<string, string>;
    correctAnswer: string;
  }): LinguisticFeatures {
    const stem = question.stem;
    const lowerStem = stem.toLowerCase();
    
    // Count hedging markers
    const hedgingMarkers = LINGUISTIC_PATTERNS.hedgingMarkers.filter(
      marker => lowerStem.includes(marker)
    );
    
    // Count absolute markers
    const absoluteMarkers = LINGUISTIC_PATTERNS.absoluteMarkers.filter(
      marker => lowerStem.includes(marker)
    );
    
    // Check correct answer for absolute terms
    const correctText = question.alternatives[question.correctAnswer] || '';
    const absoluteInCorrect = LINGUISTIC_PATTERNS.absoluteMarkers.some(
      marker => correctText.toLowerCase().includes(marker)
    );
    
    // Analyze alternatives
    const alternativesAnalysis: LinguisticFeatures['alternativesAnalysis'] = {};
    for (const [key, text] of Object.entries(question.alternatives)) {
      const lowerText = text.toLowerCase();
      alternativesAnalysis[key] = {
        hedgingCount: LINGUISTIC_PATTERNS.hedgingMarkers.filter(m => lowerText.includes(m)).length,
        absoluteCount: LINGUISTIC_PATTERNS.absoluteMarkers.filter(m => lowerText.includes(m)).length,
        wordCount: text.split(/\s+/).length,
        avgWordLength: text.replace(/\s+/g, '').length / Math.max(1, text.split(/\s+/).length),
        hasNegation: /não|nunca|jamais/.test(lowerText),
      };
    }
    
    // Extract medical vocabulary
    const words = stem.split(/\s+/);
    const medicalTerms = words.filter(w => this.isMedicalTerm(w.toLowerCase()));
    const abbreviations = stem.match(/\b[A-Z]{2,5}\b/g) || [];
    
    // Calculate readability
    const sentences = stem.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
    
    return {
      hedging: {
        count: hedgingMarkers.length,
        markers: hedgingMarkers,
        density: hedgingMarkers.length / Math.max(1, words.length),
      },
      absoluteTerms: {
        count: absoluteMarkers.length,
        markers: absoluteMarkers,
        inCorrectAnswer: absoluteInCorrect,
      },
      logicalConnectives: {
        connectives: [],
        count: 0,
        types: [],
      },
      alternativesAnalysis,
      linguisticCues: {
        grammaticalCues: false,
        lengthCue: this.detectLengthCue(question.alternatives, question.correctAnswer),
        absoluteInCorrect,
        issues: absoluteInCorrect ? ['Absolute term in correct answer'] : [],
      },
      readability: {
        fleschReadingEase: this.calculateFleschPT(words.length, sentences.length, this.countSyllables(stem)),
        gunningFogIndex: 0.4 * (avgWordsPerSentence + 100 * (medicalTerms.length / Math.max(1, words.length))),
        avgSyllablesPerWord: this.countSyllables(stem) / Math.max(1, words.length),
        avgWordsPerSentence,
      },
      vocabulary: {
        medicalTerms,
        abbreviations,
        eponyms: [],
        technicalTermDensity: medicalTerms.length / Math.max(1, words.length),
      },
    };
  }

  private isMedicalTerm(word: string): boolean {
    // Simplified check - would use a medical dictionary in production
    const medicalSuffixes = ['ite', 'ose', 'emia', 'oma', 'ectomia', 'otomia', 'opia', 'algia', 'patia'];
    return medicalSuffixes.some(suffix => word.endsWith(suffix)) ||
           Object.values(MEDICAL_CONCEPT_MAP).flat().some(term => word.includes(term.toLowerCase()));
  }

  private detectLengthCue(alternatives: Record<string, string>, correctAnswer: string): boolean {
    const lengths = Object.entries(alternatives).map(([k, v]) => ({
      key: k,
      length: v.split(/\s+/).length,
      isCorrect: k === correctAnswer,
    }));
    
    const avgLength = lengths.reduce((sum, l) => sum + l.length, 0) / lengths.length;
    const correctLength = lengths.find(l => l.isCorrect)?.length || avgLength;
    
    return Math.abs(correctLength - avgLength) / avgLength > 0.3;
  }

  private countSyllables(text: string): number {
    // Portuguese syllable estimation
    const vowels = text.toLowerCase().match(/[aeiouáéíóúâêôãõ]+/g) || [];
    return vowels.length;
  }

  private calculateFleschPT(words: number, sentences: number, syllables: number): number {
    // Adapted Flesch formula for Portuguese
    return Math.max(0, Math.min(100, 
      206.835 - 1.015 * (words / Math.max(1, sentences)) - 84.6 * (syllables / Math.max(1, words))
    ));
  }

  // ============================================================
  // DISTRACTOR FEATURES
  // ============================================================

  private extractDistractorFeatures(question: {
    alternatives: Record<string, string>;
    correctAnswer: string;
  }): DistractorFeatures[] {
    const features: DistractorFeatures[] = [];
    const correctText = question.alternatives[question.correctAnswer] || '';
    
    for (const [key, text] of Object.entries(question.alternatives)) {
      const isCorrect = key === question.correctAnswer;
      
      features.push({
        alternative: key,
        isCorrect,
        type: isCorrect ? 'PLAUSIBLE_RELATED' : this.inferDistractorType(text),
        typeConfidence: 0.6,
        plausibilityScore: isCorrect ? 1.0 : this.calculatePlausibility(text, correctText),
        semanticSimilarityToCorrect: this.calculateTextSimilarity(text, correctText),
        sharesKeyConcepts: this.sharesKeyConcepts(text, correctText),
        conceptOverlapCount: this.countConceptOverlap(text, correctText),
        targetsMisconception: false,
        misconceptionId: null,
        misconceptionDescription: null,
        conductAnalysis: null,
        empiricalMetrics: null,
      });
    }
    
    return features;
  }

  private inferDistractorType(text: string): DistractorFeatures['type'] {
    const lowerText = text.toLowerCase();
    
    if (LINGUISTIC_PATTERNS.absoluteMarkers.some(m => lowerText.includes(m))) {
      return 'ABSOLUTE_TERM';
    }
    if (/não|nunca|jamais|evitar/.test(lowerText)) {
      return 'INVERTED';
    }
    return 'PLAUSIBLE_RELATED';
  }

  private calculatePlausibility(distractor: string, correct: string): number {
    const similarity = this.calculateTextSimilarity(distractor, correct);
    const lengthRatio = distractor.length / Math.max(1, correct.length);
    const lengthScore = 1 - Math.abs(1 - lengthRatio) * 0.5;
    
    return (similarity * 0.4 + lengthScore * 0.6);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private sharesKeyConcepts(text1: string, text2: string): boolean {
    const medicalTerms1 = text1.toLowerCase().split(/\s+/).filter(w => this.isMedicalTerm(w));
    const medicalTerms2 = text2.toLowerCase().split(/\s+/).filter(w => this.isMedicalTerm(w));
    
    return medicalTerms1.some(t => medicalTerms2.includes(t));
  }

  private countConceptOverlap(text1: string, text2: string): number {
    const medicalTerms1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => this.isMedicalTerm(w)));
    const medicalTerms2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => this.isMedicalTerm(w)));
    
    return [...medicalTerms1].filter(t => medicalTerms2.has(t)).length;
  }

  // ============================================================
  // IRT ESTIMATION
  // ============================================================

  private estimateDifficulty(
    structural: StructuralFeatures,
    cognitive: CognitiveFeatures
  ): number {
    let difficulty = 0;
    
    // Word count contribution
    difficulty += (structural.stemWordCount - 50) / 200;
    
    // Bloom level contribution
    const bloomValues: Record<string, number> = {
      'KNOWLEDGE': -0.5,
      'COMPREHENSION': -0.3,
      'APPLICATION': 0,
      'ANALYSIS': 0.3,
      'SYNTHESIS': 0.5,
      'EVALUATION': 0.7,
    };
    difficulty += bloomValues[cognitive.bloomLevel] || 0;
    
    // Concept count contribution
    difficulty += cognitive.complexity.conceptCount * 0.1;
    
    // Integration contribution
    if (cognitive.complexity.integrationCount > 0) {
      difficulty += 0.2;
    }
    
    // Negative stem contribution
    if (structural.isNegativeStem) {
      difficulty += 0.2;
    }
    
    // Clamp to reasonable range
    return Math.max(-1.5, Math.min(1.5, difficulty));
  }

  // ============================================================
  // CORPUS STATISTICS
  // ============================================================

  async getCorpusStatistics(filters?: {
    source?: string;
    area?: string;
    yearFrom?: number;
    yearTo?: number;
  }): Promise<{
    totalQuestions: number;
    byArea: Record<string, number>;
    byBloomLevel: Record<string, number>;
    byDifficulty: { mean: number; std: number };
    byQuestionType: Record<string, number>;
  }> {
    let query = this.supabase.from('qgen_corpus_questions').select('*');
    
    if (filters?.source) {
      query = query.eq('source', filters.source);
    }
    if (filters?.area) {
      query = query.eq('primary_area', filters.area);
    }
    if (filters?.yearFrom) {
      query = query.gte('source_year', filters.yearFrom);
    }
    if (filters?.yearTo) {
      query = query.lte('source_year', filters.yearTo);
    }
    
    const { data: questions, error } = await query;
    
    if (error || !questions) {
      return {
        totalQuestions: 0,
        byArea: {},
        byBloomLevel: {},
        byDifficulty: { mean: 0, std: 1 },
        byQuestionType: {},
      };
    }
    
    // Aggregate statistics
    const byArea: Record<string, number> = {};
    const byBloomLevel: Record<string, number> = {};
    const byQuestionType: Record<string, number> = {};
    const difficulties: number[] = [];
    
    for (const q of questions) {
      byArea[q.primary_area] = (byArea[q.primary_area] || 0) + 1;
      
      const features = q.extracted_features as ExtractedFeatures | null;
      if (features?.cognitive?.bloomLevel) {
        byBloomLevel[features.cognitive.bloomLevel] = (byBloomLevel[features.cognitive.bloomLevel] || 0) + 1;
      }
      
      byQuestionType[q.question_type] = (byQuestionType[q.question_type] || 0) + 1;
      
      if (q.irt_difficulty !== null) {
        difficulties.push(q.irt_difficulty);
      }
    }
    
    const meanDifficulty = difficulties.length > 0 
      ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length 
      : 0;
    const stdDifficulty = difficulties.length > 0
      ? Math.sqrt(difficulties.reduce((sum, d) => sum + Math.pow(d - meanDifficulty, 2), 0) / difficulties.length)
      : 1;
    
    return {
      totalQuestions: questions.length,
      byArea,
      byBloomLevel,
      byDifficulty: { mean: meanDifficulty, std: stdDifficulty },
      byQuestionType,
    };
  }
}
```

Este é o terceiro arquivo (Parte 3) contendo o pipeline de validação e services de análise de corpus. Vou continuar com a Parte 4.
