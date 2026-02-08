/**
 * Darwin Education - FCR (Fractal Clinical Reasoning) Scoring
 * ============================================================
 *
 * Scoring system for fractal clinical reasoning cases.
 * Weighted scoring: dados 15%, padrão 25%, hipótese 35%, conduta 25%.
 * Partial credit for dados (multi-select).
 *
 * Also computes:
 *  - Calibration score (Brier-score based, 0-100)
 *  - Overconfidence index (-1 to +1)
 *  - DDL lacuna detection from error × confidence patterns
 */

import type { IRTParameters } from '../types/education';
import type {
  FCRCase,
  FCRAttempt,
  FCRScore,
  FCRLevelResult,
  FCRDetectedLacuna,
  FCRLevel,
  ConfidenceRating,
  CalibrationQuadrant,
} from '../types/fcr';
import {
  FCR_SCORING_WEIGHTS,
  FCR_LEVEL_LABELS_PT,
  FCR_LEVEL_ORDER,
} from '../types/fcr';
import { estimateThetaEAP, standardError, thetaToScaledScore } from './tri';

// ============================================
// Constants
// ============================================

const PASS_THRESHOLD = 600;

const DEFAULT_FCR_IRT: IRTParameters = {
  difficulty: 0,
  discrimination: 1.2,
  guessing: 0.25,
};

/** Confidence threshold for "high confidence" quadrant classification */
const HIGH_CONFIDENCE_THRESHOLD = 4;

// ============================================
// Quadrant Classification
// ============================================

/**
 * Classify a (correct, confidence) pair into a calibration quadrant.
 */
export function classifyQuadrant(
  correct: boolean,
  confidence: ConfidenceRating
): CalibrationQuadrant {
  const highConfidence = confidence >= HIGH_CONFIDENCE_THRESHOLD;

  if (correct && highConfidence) return 'mastery';
  if (correct && !highConfidence) return 'unconscious_competence';
  if (!correct && highConfidence) return 'illusion_of_knowing';
  return 'known_unknown';
}

// ============================================
// Calibration Metrics
// ============================================

/**
 * Calculate calibration score using adapted Brier Score (0-100).
 * Higher = better calibrated.
 *
 * For each level:
 *   expected = confidence / 5   (0.2 to 1.0)
 *   actual   = correct ? 1 : 0
 *   error    = (expected - actual)²
 *
 * calibrationScore = 100 × (1 - mean(errors))
 */
export function calculateCalibrationScore(
  levelResults: FCRLevelResult[]
): number {
  if (levelResults.length === 0) return 0;

  let totalError = 0;
  for (const result of levelResults) {
    const expected = result.confidence / 5;
    const actual = result.correct ? 1 : (result.partialCredit ?? 0);
    totalError += (expected - actual) ** 2;
  }

  const meanError = totalError / levelResults.length;
  return Math.round(100 * (1 - meanError));
}

/**
 * Calculate overconfidence index (-1 to +1).
 * Positive = overconfident, negative = underconfident, ~0 = well-calibrated.
 *
 * overconfidence = mean(confidence/5) - mean(correct ? 1 : 0)
 */
export function calculateOverconfidenceIndex(
  levelResults: FCRLevelResult[]
): number {
  if (levelResults.length === 0) return 0;

  let sumConfidence = 0;
  let sumActual = 0;

  for (const result of levelResults) {
    sumConfidence += result.confidence / 5;
    sumActual += result.correct ? 1 : (result.partialCredit ?? 0);
  }

  const meanConfidence = sumConfidence / levelResults.length;
  const meanActual = sumActual / levelResults.length;

  return Math.round((meanConfidence - meanActual) * 1000) / 1000;
}

// ============================================
// Lacuna Detection
// ============================================

/**
 * Detect DDL lacunas from FCR level results.
 *
 * Mapping:
 *  - Level 1 (dados) wrong → LE (fundamental knowledge gap)
 *  - Levels 2-3 (padrão/hipótese) wrong → LIE (integration gap)
 *  - Any level wrong + high confidence → LEm (metacognitive gap)
 */
