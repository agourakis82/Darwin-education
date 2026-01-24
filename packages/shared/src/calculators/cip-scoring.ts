/**
 * Darwin Education - CIP Scoring
 * ===============================
 *
 * Scoring system for CIP (Comprehensive Integrative Puzzle) assessments.
 * Integrates with the existing TRI scoring infrastructure.
 */

import type { IRTParameters } from '../types/education';
import type {
  CIPPuzzle,
  CIPAttempt,
  CIPScore,
  CIPCell,
  CIPSection,
  CIPSectionPerformance,
  CIPDiagnosisPerformance,
  CIP_SECTION_LABELS_PT,
} from '../types/cip';
import { estimateThetaEAP, standardError, thetaToScaledScore } from './tri';
import { getCellKey, parseCellKey } from './cip';

// ============================================
// Constants
// ============================================

/** Pass threshold for CIP puzzles (same as ENAMED) */
const PASS_THRESHOLD = 600;

/** Default IRT parameters for cells without explicit parameters */
const DEFAULT_CELL_IRT: IRTParameters = {
  difficulty: 0,
  discrimination: 1.2,
  guessing: 0.1,
};

// ============================================
// Core Scoring Functions
// ============================================

/**
 * Calculate CIP score from a completed attempt
 *
 * @param puzzle - The CIP puzzle definition
 * @param attempt - The user's completed attempt
 * @returns Complete CIP score with breakdowns
 */
export function calculateCIPScore(
  puzzle: CIPPuzzle,
  attempt: CIPAttempt
): CIPScore {
  // Flatten puzzle grid for processing
  const allCells = puzzle.grid.flat();

  // Build responses and IRT items arrays for TRI scoring
  const responses: boolean[] = [];
  const items: IRTParameters[] = [];

  // Initialize tracking for section and diagnosis breakdowns
  const sectionStats: Record<CIPSection, { correct: number; total: number }> = {
    medical_history: { correct: 0, total: 0 },
    physical_exam: { correct: 0, total: 0 },
    laboratory: { correct: 0, total: 0 },
    imaging: { correct: 0, total: 0 },
    pathology: { correct: 0, total: 0 },
    treatment: { correct: 0, total: 0 },
  };

  const diagnosisStats: Map<number, { correct: number; total: number }> = new Map();

  // Process each cell
  for (const cell of allCells) {
    const cellKey = getCellKey(cell.row, cell.column);
    const selectedFindingId = attempt.gridState[cellKey] || null;

    // Determine if correct
    const isCorrect = selectedFindingId === cell.correctFindingId;

    // Add to responses
    responses.push(isCorrect);

    // Use cell-level IRT if available, otherwise puzzle-level or default
    const cellIrt = cell.irt || puzzle.irt || DEFAULT_CELL_IRT;
    items.push(cellIrt);

    // Track section stats
    sectionStats[cell.column].total++;
    if (isCorrect) {
      sectionStats[cell.column].correct++;
    }

    // Track diagnosis stats
    if (!diagnosisStats.has(cell.row)) {
      diagnosisStats.set(cell.row, { correct: 0, total: 0 });
    }
    diagnosisStats.get(cell.row)!.total++;
    if (isCorrect) {
      diagnosisStats.get(cell.row)!.correct++;
    }
  }

  // Calculate theta using EAP estimation (same as regular exams)
  const theta = estimateThetaEAP(responses, items);
  const se = standardError(theta, items);
  const scaledScore = thetaToScaledScore(theta);

  // Build section breakdown
  const sectionBreakdown: Record<CIPSection, CIPSectionPerformance> = {} as Record<
    CIPSection,
    CIPSectionPerformance
  >;

  for (const section of puzzle.settings.sections) {
    const stats = sectionStats[section];
    sectionBreakdown[section] = {
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    };
  }

  // Build diagnosis breakdown
  const diagnosisBreakdown: CIPDiagnosisPerformance[] = [];

  for (let i = 0; i < puzzle.diagnoses.length; i++) {
    const diagnosis = puzzle.diagnoses[i];
    const stats = diagnosisStats.get(i) || { correct: 0, total: 0 };

    diagnosisBreakdown.push({
      diagnosisId: diagnosis.id,
      diagnosisName: diagnosis.namePt,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    });
  }

  // Calculate totals
  const correctCount = responses.filter(r => r).length;
  const totalCells = responses.length;
  const percentageCorrect = totalCells > 0 ? (correctCount / totalCells) * 100 : 0;

  return {
    theta,
    standardError: se,
    scaledScore,
    passThreshold: PASS_THRESHOLD,
    passed: scaledScore >= PASS_THRESHOLD,
    correctCount,
    totalCells,
    percentageCorrect,
    sectionBreakdown,
    diagnosisBreakdown,
  };
}

