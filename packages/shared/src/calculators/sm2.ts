/**
 * SM-2 Spaced Repetition Algorithm
 * =================================
 *
 * Implementation of the SuperMemo 2 algorithm for flashcard scheduling.
 *
 * Original paper: Wozniak, P.A. (1990)
 * "Optimization of repetition spacing in the practice of learning"
 *
 * Key formula:
 * - EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 * - Interval(n) = Interval(n-1) * EF
 */

import type { SM2State, ReviewQuality } from '../types/education';

// Constants
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const MAX_EASE_FACTOR = 3.0;

// Initial intervals (in days)
const INITIAL_INTERVALS = {
  FIRST_REVIEW: 1,   // First successful review: 1 day
  SECOND_REVIEW: 6,  // Second successful review: 6 days
};

/**
 * Create initial SM2 state for a new card
 */
export function createInitialSM2State(cardId: string): SM2State {
  return {
    cardId,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
    lastReview: null,
  };
}

/**
 * Calculate new ease factor based on review quality
 * q: 0-5 quality rating
 */
export function calculateNewEaseFactor(
  currentEF: number,
  quality: ReviewQuality
): number {
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Constrain to valid range
  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEF));
}

/**
 * Calculate next interval based on SM-2 algorithm
 */
export function calculateNextInterval(
  repetitions: number,
  easeFactor: number,
  currentInterval: number
): number {
  if (repetitions === 0) {
    // First successful review
    return INITIAL_INTERVALS.FIRST_REVIEW;
  } else if (repetitions === 1) {
    // Second successful review
    return INITIAL_INTERVALS.SECOND_REVIEW;
  } else {
    // Subsequent reviews: interval * EF
    return Math.round(currentInterval * easeFactor);
  }
}

/**
 * Process a review and return updated SM2 state
 */
export function processReview(
  state: SM2State,
  quality: ReviewQuality
): SM2State {
  const now = new Date();

  // Quality < 3 means failed recall - reset
  if (quality < 3) {
    return {
      ...state,
      repetitions: 0,
      interval: INITIAL_INTERVALS.FIRST_REVIEW,
      // Keep ease factor but apply penalty
      easeFactor: Math.max(MIN_EASE_FACTOR, state.easeFactor - 0.2),
      nextReview: addDays(now, INITIAL_INTERVALS.FIRST_REVIEW),
      lastReview: now,
    };
  }

  // Successful recall (quality >= 3)
  const newEF = calculateNewEaseFactor(state.easeFactor, quality);
  const newRepetitions = state.repetitions + 1;
  const newInterval = calculateNextInterval(newRepetitions, newEF, state.interval);

  return {
    ...state,
    repetitions: newRepetitions,
    interval: newInterval,
    easeFactor: newEF,
    nextReview: addDays(now, newInterval),
    lastReview: now,
  };
}

/**
 * Check if a card is due for review
 */
export function isDue(state: SM2State): boolean {
  return new Date() >= state.nextReview;
}

/**
 * Get cards due for review, sorted by priority
 * Priority: overdue cards first, then by days overdue
 */
export function getDueCards(states: SM2State[]): SM2State[] {
  const now = new Date();

  return states
    .filter(isDue)
    .sort((a, b) => {
      // More overdue = higher priority
      const overdueA = now.getTime() - a.nextReview.getTime();
      const overdueB = now.getTime() - b.nextReview.getTime();
      return overdueB - overdueA;
    });
}

/**
 * Get review queue for a study session
 * Includes new cards and review cards
 */
export function getReviewQueue(
  states: SM2State[],
  newCardIds: string[],
  options: {
    maxNewCards?: number;
    maxReviews?: number;
  } = {}
): string[] {
  const { maxNewCards = 20, maxReviews = 100 } = options;

  const queue: string[] = [];

  // Add due cards first (review priority)
  const dueCards = getDueCards(states);
  for (const card of dueCards.slice(0, maxReviews)) {
    queue.push(card.cardId);
  }

  // Add new cards
  const newCards = newCardIds.slice(0, maxNewCards);
  queue.push(...newCards);

  return queue;
}

/**
 * Calculate learning statistics
 */
export function calculateStats(states: SM2State[]): {
  total: number;
  learning: number;
  reviewing: number;
  mature: number;
  dueToday: number;
  averageEaseFactor: number;
  averageInterval: number;
} {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  let learning = 0;
  let reviewing = 0;
  let mature = 0;
  let dueToday = 0;
  let totalEF = 0;
  let totalInterval = 0;

  for (const state of states) {
    totalEF += state.easeFactor;
    totalInterval += state.interval;

    if (state.repetitions === 0) {
      learning++;
    } else if (state.interval < 21) {
      reviewing++;
    } else {
      mature++;
    }

    if (state.nextReview <= todayEnd) {
      dueToday++;
    }
  }

  return {
    total: states.length,
    learning,
    reviewing,
    mature,
    dueToday,
    averageEaseFactor: states.length > 0 ? totalEF / states.length : DEFAULT_EASE_FACTOR,
    averageInterval: states.length > 0 ? totalInterval / states.length : 0,
  };
}

/**
 * Predict retention rate for a given interval
 * Using forgetting curve approximation
 */
export function predictRetention(
  daysSinceReview: number,
  easeFactor: number
): number {
  // Simplified forgetting curve: R = e^(-t/S)
  // where S (stability) is related to ease factor and repetitions
  const stability = easeFactor * 10; // Rough approximation
  return Math.exp(-daysSinceReview / stability);
}

/**
 * Get optimal review time for target retention
 */
export function getOptimalReviewTime(
  targetRetention: number,
  easeFactor: number
): number {
  const stability = easeFactor * 10;
  return -stability * Math.log(targetRetention);
}

// Utility function
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Quality rating descriptions for UI
 */
export const QUALITY_DESCRIPTIONS: Record<ReviewQuality, string> = {
  0: 'Esqueci completamente',
  1: 'Errei, mas lembrei ao ver a resposta',
  2: 'Errei, mas a resposta pareceu fácil',
  3: 'Acertei com dificuldade',
  4: 'Acertei com hesitação',
  5: 'Resposta perfeita',
};

/**
 * Suggested buttons for review UI (simplified 3-button approach)
 */
export const REVIEW_BUTTONS = [
  { quality: 1 as ReviewQuality, label: 'Não lembrei', color: 'red' },
  { quality: 3 as ReviewQuality, label: 'Difícil', color: 'yellow' },
  { quality: 5 as ReviewQuality, label: 'Fácil', color: 'green' },
] as const;
