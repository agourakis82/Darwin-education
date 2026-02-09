/**
 * FSRS-6 (Free Spaced Repetition Scheduler)
 * ==========================================
 *
 * Implementation of FSRS-6 algorithm for spaced repetition.
 * Superior to SM-2 with 20-30% fewer reviews for same retention.
 *
 * Paper: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 * Benchmark: https://expertium.github.io/Benchmark.html (99.6% superiority over SM-2)
 *
 * Key Formula: R(t, S) = (1 + t/(9*S))^(-1)
 * Where:
 * - R = Retrievability (probability of recall)
 * - t = Time since last review (days)
 * - S = Stability (days until retrievability drops to 90%)
 */

// ============================================
// Types
// ============================================

export type FSRSRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export type FSRSCardState = 'new' | 'learning' | 'review' | 'relearning';

export interface FSRSCard {
  /** Item-specific difficulty (0-10) */
  difficulty: number;
  /** Stability in days (time until R drops to 90%) */
  stability: number;
  /** Number of reviews */
  reps: number;
  /** Number of lapses (forgot after being in review state) */
  lapses: number;
  /** Current card state */
  state: FSRSCardState;
  /** Last review timestamp */
  lastReview: Date;
  /** Next review date */
  due: Date;
}

export interface FSRSParameters {
  /** 21 optimizable weights (FSRS-6) */
  w: number[];
  /** Target retention (0-1, default 0.9) */
  requestRetention: number;
  /** Maximum interval in days (default 36500 = 100 years) */
  maximumInterval: number;
}

export interface FSRSReviewLog {
  rating: FSRSRating;
  state: FSRSCardState;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  review: Date;
}

// ============================================
// Optimizer Types
// ============================================

/** A single training sample for the optimizer: one review event */
export interface FSRSTrainingSample {
  cardId: string;
  rating: FSRSRating;
  elapsedDays: number;
  state: FSRSCardState;
  reviewDate: Date;
}

/** Parameter bounds for constrained optimization */
export interface FSRSParameterBounds {
  min: number[];
  max: number[];
}

/** Result of the optimizer */
export interface FSRSOptimizerResult {
  weights: number[];
  logLoss: number;
  defaultLogLoss: number;
  improvementRatio: number;
  iterations: number;
  converged: boolean;
  trainingSamples: number;
  uniqueCards: number;
  durationMs: number;
}

// ============================================
// Default Parameters
// ============================================

/**
 * Default FSRS-6 weights (optimized on 20,000+ Anki users)
 * Source: https://github.com/open-spaced-repetition/fsrs4anki
 */
export const DEFAULT_FSRS_WEIGHTS: number[] = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234,
  1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407,
  2.9466, 0.5034, 0.6567, 0.0, 1.0
];

export const DEFAULT_FSRS_PARAMETERS: FSRSParameters = {
  w: DEFAULT_FSRS_WEIGHTS,
  requestRetention: 0.9,
  maximumInterval: 36500,
};

/** Per-weight bounds for constrained optimization */
export const DEFAULT_FSRS_PARAMETER_BOUNDS: FSRSParameterBounds = {
  min: [
    0.01, 0.01, 0.01, 0.01, // w[0..3] initial stability per rating
    1.0,                      // w[4] initial difficulty
    0.0, 0.0, 0.0,           // w[5..7] difficulty params
    -1.0, 0.0, 0.0,          // w[8..10] recall stability
    0.01, 0.0, 0.0, 0.0,     // w[11..14] forget stability
    0.0, 0.0,                 // w[15..16] hard penalty / easy bonus
    0.0, 0.0,                 // w[17..18] FSRS-6 extensions
    0.0,                      // w[19] reserved
    0.5,                      // w[20] reserved
  ],
  max: [
    100.0, 100.0, 100.0, 100.0, // w[0..3]
    10.0,                         // w[4]
    5.0, 5.0, 1.0,               // w[5..7]
    5.0, 3.0, 5.0,               // w[8..10]
    10.0, 3.0, 2.0, 5.0,         // w[11..14]
    3.0, 5.0,                     // w[15..16]
    5.0, 5.0,                     // w[17..18]
    1.0,                          // w[19]
    2.0,                          // w[20]
  ],
};

