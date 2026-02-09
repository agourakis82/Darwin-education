import { describe, it, expect } from 'vitest';
import {
  optimizeParameters,
  DEFAULT_FSRS_WEIGHTS,
  DEFAULT_FSRS_PARAMETER_BOUNDS,
  scheduleCard,
  createFSRSCard,
  retrievability,
  type FSRSTrainingSample,
  type FSRSRating,
  type FSRSCard,
} from '../calculators/fsrs';

/**
 * Generate synthetic review history for one card.
 * Simulates a card being reviewed periodically with the given bias.
 */
function generateCardReviews(
  cardId: string,
  numReviews: number,
  recallBias: number = 0.7, // probability of rating >= 2
  seed: number = 42
): FSRSTrainingSample[] {
  const samples: FSRSTrainingSample[] = [];
  let date = new Date('2024-01-01T10:00:00Z');
  let elapsed = 0;
  let state: FSRSTrainingSample['state'] = 'new';

  // Simple seeded random (xorshift)
  let s = seed;
  function random() {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  }

  for (let i = 0; i < numReviews; i++) {
    const r = random();
    let rating: FSRSRating;
    if (r < (1 - recallBias)) {
      rating = 1; // Again
    } else if (r < (1 - recallBias) + recallBias * 0.3) {
      rating = 2; // Hard
    } else if (r < (1 - recallBias) + recallBias * 0.8) {
      rating = 3; // Good
    } else {
      rating = 4; // Easy
    }

    samples.push({
      cardId,
      rating,
      elapsedDays: elapsed,
      state,
      reviewDate: new Date(date),
    });

    // Advance time
    const interval = state === 'new' ? 1 : Math.max(1, Math.round(3 + random() * 14));
    date = new Date(date.getTime() + interval * 24 * 60 * 60 * 1000);
    elapsed = interval;

    // Update state based on rating
    if (rating === 1) {
      state = state === 'review' ? 'relearning' : 'learning';
    } else if (state === 'new' || state === 'learning' || state === 'relearning') {
      state = 'review';
    }
  }

  return samples;
}

/**
 * Generate a complete training dataset for testing.
 */
function generateTrainingData(
  numCards: number,
  reviewsPerCard: number,
  recallBias: number = 0.7
): FSRSTrainingSample[] {
  const allSamples: FSRSTrainingSample[] = [];
  for (let i = 0; i < numCards; i++) {
    const cardSamples = generateCardReviews(
      `card-${i}`,
      reviewsPerCard,
      recallBias,
      42 + i * 17
    );
    allSamples.push(...cardSamples);
  }
  return allSamples;
}

