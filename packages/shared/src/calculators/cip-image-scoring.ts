/**
 * Darwin Education - CIP Image Interpretation Scoring
 * ====================================================
 *
 * Scoring system for image interpretation cases.
 * Weighted scoring: modality 10%, findings 30%, diagnosis 35%, next_step 25%.
 * Partial credit for findings (multi-select).
 */

import type { IRTParameters } from '../types/education';
import type {
  CIPImageCase,
  CIPImageAttempt,
  CIPImageScore,
  ImageStepResult,
  ImageInterpretationStep,
} from '../types/cip';
import { IMAGE_SCORING_WEIGHTS, IMAGE_STEP_LABELS_PT } from '../types/cip';
import { estimateThetaEAP, standardError, thetaToScaledScore } from './tri';

// ============================================
// Constants
// ============================================

const PASS_THRESHOLD = 600;

const DEFAULT_IMAGE_IRT: IRTParameters = {
  difficulty: 0,
  discrimination: 1.2,
  guessing: 0.25,
};

// ============================================
// Core Scoring
// ============================================

/**
 * Calculate the score for a completed image interpretation attempt.
 *
 * @param imageCase - The image case definition
 * @param attempt - The user's completed attempt
 * @returns Complete score with step-by-step breakdown and insights
 */
export function calculateImageScore(
  imageCase: CIPImageCase,
  attempt: CIPImageAttempt
): CIPImageScore {
  const stepResults: ImageStepResult[] = [];

  // --- Step 1: Modality ---
  const modalityCorrect =
    attempt.selectedModality === imageCase.modality;
  const selectedModalityOpt = imageCase.modalityOptions.find(
    (o) => o.id === attempt.selectedModality
  );
  const correctModalityOpt = imageCase.modalityOptions.find((o) => o.isCorrect);
  stepResults.push({
    step: 'modality',
    label: IMAGE_STEP_LABELS_PT.modality,
    correct: modalityCorrect,
    selectedAnswer: attempt.selectedModality || '',
    correctAnswer: imageCase.modality,
    weight: IMAGE_SCORING_WEIGHTS.modality,
    weightedScore: modalityCorrect ? IMAGE_SCORING_WEIGHTS.modality : 0,
    selectedOptionText: selectedModalityOpt?.textPt,
    correctOptionText: correctModalityOpt?.textPt,
    selectedExplanation: selectedModalityOpt?.explanationPt,
    correctExplanation: correctModalityOpt?.explanationPt,
    clinicalPearl: (selectedModalityOpt?.clinicalPearlPt || correctModalityOpt?.clinicalPearlPt),
  });

  // --- Step 2: Findings (partial credit) ---
  const correctFindingIds = new Set(
    imageCase.findingsOptions
      .filter((o) => o.isCorrect)
      .map((o) => o.id)
  );
  const selectedFindingIds = new Set(attempt.selectedFindings || []);
  const totalCorrectFindings = correctFindingIds.size;

  let findingsHits = 0;
  let findingsMisses = 0;

  for (const id of selectedFindingIds) {
    if (correctFindingIds.has(id)) {
      findingsHits++;
    } else {
      findingsMisses++;
    }
  }

  // Partial credit: hits / total correct, penalised by false positives
  const findingsPartial =
    totalCorrectFindings > 0
      ? Math.max(
          0,
          (findingsHits - findingsMisses * 0.5) / totalCorrectFindings
        )
      : 0;

  // Gather explanation text for findings
  const correctFindingsOpts = imageCase.findingsOptions.filter((o) => o.isCorrect);
  const findingsPearl = correctFindingsOpts
    .map((o) => o.clinicalPearlPt)
    .filter(Boolean)
    .join(' ');

  stepResults.push({
    step: 'findings',
    label: IMAGE_STEP_LABELS_PT.findings,
    correct: findingsPartial >= 1,
    partialCredit: findingsPartial,
    selectedAnswer: attempt.selectedFindings || [],
    correctAnswer: imageCase.correctFindings,
    weight: IMAGE_SCORING_WEIGHTS.findings,
    weightedScore: findingsPartial * IMAGE_SCORING_WEIGHTS.findings,
    selectedOptionText: (attempt.selectedFindings || [])
      .map((id) => imageCase.findingsOptions.find((o) => o.id === id)?.textPt)
      .filter(Boolean)
      .join(', '),
    correctOptionText: correctFindingsOpts.map((o) => o.textPt).join(', '),
    correctExplanation: correctFindingsOpts
      .map((o) => o.explanationPt)
      .filter(Boolean)
      .join(' '),
    clinicalPearl: findingsPearl || undefined,
  });

  // --- Step 3: Diagnosis ---
  const diagnosisCorrect =
    attempt.selectedDiagnosis === imageCase.correctDiagnosis;
  const selectedDiagOpt = imageCase.diagnosisOptions.find(
    (o) => o.id === attempt.selectedDiagnosis
  );
  const correctDiagOpt = imageCase.diagnosisOptions.find((o) => o.isCorrect);
  stepResults.push({
    step: 'diagnosis',
    label: IMAGE_STEP_LABELS_PT.diagnosis,
    correct: diagnosisCorrect,
    selectedAnswer: attempt.selectedDiagnosis || '',
    correctAnswer: imageCase.correctDiagnosis,
    weight: IMAGE_SCORING_WEIGHTS.diagnosis,
    weightedScore: diagnosisCorrect ? IMAGE_SCORING_WEIGHTS.diagnosis : 0,
    selectedOptionText: selectedDiagOpt?.textPt,
    correctOptionText: correctDiagOpt?.textPt,
    selectedExplanation: selectedDiagOpt?.explanationPt,
    correctExplanation: correctDiagOpt?.explanationPt,
    clinicalPearl: (selectedDiagOpt?.clinicalPearlPt || correctDiagOpt?.clinicalPearlPt),
  });

  // --- Step 4: Next Step ---
  const nextStepCorrect =
    attempt.selectedNextStep === imageCase.correctNextStep;
  const selectedNextOpt = imageCase.nextStepOptions.find(
    (o) => o.id === attempt.selectedNextStep
  );
  const correctNextOpt = imageCase.nextStepOptions.find((o) => o.isCorrect);
  stepResults.push({
    step: 'next_step',
    label: IMAGE_STEP_LABELS_PT.next_step,
    correct: nextStepCorrect,
    selectedAnswer: attempt.selectedNextStep || '',
    correctAnswer: imageCase.correctNextStep,
    weight: IMAGE_SCORING_WEIGHTS.next_step,
    weightedScore: nextStepCorrect ? IMAGE_SCORING_WEIGHTS.next_step : 0,
    selectedOptionText: selectedNextOpt?.textPt,
    correctOptionText: correctNextOpt?.textPt,
    selectedExplanation: selectedNextOpt?.explanationPt,
    correctExplanation: correctNextOpt?.explanationPt,
    clinicalPearl: (selectedNextOpt?.clinicalPearlPt || correctNextOpt?.clinicalPearlPt),
  });

  // --- Aggregate ---
  const totalScore = stepResults.reduce((sum, r) => sum + r.weightedScore, 0);
  const percentageCorrect = totalScore * 100;

  // Build IRT responses for theta estimation (one "item" per step)
  const responses: boolean[] = [
    modalityCorrect,
    findingsPartial >= 0.5, // treat >=50% findings as "correct" for IRT
    diagnosisCorrect,
    nextStepCorrect,
  ];

  const irt = imageCase.irt || DEFAULT_IMAGE_IRT;
  const items: IRTParameters[] = [
    { ...irt, difficulty: irt.difficulty - 0.5 },  // modality is easier
    { ...irt, difficulty: irt.difficulty + 0.2 },   // findings moderate
    { ...irt },                                      // diagnosis as-is
    { ...irt, difficulty: irt.difficulty + 0.3 },   // next step slightly harder
  ];

  const theta = estimateThetaEAP(responses, items);
  const se = standardError(theta, items);
  const scaledScore = thetaToScaledScore(theta);

  const insights = generateImageInsights(stepResults, scaledScore, imageCase);

  return {
    theta,
    standardError: se,
    scaledScore,
    passThreshold: PASS_THRESHOLD,
    passed: scaledScore >= PASS_THRESHOLD,
    totalScore,
    percentageCorrect,
    stepResults,
    insights,
  };
}