// ============================================
// Core Algorithm
// ============================================

/**
 * Calculate retrievability (probability of recall) at time t
 * R(t) = (1 + t/(9*S))^(-1)
 */
export function retrievability(elapsed_days: number, stability: number): number {
  return Math.pow(1 + elapsed_days / (9 * stability), -1);
}

/**
 * Calculate initial difficulty for a new card
 */
export function initDifficulty(rating: FSRSRating, w: number[]): number {
  const difficulty = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return constrain(difficulty, 1, 10);
}

/**
 * Calculate initial stability for a new card
 */
export function initStability(rating: FSRSRating, w: number[]): number {
  return Math.max(w[rating - 1], 0.1);
}

/**
 * Calculate next difficulty after review
 */
export function nextDifficulty(d: number, rating: FSRSRating, w: number[]): number {
  const delta_d = w[6] * (rating - 3);
  const next_d = d + delta_d;
  return constrain(meanReversion(w[4], next_d, w), 1, 10);
}

/**
 * Mean reversion to prevent difficulty from drifting too far
 */
export function meanReversion(init: number, current: number, w: number[]): number {
  return w[7] * init + (1 - w[7]) * current;
}

/**
 * Calculate next stability after successful recall
 */
export function nextRecallStability(
  d: number,
  s: number,
  r: number,
  rating: FSRSRating,
  w: number[]
): number {
  const hard_penalty = rating === 2 ? w[15] : 1;
  const easy_bonus = rating === 4 ? w[16] : 1;

  const stability_increment =
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hard_penalty *
    easy_bonus;

  return s * (stability_increment + 1);
}

/**
 * Calculate next stability after forgetting (rating = 1, Again)
 */
export function nextForgetStability(
  d: number,
  s: number,
  r: number,
  w: number[]
): number {
  return (
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r))
  );
}

const FSRS_DECAY = -0.5;
const FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1;

/**
 * Calculate interval based on stability and desired retention
 */
export function nextInterval(s: number, requestRetention: number): number {
  const interval = (s / FSRS_FACTOR) * (Math.pow(requestRetention, 1 / FSRS_DECAY) - 1);
  return Math.max(1, Math.round(interval));
}

/**
 * Constrain value to [min, max] range
 */