export function detectLacunas(
  levelResults: FCRLevelResult[]
): FCRDetectedLacuna[] {
  const lacunas: FCRDetectedLacuna[] = [];

  for (const result of levelResults) {
    if (result.correct && (result.partialCredit === undefined || result.partialCredit >= 0.8)) {
      continue;
    }

    // Check for metacognitive gap first (overrides structural classification)
    if (result.quadrant === 'illusion_of_knowing') {
      lacunas.push({
        type: 'LEm',
        level: result.level,
        evidence: `Erro com alta confiança (${result.confidence}/5) no nível "${result.label}". Indica ilusão de saber — o aluno acredita dominar o conteúdo mas comete erros.`,
      });
    }

    // Structural lacuna based on level
    if (result.level === 'dados' || result.level === 'conduta') {
      lacunas.push({
        type: 'LE',
        level: result.level,
        evidence:
          result.level === 'dados'
            ? `Falha em identificar dados-chave do caso. Indica lacuna de conhecimento fundamental.`
            : `Erro na conduta/manejo. Indica lacuna no conhecimento de protocolos terapêuticos.`,
      });
    } else if (result.level === 'padrao' || result.level === 'hipotese') {
      lacunas.push({
        type: 'LIE',
        level: result.level,
        evidence:
          result.level === 'padrao'
            ? `Falha em reconhecer o padrão/síndrome clínica. Indica dificuldade em integrar achados.`
            : `Erro no diagnóstico diferencial. Indica lacuna na integração avançada de conceitos clínicos.`,
      });
    }
  }

  return lacunas;
}

// ============================================
// Core Scoring
// ============================================

/**
 * Calculate the complete FCR score for a finished attempt.
 */
