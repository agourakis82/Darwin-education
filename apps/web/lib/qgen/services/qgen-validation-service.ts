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
import { medicalVerificationService } from './medical-verification-service';
import { CitationVerificationService } from '../../theory-gen/services/citation-verification-service';

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
  private citationVerifier = new CitationVerificationService();

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

    // Ban "all/none of the above" and similar meta-options (item-writing flaw)
    const bannedOptionPatterns: Array<{
      pattern: RegExp;
      message: string;
      suggestion: string;
    }> = [
      {
        pattern: /\b(todas?\s+as\s+(anteriores|alternativas|op[cç][õo]es)|all\s+of\s+the\s+above)\b/i,
        message: 'Alternativa do tipo "todas as anteriores" é proibida',
        suggestion: 'Substitua por uma alternativa específica e autocontida.',
      },
      {
        pattern: /\b(nenhuma\s+das?\s+(anteriores|alternativas|op[cç][õo]es)|none\s+of\s+the\s+above)\b/i,
        message: 'Alternativa do tipo "nenhuma das anteriores" é proibida',
        suggestion: 'Substitua por uma alternativa específica e autocontida.',
      },
      {
        pattern: /\b(ambas?\s+as\s+alternativas|both\s+[A-E]\s+and\s+[A-E])\b/i,
        message: 'Alternativa do tipo "A e B" (combinação de letras) é um vício de item-writing',
        suggestion: 'Reescreva para "uma melhor resposta" sem combinações de alternativas.',
      },
    ];

    const optionsEntries = Object.entries(question.alternatives || {});
    for (const [letter, text] of optionsEntries) {
      for (const banned of bannedOptionPatterns) {
        if (banned.pattern.test(text)) {
          issues.push({
            severity: 'error',
            category: 'structural',
            message: `Alternativa ${letter}: ${banned.message}`,
            suggestion: banned.suggestion,
          });
          score -= 0.25;
          break;
        }
      }
    }

    // Check for duplicate alternatives (exact/near-exact)
    const normalizedToLetters = new Map<string, string[]>();
    for (const [letter, text] of optionsEntries) {
      const normalized = this.normalizeForComparison(text);
      if (!normalized) continue;
      const prev = normalizedToLetters.get(normalized) || [];
      prev.push(letter);
      normalizedToLetters.set(normalized, prev);
    }

    const duplicates = Array.from(normalizedToLetters.entries()).filter(([, letters]) => letters.length >= 2);
    for (const [, letters] of duplicates) {
      issues.push({
        severity: 'error',
        category: 'structural',
        message: `Alternativas duplicadas (${letters.join(', ')})`,
        suggestion: 'Garanta que cada alternativa seja distinta e testável.',
      });
      score -= 0.2;
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
    const explanationText = (question.explanation || '').trim();
    if (!explanationText || explanationText.length < 120) {
      issues.push({
        severity: 'error',
        category: 'structural',
        message: 'Comentario explicativo ausente ou muito curto',
        suggestion: 'Adicione explicacao completa (raciocínio + por que os distratores estão errados).',
      });
      score -= 0.25;
    } else if (explanationText.length < 220) {
      issues.push({
        severity: 'warning',
        category: 'structural',
        message: 'Comentário explicativo curto; pode faltar justificativa clínica',
        suggestion: 'Amplie a explicação (inclua diagnóstico diferencial/conduta e refutação dos distratores).',
      });
      score -= 0.08;
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

    const stemRaw = question.stem || '';
    const stem = stemRaw.toLowerCase();
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
      const hasExplicitNegativeKeyword = stem.includes('exceto') || /\b(in)?corret[ao]\b/i.test(stem) || /\bn[ãa]o\b/i.test(stem);
      const hasHighlight =
        /\bEXCETO\b/.test(stemRaw) ||
        /\bN[ÃA]O\b/.test(stemRaw) ||
        /\bINCORRETA\b/.test(stemRaw) ||
        /\bN[AÃ]O\b/.test(stemRaw);

      if (hasExplicitNegativeKeyword && !hasHighlight) {
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
    const explanation = question.explanation || '';
    const alternatives = Object.values(question.alternatives || {}).filter(Boolean);
    const correctAlt = question.alternatives?.[question.correctAnswer] || '';

    const med = await medicalVerificationService.verifyQuestion(
      question.stem,
      alternatives,
      correctAlt,
      explanation
    );

    let score = med.overallScore;
    const lowerText = `${question.stem}\n${alternatives.join('\n')}\n${explanation}`.toLowerCase();

    // Dangerous patterns: CRITICAL -> error; WARNING -> warning (still blocks auto-approve)
    for (const pattern of med.dangerousPatterns) {
      issues.push({
        severity: pattern.severity === 'CRITICAL' ? 'error' : 'warning',
        category: 'medical',
        message: `Risco médico: ${pattern.reason}`,
        suggestion: 'Revise a recomendação e confirme em diretrizes oficiais.',
      });
    }

    // Outdated terminology/practices
    for (const term of med.outdatedTerms) {
      issues.push({
        severity: 'warning',
        category: 'medical',
        message: `Termo/prática possivelmente desatualizada: ${term.term}`,
        suggestion: term.currentTerm ? `Atualize para: ${term.currentTerm}` : 'Atualize a terminologia.',
      });
    }

    // Claim verification: low confidence or unverified claims should force human review
    const unverified = med.claimVerifications.filter((c) => !c.isVerified);
    const lowConfidence = med.claimVerifications.filter((c) => c.confidence === 'LOW');

    if (unverified.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'medical',
        message: `${unverified.length} afirmação(ões) não verificadas automaticamente`,
        suggestion: 'Adicione evidência e submeta para revisão humana.',
      });
      score -= 0.08;
    }

    if (lowConfidence.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'medical',
        message: `${lowConfidence.length} afirmação(ões) com baixa confiança`,
        suggestion: 'Confirme doses/condutas e adicione referências verificáveis.',
      });
      score -= 0.08;
    }

    const apiKeyMissing = med.claimVerifications.some((c) => c.concerns?.some((msg) => /api key/i.test(msg)));
    if (apiKeyMissing) {
      issues.push({
        severity: 'warning',
        category: 'medical',
        message: 'Verificação automática limitada (API key não configurada)',
        suggestion: 'Habilite o provedor de verificação médica ou force revisão humana.',
      });
      score -= 0.12;
    }

    // Scenario plausibility
    if (med.scenarioValidation && !med.scenarioValidation.isPlausible) {
      issues.push({
        severity: 'warning',
        category: 'medical',
        message: 'Cenário clínico pode estar incoerente ou pouco plausível',
        suggestion: 'Revise a vinheta (cronologia, sinais vitais, achados) para coerência clínica.',
      });
      score -= 0.1;
    }

    // Evidence / citations: require at least 1-2 verifiable sources for auto-approval.
    const urls = this.extractUrls(explanation);
    if (urls.length === 0 && explanation.trim().length > 0) {
      issues.push({
        severity: 'error',
        category: 'evidence',
        message: 'Comentário sem referências (URLs) verificáveis',
        suggestion: 'Inclua 1–3 referências com URL (diretrizes de sociedades, PubMed/NCBI, periódicos Q1).',
      });
      score -= 0.22;
    } else if (urls.length > 0) {
      const unique = Array.from(new Set(urls)).slice(0, 3);
      const verifications = await this.citationVerifier.verifyAllCitations(
        unique.map((url) => ({ url, title: url, evidenceLevel: 'C' as const }))
      );

      const authoritative = verifications.filter((v) => v.isAuthoritative);
      if (authoritative.length === 0) {
        issues.push({
          severity: 'error',
          category: 'evidence',
          message: 'Nenhuma referência de fonte confiável (sociedades/PubMed/periódicos)',
          suggestion: 'Troque por fontes oficiais (sociedades médicas, PubMed/NCBI, NEJM/Lancet/JAMA/BMJ).',
        });
        score -= 0.25;
      }

      const weak = verifications.filter((v) => v.verificationScore < 0.6 || !v.isAuthoritative);
      if (weak.length > 0) {
        issues.push({
          severity: 'warning',
          category: 'evidence',
          message: `${weak.length} referência(s) pouco confiável(is) ou inacessível(is)`,
          suggestion: 'Prefira sociedades médicas, PubMed/NCBI, periódicos e diretrizes oficiais.',
        });
        score -= Math.min(0.15, weak.length * 0.05);
      }
    }

    // Extra local heuristics (lightweight guardrails)
    if (/\\baspirina\\b.*\\bdengue\\b/i.test(lowerText)) {
      issues.push({
        severity: 'error',
        category: 'medical',
        message: 'Possível contraindicação: AAS em dengue',
        suggestion: 'Remova AAS e reescreva a conduta conforme diretrizes.',
      });
      score -= 0.25;
    }

    score = Math.max(0, Math.min(1, score));

    return {
      stageName: 'medicalAccuracy',
      score,
      passed: score >= 0.7 && !issues.some((i) => i.severity === 'error'),
      details: {
        validationMethod: 'medical-verification-service',
        medicalScore: med.overallScore,
        dangerousPatternCount: med.dangerousPatterns.length,
        outdatedTermCount: med.outdatedTerms.length,
        claimCount: med.claimVerifications.length,
        citationsFound: this.extractUrls(explanation).length,
        requiresExpertReview:
          med.dangerousPatterns.length > 0 ||
          !med.isAccurate ||
          unverified.length > 0 ||
          lowConfidence.length > 0 ||
          apiKeyMissing,
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

    const correctAlt = question.alternatives?.[question.correctAnswer] || '';

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
        if (similarity > DISTRACTOR_THRESHOLDS.maxSemanticSimilarity) {
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

    // Check distractors too similar to the correct answer (ambiguity risk)
    const correctLower = correctAlt.toLowerCase();
    for (const [letter, text] of distractors) {
      const simToCorrect = this.calculateTextSimilarity(correctLower, text.toLowerCase());
      if (simToCorrect > DISTRACTOR_THRESHOLDS.maxSemanticSimilarity) {
        issues.push({
          severity: 'warning',
          category: 'distractor',
          message: `Distrator ${letter} pode estar próximo demais da resposta correta (ambiguidade)`,
          suggestion: 'Ajuste o distrator para ser plausível, porém claramente distinto da correta.',
        });
        score -= 0.1;
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

    // Any other error means the item needs revision (we don't auto-ship broken structure/evidence)
    const hasAnyError = issues.some((i) => i.severity === 'error');
    if (hasAnyError) {
      return score >= DECISION_THRESHOLDS.NEEDS_REVISION
        ? ValidationDecision.NEEDS_REVISION
        : ValidationDecision.REJECT;
    }

    // Medical/evidence warnings should always trigger human review before auto-approval
    const hasMedicalOrEvidenceWarnings = issues.some(
      (i) => (i.category === 'medical' || i.category === 'evidence') && i.severity === 'warning'
    );

    // Apply thresholds
    if (score >= DECISION_THRESHOLDS.AUTO_APPROVE) {
      // But require human review if there are any errors
      const hasErrors = issues.some(i => i.severity === 'error');
      if (hasErrors || hasMedicalOrEvidenceWarnings) return ValidationDecision.PENDING_REVIEW;
      return ValidationDecision.AUTO_APPROVE;
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

  private extractUrls(text: string): string[] {
    if (!text) return []
    const matches = text.match(/https?:\/\/[^\s)]+/g) || []
    return matches
      .map((url) => url.replace(/[.,;]+$/, ''))
      .filter((url) => url.length > 0)
  }

  private normalizeForComparison(text: string): string {
    return (text || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
