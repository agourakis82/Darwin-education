/**
 * QGen Validation Service
 * =======================
 *
 * 6-stage validation pipeline for generated questions
 */

import {
  QGenGeneratedQuestion,
  QGenValidationResult,
  ValidationStageResult,
  ValidationIssue,
  ValidationDecision,
  BloomLevel,
} from '@darwin-education/shared';

import { LINGUISTIC_PATTERNS, DISTRACTOR_THRESHOLDS } from '../constants/patterns';

/**
 * Validation stage weights for overall score
 */
const STAGE_WEIGHTS = {
  structural: 0.15,
  linguistic: 0.15,
  medicalAccuracy: 0.25,
  distractorQuality: 0.20,
  originality: 0.10,
  irtEstimation: 0.15,
};

/**
 * Decision thresholds
 */
const DECISION_THRESHOLDS = {
  AUTO_APPROVE: 0.85,
  PENDING_REVIEW: 0.70,
  NEEDS_REVISION: 0.50,
};

/**
 * QGen Validation Service
 */
export class QGenValidationService {
  /**
   * Run full validation pipeline
   */
  async validateQuestion(question: QGenGeneratedQuestion): Promise<QGenValidationResult> {
    // Run all validation stages
    const structural = this.validateStructure(question);
    const linguistic = this.analyzeLinguistics(question);
    const medicalAccuracy = await this.checkMedicalAccuracy(question);
    const distractorQuality = this.analyzeDistractors(question);
    const originality = await this.checkOriginality(question);
    const irtEstimation = this.estimateIRT(question);

    // Collect all issues
    const allIssues: ValidationIssue[] = [
      ...structural.issues,
      ...linguistic.issues,
      ...medicalAccuracy.issues,
      ...distractorQuality.issues,
      ...originality.issues,
      ...irtEstimation.issues,
    ];

    // Calculate weighted overall score
    const overallScore =
      structural.score * STAGE_WEIGHTS.structural +
      linguistic.score * STAGE_WEIGHTS.linguistic +
      medicalAccuracy.score * STAGE_WEIGHTS.medicalAccuracy +
      distractorQuality.score * STAGE_WEIGHTS.distractorQuality +
      originality.score * STAGE_WEIGHTS.originality +
      irtEstimation.score * STAGE_WEIGHTS.irtEstimation;

    // Determine decision
    const decision = this.determineDecision(overallScore, allIssues);

    // Generate suggestions
    const suggestions = this.generateSuggestions(allIssues);

    return {
      questionId: question.id,
      validationTimestamp: new Date().toISOString(),
      stages: {
        structural,
        linguistic,
        medicalAccuracy,
        distractorQuality,
        originality,
        irtEstimation,
      },
      overallScore,
      decision,
      issues: allIssues,
      suggestions,
    };
  }

  /**
   * Stage 1: Validate structural properties
   */
  validateStructure(question: QGenGeneratedQuestion): ValidationStageResult {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Check stem length
    const stemWords = question.stem.split(/\s+/).length;
    if (stemWords < 30) {
      issues.push({
        severity: 'warning',
        category: 'structural',
        message: 'Enunciado muito curto, pode faltar contexto clinico',
        suggestion: 'Adicione mais detalhes ao caso clinico',
      });
      score -= 0.1;
    }
    if (stemWords > 300) {
      issues.push({
        severity: 'warning',
        category: 'structural',
        message: 'Enunciado muito longo, pode dificultar leitura',
        suggestion: 'Considere reduzir informacoes nao essenciais',
      });
      score -= 0.05;
    }

    // Check alternative count
    const altCount = Object.keys(question.alternatives).length;
    if (altCount < 4) {
      issues.push({
        severity: 'error',
        category: 'structural',
        message: `Apenas ${altCount} alternativas, minimo e 4`,
        suggestion: 'Adicione mais alternativas',
      });
      score -= 0.3;
    }

    // Check correct answer exists
    if (!question.alternatives[question.correctAnswer]) {
      issues.push({
        severity: 'error',
        category: 'structural',
        message: 'Gabarito nao corresponde a nenhuma alternativa',
      });
      score -= 0.5;
    }

    // Check alternative length balance
    const altLengths = Object.values(question.alternatives).map(a => a.split(/\s+/).length);
    const avgLength = altLengths.reduce((a, b) => a + b, 0) / altLengths.length;
    const maxDeviation = Math.max(...altLengths.map(l => Math.abs(l - avgLength)));

    if (maxDeviation > avgLength * 0.5) {
      issues.push({
        severity: 'warning',
        category: 'structural',
        message: 'Alternativas com tamanhos muito diferentes',
        suggestion: 'Equilibre o tamanho das alternativas',
      });
      score -= 0.1;
    }

    // Check for explanation
    if (!question.explanation || question.explanation.length < 50) {
      issues.push({
        severity: 'warning',
        category: 'structural',
        message: 'Comentario explicativo ausente ou muito curto',
        suggestion: 'Adicione explicacao detalhada da resposta',
      });
      score -= 0.1;
    }

    return {
      stageName: 'structural',
      score: Math.max(0, score),
      passed: score >= 0.7,
      details: {
        stemWordCount: stemWords,
        alternativeCount: altCount,
        avgAlternativeLength: avgLength,
        maxLengthDeviation: maxDeviation,
      },
      issues,
    };
  }