export function calculateFCRScore(
  fcrCase: FCRCase,
  attempt: FCRAttempt
): FCRScore {
  const levelResults: FCRLevelResult[] = [];

  // --- Level 1: Dados (multi-select, partial credit) ---
  const correctDadosIds = new Set(fcrCase.correctDados);
  const selectedDadosIds = new Set(attempt.selectedDados || []);
  const totalCorrectDados = correctDadosIds.size;

  let dadosHits = 0;
  let dadosMisses = 0;
  for (const id of selectedDadosIds) {
    if (correctDadosIds.has(id)) {
      dadosHits++;
    } else {
      dadosMisses++;
    }
  }

  const dadosPartial =
    totalCorrectDados > 0
      ? Math.max(0, (dadosHits - dadosMisses * 0.5) / totalCorrectDados)
      : 0;

  const dadosConfidence = attempt.confidenceDados ?? 3;
  const dadosCorrect = dadosPartial >= 1;

  const correctDadosOpts = fcrCase.dadosOptions.filter((o) => o.isCorrect);
  const selectedDadosOpts = (attempt.selectedDados || [])
    .map((id) => fcrCase.dadosOptions.find((o) => o.id === id))
    .filter(Boolean);

  levelResults.push({
    level: 'dados',
    label: FCR_LEVEL_LABELS_PT.dados,
    correct: dadosCorrect,
    partialCredit: dadosPartial,
    confidence: dadosConfidence as ConfidenceRating,
    quadrant: classifyQuadrant(dadosPartial >= 0.5, dadosConfidence as ConfidenceRating),
    weight: FCR_SCORING_WEIGHTS.dados,
    weightedScore: dadosPartial * FCR_SCORING_WEIGHTS.dados,
    timeSpentMs: attempt.stepTimes?.dados ?? 0,
    selectedOptionText: selectedDadosOpts.map((o) => o!.textPt).join(', '),
    correctOptionText: correctDadosOpts.map((o) => o.textPt).join(', '),
    correctExplanation: correctDadosOpts
      .map((o) => o.explanationPt)
      .filter(Boolean)
      .join(' '),
    clinicalPearl: correctDadosOpts
      .map((o) => o.clinicalPearlPt)
      .filter(Boolean)
      .join(' ') || undefined,
  });

  // --- Levels 2-4: Single select ---
  const singleLevels: {
    level: FCRLevel;
    options: typeof fcrCase.padraoOptions;
    correctId: string;
    selected: string | null;
    confidence: ConfidenceRating;
    timeMs: number;
  }[] = [
    {
      level: 'padrao',
      options: fcrCase.padraoOptions,
      correctId: fcrCase.correctPadrao,
      selected: attempt.selectedPadrao,
      confidence: (attempt.confidencePadrao ?? 3) as ConfidenceRating,
      timeMs: attempt.stepTimes?.padrao ?? 0,
    },
    {
      level: 'hipotese',
      options: fcrCase.hipoteseOptions,
      correctId: fcrCase.correctHipotese,
      selected: attempt.selectedHipotese,
      confidence: (attempt.confidenceHipotese ?? 3) as ConfidenceRating,
      timeMs: attempt.stepTimes?.hipotese ?? 0,
    },
    {
      level: 'conduta',
      options: fcrCase.condutaOptions,
      correctId: fcrCase.correctConduta,
      selected: attempt.selectedConduta,
      confidence: (attempt.confidenceConduta ?? 3) as ConfidenceRating,
      timeMs: attempt.stepTimes?.conduta ?? 0,
    },
  ];

  for (const sl of singleLevels) {
    const correct = sl.selected === sl.correctId;
    const selectedOpt = sl.options.find((o) => o.id === sl.selected);
    const correctOpt = sl.options.find((o) => o.isCorrect);

    levelResults.push({
      level: sl.level,
      label: FCR_LEVEL_LABELS_PT[sl.level],
      correct,
      confidence: sl.confidence,
      quadrant: classifyQuadrant(correct, sl.confidence),
      weight: FCR_SCORING_WEIGHTS[sl.level],
      weightedScore: correct ? FCR_SCORING_WEIGHTS[sl.level] : 0,
      timeSpentMs: sl.timeMs,
      selectedOptionText: selectedOpt?.textPt,
      correctOptionText: correctOpt?.textPt,
      selectedExplanation: selectedOpt?.explanationPt,
      correctExplanation: correctOpt?.explanationPt,
      clinicalPearl:
        selectedOpt?.clinicalPearlPt || correctOpt?.clinicalPearlPt,
    });
  }

  // --- Aggregate ---
  const totalScore = levelResults.reduce((sum, r) => sum + r.weightedScore, 0);
  const percentageCorrect = totalScore * 100;

  // IRT theta estimation (one "item" per level with difficulty offsets)
  const responses: boolean[] = [
    dadosPartial >= 0.5,
    levelResults[1].correct,
    levelResults[2].correct,
    levelResults[3].correct,
  ];

  const irt = fcrCase.irt || DEFAULT_FCR_IRT;
  const items: IRTParameters[] = [
    { ...irt, difficulty: irt.difficulty - 0.3 }, // dados easier
    { ...irt, difficulty: irt.difficulty + 0.1 }, // padrão moderate
    { ...irt, difficulty: irt.difficulty + 0.3 }, // hipótese harder
    { ...irt, difficulty: irt.difficulty + 0.2 }, // conduta moderate-hard
  ];

  const theta = estimateThetaEAP(responses, items);
  const se = standardError(theta, items);
  const scaledScore = thetaToScaledScore(theta);

  // Calibration metrics
  const calibrationScore = calculateCalibrationScore(levelResults);
  const overconfidenceIndex = calculateOverconfidenceIndex(levelResults);

  // Lacuna detection
  const detectedLacunas = detectLacunas(levelResults);

  // Insights
  const insights = generateFCRInsights(
    levelResults,
    scaledScore,
    calibrationScore,
    overconfidenceIndex,
    detectedLacunas,
    fcrCase
  );

  return {
    theta,
    standardError: se,
    scaledScore,
    passed: scaledScore >= PASS_THRESHOLD,
    totalScore,
    percentageCorrect,
    levelResults,
    calibrationScore,
    overconfidenceIndex,
    detectedLacunas,
    insights,
  };
}

// ============================================
// Insights Generation
// ============================================

/**
 * Generate educational insights based on FCR performance + calibration.
 */