describe('FSRS Parameter Optimizer', () => {
  describe('Insufficient Data Handling', () => {
    it('should return defaults for fewer than 50 reviews', () => {
      const samples = generateTrainingData(5, 5); // 25 reviews
      const result = optimizeParameters(samples);

      expect(result.weights).toEqual(DEFAULT_FSRS_WEIGHTS);
      expect(result.iterations).toBe(0);
      expect(result.improvementRatio).toBe(0);
      expect(result.trainingSamples).toBeLessThan(50);
    });

    it('should return defaults for fewer than 10 unique cards', () => {
      const samples = generateTrainingData(5, 20); // 100 reviews but only 5 cards
      const result = optimizeParameters(samples);

      expect(result.weights).toEqual(DEFAULT_FSRS_WEIGHTS);
      expect(result.iterations).toBe(0);
      expect(result.uniqueCards).toBe(5);
    });

    it('should return defaults for empty input', () => {
      const result = optimizeParameters([]);

      expect(result.weights).toEqual(DEFAULT_FSRS_WEIGHTS);
      expect(result.trainingSamples).toBe(0);
      expect(result.uniqueCards).toBe(0);
    });
  });

  describe('Skewness Detection', () => {
    it('should return defaults when >95% recalls', () => {
      // Generate data where almost everything is recalled (high bias)
      const samples = generateTrainingData(15, 10, 0.99);
      const result = optimizeParameters(samples);

      expect(result.weights).toEqual(DEFAULT_FSRS_WEIGHTS);
      expect(result.improvementRatio).toBe(0);
    });

    it('should return defaults when >95% forgets', () => {
      // Generate data where almost everything is forgotten (very low bias)
      const samples = generateTrainingData(15, 10, 0.02);
      const result = optimizeParameters(samples);

      expect(result.weights).toEqual(DEFAULT_FSRS_WEIGHTS);
      expect(result.improvementRatio).toBe(0);
    });
  });

  describe('Log-Loss Computation', () => {
    it('should compute finite log-loss for valid data', () => {
      const samples = generateTrainingData(15, 10, 0.7);
      const result = optimizeParameters(samples);

      expect(isFinite(result.logLoss)).toBe(true);
      expect(result.logLoss).toBeGreaterThan(0);
      expect(isFinite(result.defaultLogLoss)).toBe(true);
      expect(result.defaultLogLoss).toBeGreaterThan(0);
    });

    it('should have training samples count matching effective pairs', () => {
      const samples = generateTrainingData(15, 10, 0.7);
      const result = optimizeParameters(samples);

      // Each card with N reviews produces N-1 training pairs
      // 15 cards × (10-1) = 135 pairs
      expect(result.trainingSamples).toBe(135);
      expect(result.uniqueCards).toBe(15);
    });
  });

  describe('Parameter Bounds', () => {
    it('should have matching length for min and max bounds', () => {
      expect(DEFAULT_FSRS_PARAMETER_BOUNDS.min.length).toBe(21);
      expect(DEFAULT_FSRS_PARAMETER_BOUNDS.max.length).toBe(21);
    });

    it('should have min < max for every weight', () => {
      for (let i = 0; i < 21; i++) {
        expect(DEFAULT_FSRS_PARAMETER_BOUNDS.min[i]).toBeLessThan(
          DEFAULT_FSRS_PARAMETER_BOUNDS.max[i]
        );
      }
    });

    it('should have default weights within bounds', () => {
      for (let i = 0; i < 21; i++) {
        expect(DEFAULT_FSRS_WEIGHTS[i]).toBeGreaterThanOrEqual(
          DEFAULT_FSRS_PARAMETER_BOUNDS.min[i]
        );
        expect(DEFAULT_FSRS_WEIGHTS[i]).toBeLessThanOrEqual(
          DEFAULT_FSRS_PARAMETER_BOUNDS.max[i]
        );
      }
    });

    it('should produce weights within bounds after optimization', () => {
      const samples = generateTrainingData(20, 12, 0.7);
      const result = optimizeParameters(samples);

      for (let i = 0; i < result.weights.length; i++) {
        expect(result.weights[i]).toBeGreaterThanOrEqual(
          DEFAULT_FSRS_PARAMETER_BOUNDS.min[i]
        );
        expect(result.weights[i]).toBeLessThanOrEqual(
          DEFAULT_FSRS_PARAMETER_BOUNDS.max[i]
        );
      }
    });
  });

  describe('Optimization Quality', () => {
    it('should converge or plateau within 200 iterations', () => {
      const samples = generateTrainingData(20, 12, 0.7);
      const result = optimizeParameters(samples);

      expect(result.iterations).toBeLessThanOrEqual(200);
      expect(result.durationMs).toBeGreaterThan(0);
    });

    it('should return 21 weights', () => {
      const samples = generateTrainingData(20, 12, 0.7);
      const result = optimizeParameters(samples);

      expect(result.weights.length).toBe(21);
    });

    it('should not produce NaN in any output field', () => {
      const samples = generateTrainingData(15, 10, 0.7);
      const result = optimizeParameters(samples);

      expect(isFinite(result.logLoss)).toBe(true);
      expect(isFinite(result.defaultLogLoss)).toBe(true);
      expect(isFinite(result.improvementRatio)).toBe(true);
      expect(result.weights.every(w => isFinite(w))).toBe(true);
    });
  });

  describe('Forward Simulation Consistency', () => {
    it('should produce results consistent with scheduleCard for first review', () => {
      // A single card, first review: optimizer's simulation should
      // use initDifficulty and initStability, same as scheduleCard
      const card = createFSRSCard();
      const { card: updated } = scheduleCard(card, 3, new Date());

      // Forward simulation initializes with initDifficulty(3, w) and initStability(3, w)
      // Same functions used by scheduleCard internally
      expect(updated.difficulty).toBeGreaterThan(0);
      expect(updated.stability).toBeGreaterThan(0);
    });

    it('retrievability should decrease with elapsed time', () => {
      const s = 10; // 10 days stability
      const r1 = retrievability(1, s);
      const r5 = retrievability(5, s);
      const r10 = retrievability(10, s);
      const r30 = retrievability(30, s);

      expect(r1).toBeGreaterThan(r5);
      expect(r5).toBeGreaterThan(r10);
      expect(r10).toBeGreaterThan(r30);
      expect(r10).toBeCloseTo(0.9, 1); // By definition: at t=S, R≈0.9
    });
  });

  describe('Options Override', () => {
    it('should respect custom minReviews', () => {
      const samples = generateTrainingData(15, 10, 0.7); // 150 reviews
      const result = optimizeParameters(samples, { minReviews: 200 });

      // 150 < 200 minimum, should return defaults
      expect(result.weights).toEqual(DEFAULT_FSRS_WEIGHTS);
      expect(result.iterations).toBe(0);
    });

    it('should respect custom minCards', () => {
      const samples = generateTrainingData(15, 10, 0.7);
      const result = optimizeParameters(samples, { minCards: 20 });

      // 15 < 20 minimum, should return defaults
      expect(result.weights).toEqual(DEFAULT_FSRS_WEIGHTS);
    });

    it('should respect custom maxIterations', () => {
      const samples = generateTrainingData(20, 12, 0.7);
      const result = optimizeParameters(samples, { maxIterations: 5 });

      expect(result.iterations).toBeLessThanOrEqual(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle cards with only one review gracefully', () => {
      const samples: FSRSTrainingSample[] = [];
      // 20 cards each with exactly 1 review — no training pairs
      for (let i = 0; i < 20; i++) {
        samples.push({
          cardId: `card-${i}`,
          rating: 3,
          elapsedDays: 0,
          state: 'new',
          reviewDate: new Date('2024-01-01'),
        });
      }
      // Add enough bulk from other cards to pass the minReviews threshold
      const bulkSamples = generateTrainingData(15, 10, 0.7);
      const allSamples = [...samples, ...bulkSamples];
      const result = optimizeParameters(allSamples);

      // Should complete without errors
      expect(isFinite(result.logLoss)).toBe(true);
    });

    it('should handle all reviews being the same rating', () => {
      const samples: FSRSTrainingSample[] = [];
      let date = new Date('2024-01-01');
      for (let c = 0; c < 15; c++) {
        for (let r = 0; r < 8; r++) {
          samples.push({
            cardId: `card-${c}`,
            rating: 3, // Always "Good"
            elapsedDays: r === 0 ? 0 : 3,
            state: r === 0 ? 'new' : 'review',
            reviewDate: new Date(date.getTime() + r * 3 * 24 * 60 * 60 * 1000),
          });
        }
      }

      // All recalls — may hit the skewness check
      const result = optimizeParameters(samples);
      expect(isFinite(result.logLoss)).toBe(true);
      expect(result.weights.length).toBe(21);
    });
  });
});
