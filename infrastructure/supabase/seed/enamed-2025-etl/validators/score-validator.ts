/**
 * Score Validator
 * Compares Darwin TRI calculations against official PROFICIENCIA scores
 */

import { VALIDATION_THRESHOLDS, IRT_CONFIG } from '../config';
import type {
  ProcessedParticipant,
  ProcessedItemParameters,
  ValidationResult,
  ValidationSummary,
} from '../types';

// We'll import the Darwin calculator dynamically
// This allows the ETL to work even if the shared package isn't linked
let estimateThetaEAP: (responses: boolean[], items: any[]) => number;
let thetaToScaledScore: (theta: number) => number;

/**
 * Load Darwin TRI calculator
 */
async function loadDarwinCalculator(): Promise<void> {
  try {
    const tri = await import('@darwin-education/shared');
    estimateThetaEAP = tri.estimateThetaEAP;
    thetaToScaledScore = tri.thetaToScaledScore;
  } catch {
    // Fallback to local implementation if shared package not available
    console.warn(
      'Could not load @darwin-education/shared, using local implementation'
    );

    // Local EAP implementation (simplified)
    estimateThetaEAP = localEstimateThetaEAP;
    thetaToScaledScore = (theta: number) =>
      Math.round(Math.max(0, Math.min(1000, 500 + theta * 100)));
  }
}

/**
 * Local EAP implementation (fallback)
 */
function localEstimateThetaEAP(
  responses: boolean[],
  items: { difficulty: number; discrimination: number; guessing: number }[]
): number {
  const THETA_MIN = -4;
  const THETA_MAX = 4;
  const numPoints = 81;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < numPoints; i++) {
    const theta = THETA_MIN + (i / (numPoints - 1)) * (THETA_MAX - THETA_MIN);

    // Prior (standard normal)
    const prior = Math.exp(-0.5 * theta * theta) / Math.sqrt(2 * Math.PI);

    // Likelihood
    let logLikelihood = 0;
    for (let j = 0; j < items.length; j++) {
      const { difficulty: b, discrimination: a, guessing: c } = items[j];
      const exponent = Math.exp(a * (theta - b));
      const p = c + (1 - c) * (exponent / (1 + exponent));

      if (responses[j]) {
        logLikelihood += Math.log(Math.max(p, 1e-10));
      } else {
        logLikelihood += Math.log(Math.max(1 - p, 1e-10));
      }
    }
    const likelihood = Math.exp(logLikelihood);

    const posterior = likelihood * prior;
    numerator += theta * posterior;
    denominator += posterior;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate Spearman rank correlation
 */
function spearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  // Convert to ranks
  const rankX = getRanks(x);
  const rankY = getRanks(y);

  return pearsonCorrelation(rankX, rankY);
}

function getRanks(arr: number[]): number[] {
  const sorted = arr.slice().sort((a, b) => a - b);
  return arr.map((v) => sorted.indexOf(v) + 1);
}

/**
 * Calculate Mean Absolute Error
 */
function calculateMAE(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length === 0) return 0;
  const sum = predicted.reduce(
    (total, p, i) => total + Math.abs(p - actual[i]),
    0
  );
  return sum / predicted.length;
}

/**
 * Calculate Root Mean Square Error
 */
function calculateRMSE(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length === 0) return 0;
  const sum = predicted.reduce(
    (total, p, i) => total + Math.pow(p - actual[i], 2),
    0
  );
  return Math.sqrt(sum / predicted.length);
}

/**
 * Validate a single participant's score
 */
function validateParticipant(
  participant: ProcessedParticipant,
  itemParams: ProcessedItemParameters[],
  index: number
): ValidationResult | null {
  if (
    !participant.isValid ||
    participant.officialTheta === null ||
    participant.responses.length === 0
  ) {
    return null;
  }

  // Build IRT parameters array matching responses
  const irtItems = itemParams
    .filter((p) => p.ITEM_MANTIDO === 1 && p.PARAMETRO_B !== null)
    .slice(0, participant.responses.length)
    .map((p) => ({
      difficulty: p.PARAMETRO_B!,
      discrimination: p.estimatedDiscrimination,
      guessing: p.guessing,
    }));

  if (irtItems.length !== participant.responses.length) {
    console.warn(
      `Participant ${index}: Response count (${participant.responses.length}) doesn't match IRT items (${irtItems.length})`
    );
    return null;
  }

  // Calculate Darwin theta
  const darwinTheta = estimateThetaEAP(participant.responses, irtItems);
  const darwinScaled = thetaToScaledScore(darwinTheta);

  return {
    participantIndex: index,
    officialTheta: participant.officialTheta,
    darwinTheta,
    thetaDifference: Math.abs(darwinTheta - participant.officialTheta),
    officialScaled: participant.officialScaledScore,
    darwinScaled,
    responseCount: participant.responses.length,
    correctCount: participant.responses.filter((r) => r).length,
  };
}

/**
 * Validate scores for all participants
 */
