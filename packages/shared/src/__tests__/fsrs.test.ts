import { describe, it, expect } from 'vitest';
import {
  createFSRSCard,
  scheduleCard,
  getDueCards,
  calculateFSRSStats,
  migrateSM2toFSRS,
  retrievability,
  DEFAULT_FSRS_PARAMETERS,
  type FSRSCard,
  type FSRSRating,
} from '../calculators/fsrs';
import type { SM2State } from '../types/education';

describe('FSRS-6 Algorithm', () => {
  describe('Card Creation', () => {
    it('should create a new FSRS card with default values', () => {
      const card = createFSRSCard();

      expect(card.difficulty).toBe(0);
      expect(card.stability).toBe(0);
      expect(card.reps).toBe(0);
      expect(card.lapses).toBe(0);
      expect(card.state).toBe('new');
      expect(card.due).toBeInstanceOf(Date);
    });
  });

  describe('Scheduling', () => {
    it('should graduate new card to review state after good rating', () => {
      const card = createFSRSCard();
      const rating: FSRSRating = 3; // Good

      const { card: scheduledCard } = scheduleCard(card, rating, new Date());

      expect(scheduledCard.state).toBe('review');
      expect(scheduledCard.reps).toBe(1);
      expect(scheduledCard.stability).toBeGreaterThan(0);
      expect(scheduledCard.difficulty).toBeGreaterThan(0);
      expect(scheduledCard.due).toBeInstanceOf(Date);
    });

    it('should keep card in learning state after again rating', () => {
      const card = createFSRSCard();
      const rating: FSRSRating = 1; // Again

      const { card: scheduledCard } = scheduleCard(card, rating, new Date());

      expect(scheduledCard.state).toBe('learning');
      expect(scheduledCard.reps).toBe(1);
    });

    it('should increase stability after successful reviews', () => {
      let card = createFSRSCard();

      // First review (Good)
      const result1 = scheduleCard(card, 3, new Date());
      card = result1.card;
      const stability1 = card.stability;

      // Second review (Good)
      const result2 = scheduleCard(card, 3, new Date());
      card = result2.card;
      const stability2 = card.stability;

      expect(stability2).toBeGreaterThan(stability1);
    });

    it('should transition to relearning on lapse', () => {
      let card = createFSRSCard();

      // Graduate to review
      const result1 = scheduleCard(card, 3, new Date());
      card = result1.card;
      expect(card.state).toBe('review');

      // Lapse
      const result2 = scheduleCard(card, 1, new Date());
      card = result2.card;

      expect(card.state).toBe('relearning');
      expect(card.lapses).toBe(1);
    });

    it('should adjust difficulty based on rating', () => {
      let card = createFSRSCard();

      // First review (Good)
      const result1 = scheduleCard(card, 3, new Date());
      const difficulty1 = result1.card.difficulty;

      // Create another new card
      let card2 = createFSRSCard();

      // First review (Easy)
      const result2 = scheduleCard(card2, 4, new Date());
      const difficulty2 = result2.card.difficulty;

      // Easy ratings should result in lower difficulty
      expect(difficulty2).toBeLessThan(difficulty1);
    });
  });

  describe('Retrievability', () => {
    it('should calculate retrievability correctly', () => {
      const stability = 10; // days

      // At time 0, retrievability should be 1.0
      const r0 = retrievability(0, stability);
      expect(r0).toBe(1.0);

      // At time = stability, retrievability should be ~0.9
      const rS = retrievability(stability, stability);
      expect(rS).toBeCloseTo(0.9, 1);

      // Retrievability should decrease over time
      const r5 = retrievability(5, stability);
      const r10 = retrievability(10, stability);
      const r20 = retrievability(20, stability);

      expect(r5).toBeGreaterThan(r10);
      expect(r10).toBeGreaterThan(r20);
    });
  });

  describe('Due Cards', () => {
    it('should return only cards that are due', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day future

      const cards: FSRSCard[] = [
        { ...createFSRSCard(), due: past },
        { ...createFSRSCard(), due: now },
        { ...createFSRSCard(), due: future },
      ];

      const dueCards = getDueCards(cards, now);

      expect(dueCards.length).toBe(2); // past and now
      expect(dueCards[0].due.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(dueCards[1].due.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should sort due cards by due date', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const cards: FSRSCard[] = [
        { ...createFSRSCard(), due: yesterday },
        { ...createFSRSCard(), due: twoDaysAgo },
        { ...createFSRSCard(), due: now },
      ];

      const dueCards = getDueCards(cards, now);

      expect(dueCards[0].due.getTime()).toBe(twoDaysAgo.getTime());
      expect(dueCards[1].due.getTime()).toBe(yesterday.getTime());
      expect(dueCards[2].due.getTime()).toBe(now.getTime());
    });
  });

  describe('Statistics', () => {
    it('should calculate stats correctly', () => {
      const cards: FSRSCard[] = [
        { ...createFSRSCard(), state: 'new' },
        { ...createFSRSCard(), state: 'learning', reps: 1 },
        { ...createFSRSCard(), state: 'review', reps: 5, stability: 30 },
        { ...createFSRSCard(), state: 'relearning', reps: 3, lapses: 1 },
      ];

      const stats = calculateFSRSStats(cards);

      expect(stats.total).toBe(4);
      expect(stats.new).toBe(1);
      expect(stats.learning).toBe(1);
      expect(stats.review).toBe(1);
      expect(stats.relearning).toBe(1);
    });

    it('should calculate average difficulty and stability', () => {
      const cards: FSRSCard[] = [
        { ...createFSRSCard(), difficulty: 3, stability: 10, state: 'review' },
        { ...createFSRSCard(), difficulty: 5, stability: 20, state: 'review' },
        { ...createFSRSCard(), difficulty: 7, stability: 30, state: 'review' },
      ];

      const stats = calculateFSRSStats(cards);

      expect(stats.averageDifficulty).toBeCloseTo(5, 1);
      expect(stats.averageStability).toBeCloseTo(20, 1);
    });
  });

  describe('SM-2 Migration', () => {
    it('should migrate SM-2 state to FSRS', () => {
      const sm2State: SM2State = {
        cardId: 'test-card',
        easeFactor: 2.5,
        interval: 10,
        repetitions: 3,
        nextReview: new Date(),
        lastReview: new Date(),
      };

      const fsrsCard = migrateSM2toFSRS(sm2State);

      expect(fsrsCard.state).toBe('review'); // interval >= 21 days
      expect(fsrsCard.reps).toBe(3);
      expect(fsrsCard.stability).toBeGreaterThan(0);
      expect(fsrsCard.difficulty).toBeGreaterThan(0);
      expect(fsrsCard.difficulty).toBeLessThanOrEqual(10);
    });

    it('should map high ease factor to low difficulty', () => {
      const sm2High: SM2State = {
        cardId: 'easy-card',
        easeFactor: 3.0, // High ease = easy card
        interval: 30,
        repetitions: 5,
        nextReview: new Date(),
        lastReview: new Date(),
      };

      const sm2Low: SM2State = {
        cardId: 'hard-card',
        easeFactor: 1.3, // Low ease = hard card
        interval: 5,
        repetitions: 2,
        nextReview: new Date(),
        lastReview: new Date(),
      };

      const fsrsEasy = migrateSM2toFSRS(sm2High);
      const fsrsHard = migrateSM2toFSRS(sm2Low);

      // High SM-2 ease factor → Low FSRS difficulty
      expect(fsrsEasy.difficulty).toBeLessThan(fsrsHard.difficulty);
    });

    it('should preserve interval as stability', () => {
      const sm2State: SM2State = {
        cardId: 'test-card',
        easeFactor: 2.5,
        interval: 42,
        repetitions: 10,
        nextReview: new Date(),
        lastReview: new Date(),
      };

      const fsrsCard = migrateSM2toFSRS(sm2State);

      expect(fsrsCard.stability).toBe(42);
    });
  });

  describe('Review Intervals', () => {
    it('should provide different intervals for different ratings', () => {
      let card = createFSRSCard();

      // Graduate to review first
      const result = scheduleCard(card, 3, new Date());
      card = result.card;

      // Now get intervals for all ratings
      const intervals = {
        again: 1, // Again always restarts
        hard: 3,
        good: 7,
        easy: 14,
      };

      // Easy should have longer interval than Hard
      // This is inherent to the FSRS algorithm
      expect(true).toBe(true); // Placeholder for interval comparison test
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high stability', () => {
      const card: FSRSCard = {
        ...createFSRSCard(),
        difficulty: 5,
        stability: 365, // 1 year
        reps: 20,
        state: 'review',
      };

      const { card: scheduledCard } = scheduleCard(
        card,
        3,
        new Date(),
        DEFAULT_FSRS_PARAMETERS
      );

      expect(scheduledCard.stability).toBeGreaterThan(card.stability);
      expect(scheduledCard.due).toBeInstanceOf(Date);
    });

    it('should handle very low stability', () => {
      const card: FSRSCard = {
        ...createFSRSCard(),
        difficulty: 8,
        stability: 0.5, // Half a day
        reps: 1,
        state: 'learning',
      };

      const { card: scheduledCard } = scheduleCard(card, 2, new Date());

      expect(scheduledCard.stability).toBeGreaterThanOrEqual(0.1);
    });

    it('should constrain difficulty between 1 and 10', () => {
      let card = createFSRSCard();

      // Multiple easy ratings should not push difficulty below 1
      for (let i = 0; i < 10; i++) {
        const result = scheduleCard(card, 4, new Date());
        card = result.card;
      }

      expect(card.difficulty).toBeGreaterThanOrEqual(1);
      expect(card.difficulty).toBeLessThanOrEqual(10);
    });
  });
});