// ============================================
// Partial Scoring (During Attempt)
// ============================================

/**
 * Calculate partial score for an in-progress attempt
 * Used for real-time feedback
 */
export function calculatePartialCIPScore(
  puzzle: CIPPuzzle,
  gridState: Record<string, string>
): {
  answeredCount: number;
  totalCells: number;
  correctCount: number;
  percentageComplete: number;
  estimatedScore?: number;
} {
  const allCells = puzzle.grid.flat();
  const totalCells = allCells.length;

  let answeredCount = 0;
  let correctCount = 0;

  for (const cell of allCells) {
    const cellKey = getCellKey(cell.row, cell.column);
    const selectedFindingId = gridState[cellKey];

    if (selectedFindingId) {
      answeredCount++;
      if (selectedFindingId === cell.correctFindingId) {
        correctCount++;
      }
    }
  }

  const percentageComplete = (answeredCount / totalCells) * 100;

  // Estimate final score if enough answered
  let estimatedScore: number | undefined;
  if (answeredCount >= totalCells * 0.5) {
    // Simple linear estimation based on current accuracy
    const currentAccuracy = answeredCount > 0 ? correctCount / answeredCount : 0;
    // Assume remaining answers have same accuracy
    const projectedCorrect = correctCount + (totalCells - answeredCount) * currentAccuracy;
    const projectedAccuracy = projectedCorrect / totalCells;

    // Map to score (500 = 50%, 600 = 60%, etc.)
    estimatedScore = Math.round(projectedAccuracy * 1000);
  }

  return {
    answeredCount,
    totalCells,
    correctCount,
    percentageComplete,
    estimatedScore,
  };
}

// ============================================
// Detailed Cell Analysis
// ============================================

/**
 * Get detailed analysis of each cell after completion
 */
export function analyzeCellResponses(
  puzzle: CIPPuzzle,
  attempt: CIPAttempt
): Array<{
  row: number;
  column: CIPSection;
  diagnosisName: string;
  sectionLabel: string;
  correctFindingId: string;
  correctFindingText: string;
  selectedFindingId: string | null;
  selectedFindingText: string | null;
  isCorrect: boolean;
  timeSpent: number;
}> {
  const results: Array<{
    row: number;
    column: CIPSection;
    diagnosisName: string;
    sectionLabel: string;
    correctFindingId: string;
    correctFindingText: string;
    selectedFindingId: string | null;
    selectedFindingText: string | null;
    isCorrect: boolean;
    timeSpent: number;
  }> = [];

  const sectionLabels: Record<CIPSection, string> = {
    medical_history: 'Anamnese',
    physical_exam: 'Exame Físico',
    laboratory: 'Laboratório',
    imaging: 'Imagem/ECG',
    pathology: 'Patologia',
    treatment: 'Tratamento',
  };

  for (const row of puzzle.grid) {
    for (const cell of row) {
      const cellKey = getCellKey(cell.row, cell.column);
      const selectedFindingId = attempt.gridState[cellKey] || null;

      // Find correct finding text
      const correctFinding = puzzle.optionsPerSection[cell.column].find(
        f => f.id === cell.correctFindingId
      );

      // Find selected finding text
      const selectedFinding = selectedFindingId
        ? puzzle.optionsPerSection[cell.column].find(f => f.id === selectedFindingId)
        : null;

      results.push({
        row: cell.row,
        column: cell.column,
        diagnosisName: puzzle.diagnoses[cell.row].namePt,
        sectionLabel: sectionLabels[cell.column],
        correctFindingId: cell.correctFindingId,
        correctFindingText: correctFinding?.textPt || 'N/A',
        selectedFindingId,
        selectedFindingText: selectedFinding?.textPt || null,
        isCorrect: selectedFindingId === cell.correctFindingId,
        timeSpent: attempt.timePerCell[cellKey] || 0,
      });
    }
  }

  return results;
}