  /**
   * Stage 2: Analyze linguistic quality
   */
  analyzeLinguistics(question: QGenGeneratedQuestion): ValidationStageResult {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    const stem = question.stem.toLowerCase();
    const correctAlt = question.alternatives[question.correctAnswer]?.toLowerCase() || '';

    // Check for hedging markers in stem
    const hedgingInStem = LINGUISTIC_PATTERNS.hedgingMarkers.filter(m => stem.includes(m));
    if (hedgingInStem.length > 3) {
      issues.push({
        severity: 'info',
        category: 'linguistic',
        message: `Excesso de hedging no enunciado: ${hedgingInStem.join(', ')}`,
      });
    }

    // Check for absolute terms in correct answer (problematic)
    const absoluteInCorrect = LINGUISTIC_PATTERNS.absoluteMarkers.filter(m =>
      correctAlt.includes(m)
    );
    if (absoluteInCorrect.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'linguistic',
        message: `Termos absolutos na resposta correta: ${absoluteInCorrect.join(', ')}`,
        suggestion: 'Remova termos absolutos da alternativa correta',
      });
      score -= 0.15;
    }

    // Check for negative stem without highlight
    if (LINGUISTIC_PATTERNS.negativeStems.some(n => stem.includes(n))) {
      if (!stem.includes('exceto') && !stem.match(/\bNÃO\b/) && !stem.match(/\bINCORRETA\b/)) {
        issues.push({
          severity: 'warning',
          category: 'linguistic',
          message: 'Enunciado negativo sem destaque adequado',
          suggestion: 'Destaque termos negativos (EXCETO, NAO, INCORRETA) em caixa alta',
        });
        score -= 0.1;
      }
    }

    // Check correct answer is not significantly longer
    const altLengths = Object.entries(question.alternatives).map(([k, v]) => ({
      letter: k,
      length: v.split(/\s+/).length,
    }));
    const avgLength = altLengths.reduce((sum, a) => sum + a.length, 0) / altLengths.length;
    const correctLength = altLengths.find(a => a.letter === question.correctAnswer)?.length || avgLength;

    if (correctLength > avgLength * 1.3) {
      issues.push({
        severity: 'warning',
        category: 'linguistic',
        message: 'Resposta correta significativamente mais longa que as demais',
        suggestion: 'Equilibre o tamanho da resposta correta com os distratores',
      });
      score -= 0.15;
    }

    // Check for grammatical consistency
    // Basic check: all alternatives should end similarly (period, no period, etc.)
    const endings = Object.values(question.alternatives).map(a =>
      a.trim().endsWith('.') ? 'period' : 'no-period'
    );
    const uniqueEndings = [...new Set(endings)];
    if (uniqueEndings.length > 1) {
      issues.push({
        severity: 'info',
        category: 'linguistic',
        message: 'Inconsistencia na pontuacao final das alternativas',
        suggestion: 'Padronize a pontuacao final de todas as alternativas',
      });
      score -= 0.05;
    }

    return {
      stageName: 'linguistic',
      score: Math.max(0, score),
      passed: score >= 0.7,
      details: {
        hedgingCount: hedgingInStem.length,
        absoluteInCorrect: absoluteInCorrect.length,
        correctLengthRatio: correctLength / avgLength,
      },
      issues,
    };
  }

  /**
   * Stage 3: Check medical accuracy (requires LLM or external validation)
   */
  async checkMedicalAccuracy(question: QGenGeneratedQuestion): Promise<ValidationStageResult> {
    const issues: ValidationIssue[] = [];
    let score = 0.85; // Start with high assumption, deduct for issues

    // Basic heuristic checks (would use LLM in production)

    // Check for outdated drug names or practices
    const outdatedTerms = [
      'cimetidina', 'propranolol como primeira linha para HAS',
      'aspirina para dengue', 'corticoide para bronquiolite',
    ];
    const lowerText = (question.stem + ' ' + question.explanation).toLowerCase();

    for (const term of outdatedTerms) {
      if (lowerText.includes(term)) {
        issues.push({
          severity: 'warning',
          category: 'medical',
          message: `Possivel referencia a pratica desatualizada: ${term}`,
          suggestion: 'Verifique se a informacao esta atualizada',
        });
        score -= 0.1;
      }
    }

    // Check for potentially dangerous misinformation
    const dangerousPatterns = [
      { pattern: /aspirina.*dengue/i, message: 'Aspirina e contraindicada na dengue' },
      { pattern: /corticoide.*bronquiolite.*rotina/i, message: 'Corticoide nao e rotina em bronquiolite' },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(lowerText)) {
        issues.push({
          severity: 'error',
          category: 'medical',
          message: `Possivel erro medico: ${message}`,
          suggestion: 'Revise urgentemente',
        });
        score -= 0.3;
      }
    }

    // In production, this would call an LLM to verify medical accuracy
    // For now, we return a baseline score with any issues found

    return {
      stageName: 'medicalAccuracy',
      score: Math.max(0, score),
      passed: score >= 0.7,
      details: {
        validationMethod: 'heuristic',
        requiresExpertReview: issues.some(i => i.severity === 'error'),
      },
      issues,
    };
  }

  /**
   * Stage 4: Analyze distractor quality
   */
  analyzeDistractors(question: QGenGeneratedQuestion): ValidationStageResult {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    const distractors = Object.entries(question.alternatives).filter(
      ([letter]) => letter !== question.correctAnswer
    );

    // Check distractor count
    if (distractors.length < 3) {
      issues.push({
        severity: 'error',
        category: 'distractor',
        message: `Apenas ${distractors.length} distratores, minimo e 3`,
      });
      score -= 0.3;
    }

    // Analyze each distractor
    for (const [letter, text] of distractors) {
      const lowerText = text.toLowerCase();

      // Check for obviously wrong distractors (too short)
      if (text.split(/\s+/).length < 3) {
        issues.push({
          severity: 'warning',
          category: 'distractor',
          message: `Distrator ${letter} muito curto, pode ser obviamente errado`,
          suggestion: 'Elabore melhor o distrator',
        });
        score -= 0.1;
      }

      // Check for absolute terms (can be good in distractors but too many is bad)
      const absoluteCount = LINGUISTIC_PATTERNS.absoluteMarkers.filter(m =>
        lowerText.includes(m)
      ).length;
      if (absoluteCount > 2) {
        issues.push({
          severity: 'info',
          category: 'distractor',
          message: `Distrator ${letter} com muitos termos absolutos`,
        });
      }
    }

    // Check similarity between distractors
    const distractorTexts = distractors.map(([_, text]) => text.toLowerCase());
    for (let i = 0; i < distractorTexts.length; i++) {
      for (let j = i + 1; j < distractorTexts.length; j++) {
        const similarity = this.calculateTextSimilarity(distractorTexts[i], distractorTexts[j]);
        if (similarity > 0.8) {
          issues.push({
            severity: 'warning',
            category: 'distractor',
            message: 'Dois distratores muito similares entre si',
            suggestion: 'Diversifique os distratores',
          });
          score -= 0.15;
          break;
        }
      }
    }

    return {
      stageName: 'distractorQuality',
      score: Math.max(0, score),
      passed: score >= 0.7,
      details: {
        distractorCount: distractors.length,
      },
      issues,
    };
  }

  /**
   * Stage 5: Check originality (would use embeddings in production)
   */
  async checkOriginality(question: QGenGeneratedQuestion): Promise<ValidationStageResult> {
    const issues: ValidationIssue[] = [];
    let score = 0.9; // Assume original until proven otherwise

    // In production, this would:
    // 1. Generate embedding for the question
    // 2. Compare against corpus embeddings
    // 3. Flag if similarity > threshold

    // For now, use simple heuristics
    const stemLength = question.stem.length;

    // Very short stems might indicate copied/template questions
    if (stemLength < 100) {
      issues.push({
        severity: 'info',
        category: 'originality',
        message: 'Enunciado curto pode indicar questao generica',
      });
      score -= 0.1;
    }

    // Check for common template patterns
    const templatePatterns = [
      /paciente de \d+ anos procura emergência/i,
      /qual o diagnóstico mais provável\?$/i,
      /qual a conduta mais adequada\?$/i,
    ];

    let templateCount = 0;
    for (const pattern of templatePatterns) {
      if (pattern.test(question.stem)) {
        templateCount++;
      }
    }

    if (templateCount >= 2) {
      issues.push({
        severity: 'info',
        category: 'originality',
        message: 'Questao segue padrao comum, verificar originalidade',
      });
      score -= 0.1;
    }

    return {
      stageName: 'originality',
      score: Math.max(0, score),
      passed: score >= 0.7,
      details: {
        validationMethod: 'heuristic',
        corpusSimilarity: null, // Would be populated with embedding comparison
      },
      issues,
    };
  }

  /**
   * Stage 6: Estimate IRT parameters and alignment
   */
  estimateIRT(question: QGenGeneratedQuestion): ValidationStageResult {
    const issues: ValidationIssue[] = [];
    let score = 0.85;

    const targetDifficulty = question.targetDifficulty || 0;
    const estimatedDifficulty = question.estimatedDifficulty || 0;

    // Check difficulty alignment
    const difficultyDelta = Math.abs(targetDifficulty - estimatedDifficulty);
    if (difficultyDelta > 0.5) {
      issues.push({
        severity: 'warning',
        category: 'irt',
        message: `Dificuldade estimada (${estimatedDifficulty.toFixed(2)}) difere do alvo (${targetDifficulty.toFixed(2)})`,
        suggestion: 'Ajuste a complexidade da questao',
      });
      score -= 0.15;
    }

    // Check Bloom level alignment
    if (question.targetBloomLevel) {
      // Basic heuristic: higher Bloom levels should have longer stems with more clinical reasoning
      const stemLength = question.stem.split(/\s+/).length;
      const expectedMinLength: Record<BloomLevel, number> = {
        [BloomLevel.KNOWLEDGE]: 20,
        [BloomLevel.COMPREHENSION]: 40,
        [BloomLevel.APPLICATION]: 60,
        [BloomLevel.ANALYSIS]: 80,
        [BloomLevel.SYNTHESIS]: 100,
        [BloomLevel.EVALUATION]: 100,
      };

      const minLength = expectedMinLength[question.targetBloomLevel] || 50;
      if (stemLength < minLength) {
        issues.push({
          severity: 'info',
          category: 'irt',
          message: `Enunciado pode ser curto para nivel ${question.targetBloomLevel}`,
        });
        score -= 0.1;
      }
    }

    return {
      stageName: 'irtEstimation',
      score: Math.max(0, score),
      passed: score >= 0.7,
      details: {
        targetDifficulty,
        estimatedDifficulty,
        difficultyDelta,
        targetBloomLevel: question.targetBloomLevel,
      },
      issues,
    };
  }

  /**
   * Determine validation decision based on score and issues
   */
  private determineDecision(score: number, issues: ValidationIssue[]): ValidationDecision {
    // Critical errors always reject
    const criticalErrors = issues.filter(
      i => i.severity === 'error' && i.category === 'medical'
    );
    if (criticalErrors.length > 0) {
      return ValidationDecision.REJECT;
    }

    // Apply thresholds
    if (score >= DECISION_THRESHOLDS.AUTO_APPROVE) {
      // But require human review if there are any errors
      const hasErrors = issues.some(i => i.severity === 'error');
      return hasErrors ? ValidationDecision.PENDING_REVIEW : ValidationDecision.AUTO_APPROVE;
    }

    if (score >= DECISION_THRESHOLDS.PENDING_REVIEW) {
      return ValidationDecision.PENDING_REVIEW;
    }

    if (score >= DECISION_THRESHOLDS.NEEDS_REVISION) {
      return ValidationDecision.NEEDS_REVISION;
    }

    return ValidationDecision.REJECT;
  }

  /**
   * Generate suggestions based on issues
   */
  private generateSuggestions(issues: ValidationIssue[]): string[] {
    const suggestions: string[] = [];

    for (const issue of issues) {
      if (issue.suggestion && !suggestions.includes(issue.suggestion)) {
        suggestions.push(issue.suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Calculate simple text similarity (Jaccard)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// Singleton instance
export const qgenValidationService = new QGenValidationService();