export function generateFCRInsights(
  levelResults: FCRLevelResult[],
  scaledScore: number,
  calibrationScore: number,
  overconfidenceIndex: number,
  lacunas: FCRDetectedLacuna[],
  fcrCase: FCRCase
): string[] {
  const insights: string[] = [];

  // Overall score
  if (scaledScore >= PASS_THRESHOLD) {
    insights.push(
      `Parabéns! Você atingiu ${scaledScore} pontos no raciocínio clínico fractal.`
    );
  } else {
    const gap = PASS_THRESHOLD - scaledScore;
    insights.push(
      `Você atingiu ${scaledScore} pontos. Faltaram ${gap} pontos para atingir o limiar.`
    );
  }

  // Calibration feedback
  if (calibrationScore >= 80) {
    insights.push(
      `Excelente calibração metacognitiva (${calibrationScore}/100). Sua autoavaliação de confiança reflete bem seu conhecimento real.`
    );
  } else if (calibrationScore >= 60) {
    insights.push(
      `Calibração metacognitiva moderada (${calibrationScore}/100). Há espaço para melhorar a precisão da sua autoavaliação.`
    );
  } else {
    insights.push(
      `Calibração metacognitiva baixa (${calibrationScore}/100). Pratique avaliar sua confiança de forma mais realista.`
    );
  }

  // Overconfidence feedback
  if (overconfidenceIndex > 0.2) {
    insights.push(
      `Tendência ao excesso de confiança (índice: ${overconfidenceIndex > 0 ? '+' : ''}${overconfidenceIndex.toFixed(2)}). Cuidado com a "ilusão de saber" — erros com alta confiança são os mais perigosos na prática clínica.`
    );
  } else if (overconfidenceIndex < -0.2) {
    insights.push(
      `Tendência à subconfiança (índice: ${overconfidenceIndex.toFixed(2)}). Você sabe mais do que acredita! Confie mais no seu raciocínio.`
    );
  }

  // Per-level feedback
  for (const result of levelResults) {
    if (result.level === 'dados') {
      const partial = result.partialCredit ?? 0;
      if (partial >= 1) {
        insights.push(`Identificou corretamente todos os dados-chave do caso.`);
      } else if (partial >= 0.5) {
        insights.push(
          `Identificou parcialmente os dados (${Math.round(partial * 100)}%). Revise a coleta sistematizada de dados clínicos.`
        );
      } else {
        insights.push(
          `Dificuldade em identificar os dados-chave. Pratique a leitura sistematizada de casos clínicos.`
        );
      }
    } else if (!result.correct) {
      if (result.selectedExplanation) {
        insights.push(result.selectedExplanation);
      } else if (result.level === 'padrao') {
        insights.push(
          `Padrão clínico incorreto. Revise o reconhecimento de síndromes e padrões.`
        );
      } else if (result.level === 'hipotese') {
        insights.push(
          `Hipótese diagnóstica incorreta. Pratique o diagnóstico diferencial sistematizado.`
        );
      } else if (result.level === 'conduta') {
        insights.push(
          `Conduta incorreta. Revise os protocolos de manejo para este diagnóstico.`
        );
      }

      if (result.clinicalPearl) {
        insights.push(result.clinicalPearl);
      }
    }
  }

  // Illusion of knowing warning
  const illusionLevels = levelResults.filter(
    (r) => r.quadrant === 'illusion_of_knowing'
  );
  if (illusionLevels.length > 0) {
    const levelNames = illusionLevels.map((r) => r.label).join(', ');
    insights.push(
      `Atenção: Ilusão de saber detectada em ${levelNames}. Erros com alta confiança indicam necessidade de revisão profunda destes conceitos.`
    );
  }

  // Structured explanation
  if (fcrCase.structuredExplanation?.commonMistakes?.length) {
    const wrongCount = levelResults.filter((r) => !r.correct).length;
    if (wrongCount > 0) {
      insights.push(
        `Erros comuns neste caso: ${fcrCase.structuredExplanation.commonMistakes.join('; ')}`
      );
    }
  }

  return insights;
}

// ============================================
// Exports
// ============================================

export { PASS_THRESHOLD as FCR_PASS_THRESHOLD, DEFAULT_FCR_IRT };