// ============================================
// Performance Insights
// ============================================

/**
 * Generate performance insights based on CIP score
 */
export function generateCIPInsights(score: CIPScore): string[] {
  const insights: string[] = [];

  // Overall performance
  if (score.passed) {
    insights.push(
      `Parabéns! Você atingiu ${score.scaledScore} pontos, acima do limiar de aprovação (${score.passThreshold}).`
    );
  } else {
    const gap = score.passThreshold - score.scaledScore;
    insights.push(
      `Você atingiu ${score.scaledScore} pontos. Faltaram ${gap} pontos para atingir o limiar de aprovação.`
    );
  }

  // Section analysis
  const sectionScores = Object.entries(score.sectionBreakdown)
    .filter(([_, perf]) => perf.total > 0)
    .sort((a, b) => a[1].percentage - b[1].percentage);

  if (sectionScores.length > 0) {
    const weakestSection = sectionScores[0];
    const strongestSection = sectionScores[sectionScores.length - 1];

    const sectionLabels: Record<string, string> = {
      medical_history: 'Anamnese',
      physical_exam: 'Exame Físico',
      laboratory: 'Laboratório',
      imaging: 'Imagem/ECG',
      pathology: 'Patologia',
      treatment: 'Tratamento',
    };

    if (weakestSection[1].percentage < 50) {
      insights.push(
        `Atenção: ${sectionLabels[weakestSection[0]]} teve o menor desempenho (${Math.round(weakestSection[1].percentage)}%). Revise este tema.`
      );
    }

    if (strongestSection[1].percentage >= 80) {
      insights.push(
        `Excelente desempenho em ${sectionLabels[strongestSection[0]]} (${Math.round(strongestSection[1].percentage)}%).`
      );
    }
  }

  // Diagnosis analysis
  const weakDiagnoses = score.diagnosisBreakdown.filter(d => d.percentage < 50);
  if (weakDiagnoses.length > 0) {
    const names = weakDiagnoses.map(d => d.diagnosisName).slice(0, 3);
    insights.push(
      `Diagnósticos para revisar: ${names.join(', ')}.`
    );
  }

  // Accuracy insight
  if (score.percentageCorrect >= 80) {
    insights.push(
      `Ótima integração clínica! ${Math.round(score.percentageCorrect)}% das associações estavam corretas.`
    );
  } else if (score.percentageCorrect < 50) {
    insights.push(
      `Revise a integração entre diagnósticos e achados clínicos. Apenas ${Math.round(score.percentageCorrect)}% das associações estavam corretas.`
    );
  }

  return insights;
}

// ============================================
// Score Comparison
// ============================================

/**
 * Compare two CIP scores (e.g., for progress tracking)
 */
export function compareCIPScores(
  current: CIPScore,
  previous: CIPScore
): {
  scoreDelta: number;
  percentageDelta: number;
  improved: boolean;
  sectionDeltas: Record<CIPSection, number>;
} {
  const scoreDelta = current.scaledScore - previous.scaledScore;
  const percentageDelta = current.percentageCorrect - previous.percentageCorrect;
  const improved = scoreDelta > 0;

  const sectionDeltas: Record<CIPSection, number> = {} as Record<CIPSection, number>;
  const sections: CIPSection[] = [
    'medical_history',
    'physical_exam',
    'laboratory',
    'imaging',
    'pathology',
    'treatment',
  ];

  for (const section of sections) {
    const currentPerf = current.sectionBreakdown[section]?.percentage || 0;
    const previousPerf = previous.sectionBreakdown[section]?.percentage || 0;
    sectionDeltas[section] = currentPerf - previousPerf;
  }

  return {
    scoreDelta,
    percentageDelta,
    improved,
    sectionDeltas,
  };
}

// ============================================
// Exports
// ============================================

export { PASS_THRESHOLD, DEFAULT_CELL_IRT };
