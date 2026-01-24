/**
 * IRT Parameter Estimator
 * Estimates missing discrimination (a) parameter from biserial correlation
 */

import { IRT_CONFIG } from '../config';

/**
 * Estimate discrimination parameter from point-biserial correlation
 *
 * The point-biserial correlation indicates how well an item discriminates
 * between high and low ability test-takers. We use an empirical transformation
 * to convert it to the IRT discrimination parameter (a).
 *
 * Research suggests: a ≈ |r_pb| × K, where K is a calibration constant
 * typically between 2.5-3.5 for well-constructed items.
 *
 * @param biserial - Point-biserial correlation (-1 to 1)
 * @returns Estimated discrimination and source
 */
export function estimateDiscrimination(biserial: number | null): {
  discrimination: number;
  source: 'biserial' | 'default';
} {
  const { K_FACTOR, MIN_DISCRIMINATION, MAX_DISCRIMINATION, DEFAULT_DISCRIMINATION } =
    IRT_CONFIG;

  // If biserial is missing, use Rasch model default
  if (biserial === null) {
    return {
      discrimination: DEFAULT_DISCRIMINATION,
      source: 'default',
    };
  }

  // Negative or very low biserial indicates problematic item
  // Fall back to Rasch model
  if (biserial < 0.05) {
    return {
      discrimination: DEFAULT_DISCRIMINATION,
      source: 'default',
    };
  }

  // Estimate discrimination from biserial
  // Using absolute value to handle any edge cases
  const estimated = Math.abs(biserial) * K_FACTOR;

  // Clamp to valid range
  const clamped = Math.max(
    MIN_DISCRIMINATION,
    Math.min(MAX_DISCRIMINATION, estimated)
  );

  return {
    discrimination: Math.round(clamped * 1000) / 1000, // 3 decimal places
    source: 'biserial',
  };
}

/**
 * Get difficulty level label from IRT difficulty parameter
 * Matches Darwin Education's DifficultyLevel type
 */
export function getDifficultyLevel(
  b: number
): 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil' {
  if (b < -1.5) return 'muito_facil';
  if (b < -0.5) return 'facil';
  if (b < 0.5) return 'medio';
  if (b < 1.5) return 'dificil';
  return 'muito_dificil';
}

/**
 * Validate IRT parameters are within expected ranges
 */
export function validateIRTParameters(params: {
  difficulty: number | null;
  discrimination: number;
  guessing: number;
  infit: number | null;
  outfit: number | null;
}): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check difficulty bounds
  if (params.difficulty !== null) {
    if (params.difficulty < -4 || params.difficulty > 4) {
      warnings.push(
        `Difficulty ${params.difficulty} outside expected range [-4, 4]`
      );
    }
  } else {
    warnings.push('Missing difficulty parameter');
  }

  // Check discrimination bounds
  if (
    params.discrimination < IRT_CONFIG.MIN_DISCRIMINATION ||
    params.discrimination > IRT_CONFIG.MAX_DISCRIMINATION
  ) {
    warnings.push(
      `Discrimination ${params.discrimination} outside expected range [${IRT_CONFIG.MIN_DISCRIMINATION}, ${IRT_CONFIG.MAX_DISCRIMINATION}]`
    );
  }

  // Check guessing bounds (should be 0.25 for 4-option MC)
  if (params.guessing < 0 || params.guessing > 0.5) {
    warnings.push(`Guessing ${params.guessing} outside expected range [0, 0.5]`);
  }

  // Check fit statistics (should be close to 1.0)
  if (params.infit !== null && (params.infit < 0.5 || params.infit > 1.5)) {
    warnings.push(`Infit ${params.infit} outside acceptable range [0.5, 1.5]`);
  }

  if (params.outfit !== null && (params.outfit < 0.5 || params.outfit > 1.5)) {
    warnings.push(`Outfit ${params.outfit} outside acceptable range [0.5, 1.5]`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Calculate item information at a given theta using 3PL model
 * Useful for validation against Darwin's calculator
 */
export function itemInformation(
  theta: number,
  difficulty: number,
  discrimination: number,
  guessing: number
): number {
  const exp_term = Math.exp(discrimination * (theta - difficulty));
  const p = guessing + (1 - guessing) * (exp_term / (1 + exp_term));
  const q = 1 - p;

  // Fisher information formula for 3PL
  const numerator =
    Math.pow(discrimination, 2) * Math.pow(1 - guessing, 2) * Math.pow(exp_term, 2);
  const denominator = Math.pow(1 + exp_term, 4) * p * q;

  if (denominator === 0) return 0;
  return numerator / denominator;
}
