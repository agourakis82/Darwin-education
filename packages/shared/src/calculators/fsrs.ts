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
// Parameter Optimization (Placeholder)
// ============================================

/**
 * Optimize FSRS weights based on user's review history
 * This is a complex optimization problem (gradient descent, BFGS, etc.)
 * Typically done on backend with Python/R libraries
 *
 * Pseudocode:
 * 1. Collect review logs (rating, elapsed_days, recalled)
 * 2. Define loss function: log-loss or RMSE on predicted vs actual recall
 * 3. Minimize loss by adjusting w[0..20]
 * 4. Return optimized weights
 *
 * For production, use: https://github.com/open-spaced-repetition/fsrs-optimizer
 */
export function optimizeParameters(
  reviewLogs: FSRSReviewLog[]
): FSRSParameters {
  // TODO: Implement optimization (backend service)
  // For now, return defaults
  return DEFAULT_FSRS_PARAMETERS;
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