export async function validateScores(
  participants: ProcessedParticipant[],
  itemParams: ProcessedItemParameters[],
  sampleSize?: number
): Promise<ValidationSummary> {
  // Load Darwin calculator
  await loadDarwinCalculator();

  // Sample participants if needed
  const toValidate = sampleSize
    ? participants.slice(0, sampleSize)
    : participants;

  console.log(`Validating ${toValidate.length} participants...`);

  // Validate each participant
  const results: ValidationResult[] = [];
  for (let i = 0; i < toValidate.length; i++) {
    const result = validateParticipant(toValidate[i], itemParams, i);
    if (result) {
      results.push(result);
    }

    // Progress logging
    if (i > 0 && i % 1000 === 0) {
      console.log(`  Processed ${i}/${toValidate.length} participants`);
    }
  }

  console.log(`Validated ${results.length} participants with scores`);

  if (results.length === 0) {
    return {
      totalParticipants: toValidate.length,
      validParticipants: 0,
      pearsonR: 0,
      spearmanRho: 0,
      meanAbsoluteError: 0,
      rootMeanSquareError: 0,
      maxError: 0,
      percentWithin01: 0,
      percentWithin025: 0,
      percentWithin05: 0,
      worstCases: [],
      passed: false,
      recommendations: ['No valid participants found for validation'],
    };
  }

  // Extract arrays for correlation
  const officialThetas = results.map((r) => r.officialTheta);
  const darwinThetas = results.map((r) => r.darwinTheta);
  const differences = results.map((r) => r.thetaDifference);

  // Calculate metrics
  const pearsonR = pearsonCorrelation(officialThetas, darwinThetas);
  const spearmanRho = spearmanCorrelation(officialThetas, darwinThetas);
  const mae = calculateMAE(darwinThetas, officialThetas);
  const rmse = calculateRMSE(darwinThetas, officialThetas);
  const maxError = Math.max(...differences);

  // Calculate percentages within thresholds
  const within01 = differences.filter((d) => d <= 0.1).length / results.length;
  const within025 = differences.filter((d) => d <= 0.25).length / results.length;
  const within05 = differences.filter((d) => d <= 0.5).length / results.length;

  // Find worst cases
  const sortedByError = [...results].sort(
    (a, b) => b.thetaDifference - a.thetaDifference
  );
  const worstCases = sortedByError.slice(0, 10);

  // Determine if validation passed
  const passed =
    pearsonR >= VALIDATION_THRESHOLDS.MIN_CORRELATION &&
    mae <= VALIDATION_THRESHOLDS.MAX_MAE &&
    rmse <= VALIDATION_THRESHOLDS.MAX_RMSE;

  // Generate recommendations
  const recommendations: string[] = [];

  if (pearsonR < VALIDATION_THRESHOLDS.MIN_CORRELATION) {
    recommendations.push(
      `Correlation (${pearsonR.toFixed(3)}) below threshold (${VALIDATION_THRESHOLDS.MIN_CORRELATION}). ` +
        `Consider adjusting discrimination K_FACTOR (currently ${IRT_CONFIG.K_FACTOR}).`
    );
  }

  if (mae > VALIDATION_THRESHOLDS.MAX_MAE) {
    recommendations.push(
      `MAE (${mae.toFixed(3)}) above threshold (${VALIDATION_THRESHOLDS.MAX_MAE}). ` +
        `Check IRT parameter estimation.`
    );
  }

  if (within025 < VALIDATION_THRESHOLDS.PERCENT_WITHIN_025) {
    recommendations.push(
      `Only ${(within025 * 100).toFixed(1)}% of estimates within 0.25 theta. ` +
        `Expected ${(VALIDATION_THRESHOLDS.PERCENT_WITHIN_025 * 100).toFixed(0)}%.`
    );
  }

  if (passed && recommendations.length === 0) {
    recommendations.push('Validation passed! Darwin calculator matches official scores.');
  }

  return {
    totalParticipants: toValidate.length,
    validParticipants: results.length,
    pearsonR,
    spearmanRho,
    meanAbsoluteError: mae,
    rootMeanSquareError: rmse,
    maxError,
    percentWithin01: within01,
    percentWithin025: within025,
    percentWithin05: within05,
    worstCases,
    passed,
    recommendations,
  };
}

/**
 * Generate validation report as JSON
 */
export function generateValidationReport(summary: ValidationSummary): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: {
        totalParticipants: summary.totalParticipants,
        validParticipants: summary.validParticipants,
        passed: summary.passed,
      },
      correlation: {
        pearson: summary.pearsonR,
        spearman: summary.spearmanRho,
      },
      errors: {
        mae: summary.meanAbsoluteError,
        rmse: summary.rootMeanSquareError,
        max: summary.maxError,
      },
      distribution: {
        within01: summary.percentWithin01,
        within025: summary.percentWithin025,
        within05: summary.percentWithin05,
      },
      worstCases: summary.worstCases,
      recommendations: summary.recommendations,
    },
    null,
    2
  );
}