function constrain(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================
// Card Scheduling
// ============================================

/**
 * Create a new FSRS card
 */
export function createFSRSCard(): FSRSCard {
  const now = new Date();
  return {
    difficulty: 0,
    stability: 0,
    reps: 0,
    lapses: 0,
    state: 'new',
    lastReview: now,
    due: now,
  };
}

/**
 * Schedule a card review and return updated state
 */
export function scheduleCard(
  card: FSRSCard,
  rating: FSRSRating,
  now: Date = new Date(),
  params: FSRSParameters = DEFAULT_FSRS_PARAMETERS
): { card: FSRSCard; log: FSRSReviewLog } {
  const { w, requestRetention, maximumInterval } = params;

  const elapsed_days = card.state === 'new' ? 0 : daysBetween(card.lastReview, now);
  const current_retrievability = card.state === 'new' ? 1 : retrievability(elapsed_days, card.stability);

  let next_card: FSRSCard;
  let scheduled_days: number;

  // NEW CARD
  if (card.state === 'new') {
    const init_d = initDifficulty(rating, w);
    const init_s = initStability(rating, w);
    const interval = nextInterval(init_s, requestRetention);

    next_card = {
      difficulty: init_d,
      stability: init_s,
      reps: 1,
      lapses: 0,
      state: rating === 1 ? 'learning' : 'review',
      lastReview: now,
      due: addDays(now, interval),
    };
    scheduled_days = interval;
  }
  // LEARNING / RELEARNING
  else if (card.state === 'learning' || card.state === 'relearning') {
    if (rating === 1) {
      // Still learning
      const interval = 1;
      next_card = {
        ...card,
        reps: card.reps + 1,
        lastReview: now,
        due: addDays(now, interval),
      };
      scheduled_days = interval;
    } else {
      // Graduated to review
      const new_d = nextDifficulty(card.difficulty, rating, w);
      const new_s = nextRecallStability(card.difficulty, card.stability, current_retrievability, rating, w);
      const interval = Math.min(nextInterval(new_s, requestRetention), maximumInterval);

      next_card = {
        difficulty: new_d,
        stability: new_s,
        reps: card.reps + 1,
        lapses: card.state === 'relearning' ? card.lapses + 1 : card.lapses,
        state: 'review',
        lastReview: now,
        due: addDays(now, interval),
      };
      scheduled_days = interval;
    }
  }
  // REVIEW STATE
  else {
    if (rating === 1) {
      // Lapsed - back to relearning
      const new_d = nextDifficulty(card.difficulty, rating, w);
      const new_s = nextForgetStability(card.difficulty, card.stability, current_retrievability, w);
      const interval = 1;

      next_card = {
        difficulty: new_d,
        stability: new_s,
        reps: card.reps + 1,
        lapses: card.lapses + 1,
        state: 'relearning',
        lastReview: now,
        due: addDays(now, interval),
      };
      scheduled_days = interval;
    } else {
      // Successful recall
      const new_d = nextDifficulty(card.difficulty, rating, w);
      const new_s = nextRecallStability(card.difficulty, card.stability, current_retrievability, rating, w);
      const interval = Math.min(nextInterval(new_s, requestRetention), maximumInterval);

      next_card = {
        difficulty: new_d,
        stability: new_s,
        reps: card.reps + 1,
        lapses: card.lapses,
        state: 'review',
        lastReview: now,
        due: addDays(now, interval),
      };
      scheduled_days = interval;
    }
  }

  const log: FSRSReviewLog = {
    rating,
    state: card.state,
    due: card.due,
    stability: next_card.stability,
    difficulty: next_card.difficulty,
    elapsed_days,
    scheduled_days,
    review: now,
  };

  return { card: next_card, log };
}

/**
 * Get cards due for review
 */
export function getDueCards(cards: FSRSCard[], now: Date = new Date()): FSRSCard[] {
  return cards.filter(card => card.due <= now)
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

/**
 * Get next review intervals for all rating options
 * Useful for showing "Again: 1d, Hard: 3d, Good: 7d, Easy: 14d" in UI
 */
export function getReviewIntervals(
  card: FSRSCard,
  now: Date = new Date(),
  params: FSRSParameters = DEFAULT_FSRS_PARAMETERS
): Record<FSRSRating, number> {
  const ratings: FSRSRating[] = [1, 2, 3, 4];
  const intervals: Record<FSRSRating, number> = {} as any;

  for (const rating of ratings) {
    const { card: next_card } = scheduleCard(card, rating, now, params);
    intervals[rating] = daysBetween(now, next_card.due);
  }

  return intervals;
}

// ============================================
// Statistics
// ============================================

export interface FSRSStats {
  total: number;
  new: number;
  learning: number;
  review: number;
  relearning: number;
  dueToday: number;
  averageDifficulty: number;
  averageStability: number;
  averageRetrievability: number;
}

export function calculateFSRSStats(cards: FSRSCard[], now: Date = new Date()): FSRSStats {
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let relearningCount = 0;
  let dueCount = 0;
  let totalDifficulty = 0;
  let totalStability = 0;
  let totalRetrievability = 0;

  for (const card of cards) {
    if (card.state === 'new') newCount++;
    else if (card.state === 'learning') learningCount++;
    else if (card.state === 'review') reviewCount++;
    else if (card.state === 'relearning') relearningCount++;

    if (card.due <= now) dueCount++;

    totalDifficulty += card.difficulty;
    totalStability += card.stability;

    if (card.state !== 'new') {
      const elapsed = daysBetween(card.lastReview, now);
      totalRetrievability += retrievability(elapsed, card.stability);
    }
  }

  const total = cards.length;
  const reviewableCards = total - newCount;

  return {
    total,
    new: newCount,
    learning: learningCount,
    review: reviewCount,
    relearning: relearningCount,
    dueToday: dueCount,
    averageDifficulty: total > 0 ? totalDifficulty / total : 0,
    averageStability: total > 0 ? totalStability / total : 0,
    averageRetrievability: reviewableCards > 0 ? totalRetrievability / reviewableCards : 0,
  };
}

// ============================================
// Migration from SM-2
// ============================================

import type { SM2State } from '../types/education';

/**
 * Migrate SM-2 state to FSRS
 * Maps ease factor → difficulty (inverted)
 * Maps interval → stability
 */
export function migrateSM2toFSRS(
  sm2: SM2State,
  w: number[] = DEFAULT_FSRS_WEIGHTS
): FSRSCard {
  // Difficulty estimate from ease factor (inverted)
  // SM-2 EF: 1.3-3.0, average 2.5
  // FSRS D: 1-10, average ~5
  const difficulty = constrain(11 - (sm2.easeFactor * 4), 1, 10);

  // Stability from current interval
  const stability = Math.max(sm2.interval, 0.1);

  // State mapping
  let state: FSRSCardState;
  if (sm2.repetitions === 0) {
    state = 'new';
  } else if (sm2.interval < 21) {
    state = 'learning';
  } else {
    state = 'review';
  }

  return {
    difficulty,
    stability,
    reps: sm2.repetitions,
    lapses: 0, // Unknown from SM-2
    state,
    lastReview: sm2.lastReview || new Date(),
    due: sm2.nextReview,
  };
}

// ============================================
// Utilities
// ============================================

function daysBetween(date1: Date, date2: Date): number {
  const ms = date2.getTime() - date1.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================
// Parameter Optimization
// ============================================

/**
 * Group training samples by card, sorted chronologically per card.
 */
function groupReviewsByCard(
  logs: FSRSTrainingSample[]
): Map<string, FSRSTrainingSample[]> {
  const groups = new Map<string, FSRSTrainingSample[]>();
  for (const log of logs) {
    let arr = groups.get(log.cardId);
    if (!arr) {
      arr = [];
      groups.set(log.cardId, arr);
    }
    arr.push(log);
  }
  // Sort each card's reviews chronologically
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.reviewDate.getTime() - b.reviewDate.getTime());
  }
  return groups;
}

/**
 * Forward-simulate one card's review history with given weights.
 * Returns (predicted_R, recalled) pairs for all reviews after the first.
 */
function simulateCardHistory(
  reviews: FSRSTrainingSample[],
  w: number[]
): Array<{ predictedR: number; recalled: boolean }> {
  const results: Array<{ predictedR: number; recalled: boolean }> = [];
  if (reviews.length < 2) return results;

  // First review initializes the card
  const first = reviews[0];
  let d = initDifficulty(first.rating, w);
  let s = initStability(first.rating, w);

  for (let i = 1; i < reviews.length; i++) {
    const review = reviews[i];
    const elapsed = review.elapsedDays;
    const recalled = review.rating >= 2;

    // Predicted retrievability at this review point
    const R = elapsed > 0 ? retrievability(elapsed, s) : 1.0;
    results.push({ predictedR: R, recalled });

    // Update card state
    d = nextDifficulty(d, review.rating, w);
    if (recalled) {
      s = nextRecallStability(d, s, R, review.rating, w);
    } else {
      s = nextForgetStability(d, s, R, w);
    }

    // Safety: prevent degenerate values
    s = Math.max(s, 0.01);
    d = Math.max(1, Math.min(10, d));
  }

  return results;
}

/**
 * Compute binary cross-entropy (log-loss) over all cards.
 */
function computeLogLoss(
  allReviews: Map<string, FSRSTrainingSample[]>,
  w: number[]
): number {
  let totalLoss = 0;
  let count = 0;
  const eps = 1e-7;

  for (const reviews of allReviews.values()) {
    const pairs = simulateCardHistory(reviews, w);
    for (const { predictedR, recalled } of pairs) {
      const R = Math.max(eps, Math.min(1 - eps, predictedR));
      const y = recalled ? 1 : 0;
      totalLoss += -(y * Math.log(R) + (1 - y) * Math.log(1 - R));
      count++;
    }
  }

  return count > 0 ? totalLoss / count : 0;
}

/**
 * Compute numerical gradient via central finite differences.
 */
function computeGradient(
  allReviews: Map<string, FSRSTrainingSample[]>,
  w: number[],
  h: number = 1e-5
): number[] {
  const grad = new Array(w.length).fill(0);

  for (let k = 0; k < w.length; k++) {
    const wPlus = [...w];
    const wMinus = [...w];
    wPlus[k] += h;
    wMinus[k] -= h;

    const lossPlus = computeLogLoss(allReviews, wPlus);
    const lossMinus = computeLogLoss(allReviews, wMinus);
    grad[k] = (lossPlus - lossMinus) / (2 * h);
  }

  return grad;
}

/**
 * Clamp weights to parameter bounds.
 */
function clampWeights(w: number[], bounds: FSRSParameterBounds): number[] {
  return w.map((val, i) =>
    Math.max(bounds.min[i], Math.min(bounds.max[i], val))
  );
}

/**
 * Adam optimizer for FSRS weight optimization.
 */
function adamOptimize(
  allReviews: Map<string, FSRSTrainingSample[]>,
  initialW: number[],
  bounds: FSRSParameterBounds,
  maxIter: number,
  lr: number
): { weights: number[]; loss: number; iterations: number; converged: boolean } {
  const beta1 = 0.9;
  const beta2 = 0.999;
  const epsilon = 1e-8;
  const convergenceThreshold = 1e-5;
  const lossImprovementThreshold = 1e-6;

  let w = [...initialW];
  const m = new Array(w.length).fill(0);
  const v = new Array(w.length).fill(0);

  let bestW = [...w];
  let bestLoss = computeLogLoss(allReviews, w);
  let prevLoss = bestLoss;
  let currentLr = lr;
  let nanRetries = 0;
  const maxNanRetries = 5;

  // Track loss improvement over last 10 iterations
  const lossHistory: number[] = [bestLoss];

  for (let t = 1; t <= maxIter; t++) {
    const g = computeGradient(allReviews, w);

    // Check for NaN/Inf in gradient
    if (g.some(val => !isFinite(val))) {
      nanRetries++;
      if (nanRetries >= maxNanRetries) {
        return { weights: bestW, loss: bestLoss, iterations: t, converged: false };
      }
      w = [...bestW];
      currentLr *= 0.5;
      continue;
    }

    // Gradient norm for convergence check
    const gradNorm = Math.sqrt(g.reduce((sum, gi) => sum + gi * gi, 0));
    if (gradNorm < convergenceThreshold) {
      return { weights: clampWeights(w, bounds), loss: bestLoss, iterations: t, converged: true };
    }

    // Adam update
    for (let k = 0; k < w.length; k++) {
      m[k] = beta1 * m[k] + (1 - beta1) * g[k];
      v[k] = beta2 * v[k] + (1 - beta2) * g[k] * g[k];
      const mHat = m[k] / (1 - Math.pow(beta1, t));
      const vHat = v[k] / (1 - Math.pow(beta2, t));
      w[k] -= currentLr * mHat / (Math.sqrt(vHat) + epsilon);
    }

    // Project back onto feasible set
    w = clampWeights(w, bounds);

    // Compute loss
    const loss = computeLogLoss(allReviews, w);

    if (!isFinite(loss)) {
      nanRetries++;
      if (nanRetries >= maxNanRetries) {
        return { weights: bestW, loss: bestLoss, iterations: t, converged: false };
      }
      w = [...bestW];
      currentLr *= 0.5;
      continue;
    }

    if (loss < bestLoss) {
      bestLoss = loss;
      bestW = [...w];
    }

    // Check loss improvement plateau
    lossHistory.push(loss);
    if (lossHistory.length > 10) {
      const oldLoss = lossHistory[lossHistory.length - 11];
      if (Math.abs(oldLoss - loss) < lossImprovementThreshold) {
        return { weights: clampWeights(bestW, bounds), loss: bestLoss, iterations: t, converged: true };
      }
    }

    prevLoss = loss;
  }

  return { weights: clampWeights(bestW, bounds), loss: bestLoss, iterations: maxIter, converged: false };
}

/**
 * Optimize FSRS weights based on user's review history.
 *
 * Uses Adam optimizer with numerical gradients to minimize binary cross-entropy
 * between predicted retrievability and actual recall outcomes.
 *
 * Minimum requirements:
 * - At least 50 total reviews across at least 10 unique cards
 * - Data must not be >95% skewed toward one outcome
 *
 * @param samples - Training data: chronological review events per card
 * @param options - Optional configuration overrides
 * @returns Optimizer result with weights, loss, and diagnostics
 */
export function optimizeParameters(
  samples: FSRSTrainingSample[],
  options?: {
    initialWeights?: number[];
    maxIterations?: number;
    learningRate?: number;
    minReviews?: number;
    minCards?: number;
  }
): FSRSOptimizerResult {
  const startTime = Date.now();
  const minReviews = options?.minReviews ?? 50;
  const minCards = options?.minCards ?? 10;
  const maxIter = options?.maxIterations ?? 200;
  const lr = options?.learningRate ?? 0.01;
  const initialW = options?.initialWeights ?? [...DEFAULT_FSRS_WEIGHTS];
  const bounds = DEFAULT_FSRS_PARAMETER_BOUNDS;

  // Group reviews by card
  const allReviews = groupReviewsByCard(samples);
  const uniqueCards = allReviews.size;

  // Count effective training pairs (reviews after first per card)
  let trainingSamples = 0;
  for (const reviews of allReviews.values()) {
    trainingSamples += Math.max(0, reviews.length - 1);
  }

  // Insufficient data check
  if (samples.length < minReviews || uniqueCards < minCards) {
    const defaultLoss = computeLogLoss(allReviews, DEFAULT_FSRS_WEIGHTS);
    return {
      weights: [...DEFAULT_FSRS_WEIGHTS],
      logLoss: defaultLoss,
      defaultLogLoss: defaultLoss,
      improvementRatio: 0,
      iterations: 0,
      converged: false,
      trainingSamples,
      uniqueCards,
      durationMs: Date.now() - startTime,
    };
  }

  // Skewness check: if >95% same outcome, data is too skewed
  let recallCount = 0;
  let forgetCount = 0;
  for (const reviews of allReviews.values()) {
    for (let i = 1; i < reviews.length; i++) {
      if (reviews[i].rating >= 2) recallCount++;
      else forgetCount++;
    }
  }
  const total = recallCount + forgetCount;
  if (total > 0 && (recallCount / total > 0.95 || forgetCount / total > 0.95)) {
    const defaultLoss = computeLogLoss(allReviews, DEFAULT_FSRS_WEIGHTS);
    return {
      weights: [...DEFAULT_FSRS_WEIGHTS],
      logLoss: defaultLoss,
      defaultLogLoss: defaultLoss,
      improvementRatio: 0,
      iterations: 0,
      converged: false,
      trainingSamples,
      uniqueCards,
      durationMs: Date.now() - startTime,
    };
  }

  // Compute baseline loss with default weights
  const defaultLogLoss = computeLogLoss(allReviews, DEFAULT_FSRS_WEIGHTS);

  // Run Adam optimizer
  const result = adamOptimize(allReviews, initialW, bounds, maxIter, lr);

  // If optimized is not better than defaults, return defaults
  const improvementRatio = defaultLogLoss > 0
    ? 1 - result.loss / defaultLogLoss
    : 0;

  const finalWeights = result.loss < defaultLogLoss - 0.001
    ? result.weights
    : [...DEFAULT_FSRS_WEIGHTS];
  const finalLoss = result.loss < defaultLogLoss - 0.001
    ? result.loss
    : defaultLogLoss;

  return {
    weights: finalWeights,
    logLoss: finalLoss,
    defaultLogLoss,
    improvementRatio: Math.max(0, improvementRatio),
    iterations: result.iterations,
    converged: result.converged,
    trainingSamples,
    uniqueCards,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Rating button labels for UI
 */
export const FSRS_RATING_LABELS: Record<FSRSRating, string> = {
  1: 'Novamente',
  2: 'Difícil',
  3: 'Bom',
  4: 'Fácil',
};

export const FSRS_RATING_COLORS: Record<FSRSRating, string> = {
  1: 'red',
  2: 'yellow',
  3: 'green',
  4: 'blue',
};