// ============================================
// Insights Generation
// ============================================

/**
 * Generate educational insights based on step-by-step performance.
 */
export function generateImageInsights(
  stepResults: ImageStepResult[],
  scaledScore: number,
  imageCase: CIPImageCase
): string[] {
  const insights: string[] = [];

  // Overall
  if (scaledScore >= PASS_THRESHOLD) {
    insights.push(
      `Parabéns! Você atingiu ${scaledScore} pontos na interpretação de imagem.`
    );
  } else {
    const gap = PASS_THRESHOLD - scaledScore;
    insights.push(
      `Você atingiu ${scaledScore} pontos. Faltaram ${gap} pontos para atingir o limiar.`
    );
  }

  // Per-step feedback — use per-option explanations when available
  for (const result of stepResults) {
    if (result.step === 'findings') {
      const partial = result.partialCredit ?? 0;
      if (partial >= 1) {
        insights.push(
          `Identificou corretamente todos os achados da imagem.`
        );
      } else if (partial >= 0.5) {
        insights.push(
          `Identificou parcialmente os achados (${Math.round(partial * 100)}%). Revise os achados desta modalidade.`
        );
      } else {
        insights.push(
          `Dificuldade em identificar os achados da imagem. Estude os padrões típicos de ${IMAGE_STEP_LABELS_PT[imageCase.modality as keyof typeof IMAGE_STEP_LABELS_PT] || imageCase.modality}.`
        );
      }
      if (result.correctExplanation) {
        insights.push(result.correctExplanation);
      }
    } else if (!result.correct) {
      // Use the per-option explanation if available, otherwise fall back to generic
      if (result.selectedExplanation) {
        insights.push(result.selectedExplanation);
      } else if (result.step === 'modality') {
        insights.push(
          `Modalidade incorreta. Revise as características que diferenciam cada tipo de exame.`
        );
      } else if (result.step === 'diagnosis') {
        insights.push(
          `Diagnóstico incorreto. Revise a correlação entre achados de imagem e patologias.`
        );
      } else if (result.step === 'next_step') {
        insights.push(
          `Conduta incorreta. Revise os protocolos de manejo para este diagnóstico.`
        );
      }
      // Add clinical pearl
      if (result.clinicalPearl) {
        insights.push(`💡 ${result.clinicalPearl}`);
      }
    }
  }

  // Add structured explanation common mistakes if student got things wrong
  const wrongCount = stepResults.filter((r) => !r.correct).length;
  if (wrongCount > 0 && imageCase.structuredExplanation?.commonMistakes?.length) {
    insights.push(
      `Erros comuns: ${imageCase.structuredExplanation.commonMistakes.join('; ')}`
    );
  }

  return insights;
}

// ============================================
// Exports
// ============================================

export { PASS_THRESHOLD as IMAGE_PASS_THRESHOLD, DEFAULT_IMAGE_IRT };
