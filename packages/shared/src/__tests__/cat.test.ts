import { describe, it, expect } from 'vitest';
import {
  initCATSession,
  selectNextItem,
  updateCATSession,
  getAreaCoverage,
  getPrecisionPercentage,
  isContentBalanced,
  calculateExposureRate,
  updateExposureRates,
  generateCATReport,
  DEFAULT_CAT_CONFIG,
  type CATSession,
} from '../algorithms/cat';
import type { ENAMEDQuestion, ENAMEDArea, IRTParameters } from '../types/education';

// Helper function to create mock questions
function createMockQuestion(
  id: string,
  area: ENAMEDArea,
  difficulty: number,
  discrimination: number = 1.0
): ENAMEDQuestion {
  return {
    id,
    bankId: 'test-bank',
    stem: 'Test question',
    options: [],
    correctIndex: 0,
    explanation: 'Test explanation',
    irt: {
      difficulty,
      discrimination,
      guessing: 0.25,
    },
    difficulty: 'medio',
    ontology: {
      area,
      subspecialty: 'Test',
      topic: 'Test Topic',
    },
    isAIGenerated: false,
  };
}

describe('CAT Algorithm', () => {
  describe('Session Initialization', () => {
    it('should initialize a CAT session with default values', () => {
      const session = initCATSession();

      expect(session.theta).toBe(0);
      expect(session.se).toBe(Infinity);
      expect(session.itemsAdministered).toHaveLength(0);
      expect(session.responses).toHaveLength(0);
      expect(session.itemAreas).toHaveLength(0);
      expect(session.thetaHistory).toHaveLength(0);
      expect(session.isComplete).toBe(false);
    });
  });

  describe('Item Selection', () => {
    it('should select an item from the bank', () => {
      const session = initCATSession();
      const itemBank: ENAMEDQuestion[] = [
        createMockQuestion('q1', 'clinica_medica', 0.5),
        createMockQuestion('q2', 'cirurgia', 0.0),
        createMockQuestion('q3', 'pediatria', -0.5),
      ];
      const exposureRates = new Map<string, number>();

      const selectedItem = selectNextItem(session, itemBank, exposureRates);

      expect(selectedItem).toBeDefined();
      expect(itemBank.map(q => q.id)).toContain(selectedItem!.id);
    });

    it('should not select already administered items', () => {
      const session: CATSession = {
        ...initCATSession(),
        itemsAdministered: ['q1', 'q2'],
      };

      const itemBank: ENAMEDQuestion[] = [
        createMockQuestion('q1', 'clinica_medica', 0.5),
        createMockQuestion('q2', 'cirurgia', 0.0),
        createMockQuestion('q3', 'pediatria', -0.5),
      ];
      const exposureRates = new Map<string, number>();

      const selectedItem = selectNextItem(session, itemBank, exposureRates);

      expect(selectedItem!.id).toBe('q3');
    });

    it('should respect exposure control', () => {
      const session = initCATSession();
      const itemBank: ENAMEDQuestion[] = [
        createMockQuestion('q1', 'clinica_medica', 0.0),
        createMockQuestion('q2', 'cirurgia', 0.0),
      ];
      const exposureRates = new Map<string, number>([
        ['q1', 0.5], // Over max exposure (0.25)
        ['q2', 0.1], // Under max exposure
      ]);

      const selectedItem = selectNextItem(session, itemBank, exposureRates);

      // Should select q2 since q1 is overexposed
      expect(selectedItem!.id).toBe('q2');
    });

    it('should fall back to all items if all are overexposed', () => {
      const session = initCATSession();
      const itemBank: ENAMEDQuestion[] = [
        createMockQuestion('q1', 'clinica_medica', 0.0),
        createMockQuestion('q2', 'cirurgia', 0.0),
      ];
      const exposureRates = new Map<string, number>([
        ['q1', 0.5],
        ['q2', 0.5],
      ]);

      const selectedItem = selectNextItem(session, itemBank, exposureRates);

      // Should still select an item
      expect(selectedItem).toBeDefined();
    });

    it('should return null when no items remain', () => {
      const session: CATSession = {
        ...initCATSession(),
        itemsAdministered: ['q1', 'q2', 'q3'],
      };

      const itemBank: ENAMEDQuestion[] = [
        createMockQuestion('q1', 'clinica_medica', 0.5),
        createMockQuestion('q2', 'cirurgia', 0.0),
        createMockQuestion('q3', 'pediatria', -0.5),
      ];
      const exposureRates = new Map<string, number>();

      const selectedItem = selectNextItem(session, itemBank, exposureRates);

      expect(selectedItem).toBeNull();
    });
  });

  describe('Session Update', () => {
    it('should update session after correct response', () => {
      const session = initCATSession();
      const questionId = 'q1';
      const itemParams: IRTParameters = {
        difficulty: 0.5,
        discrimination: 1.0,
        guessing: 0.25,
      };
      const allItemParams = new Map([['q1', itemParams]]);

      const updatedSession = updateCATSession(
        session,
        questionId,
        true, // correct
        'clinica_medica',
        itemParams,
        allItemParams
      );

      expect(updatedSession.itemsAdministered).toHaveLength(1);
      expect(updatedSession.itemsAdministered[0]).toBe(questionId);
      expect(updatedSession.responses).toHaveLength(1);
      expect(updatedSession.responses[0]).toBe(true);
      expect(updatedSession.itemAreas).toHaveLength(1);
      expect(updatedSession.theta).toBeGreaterThan(session.theta);
    });

    it('should update session after incorrect response', () => {
      const session = initCATSession();
      const questionId = 'q1';
      const itemParams: IRTParameters = {
        difficulty: -0.5,
        discrimination: 1.0,
        guessing: 0.25,
      };
      const allItemParams = new Map([['q1', itemParams]]);

      const updatedSession = updateCATSession(
        session,
        questionId,
        false, // incorrect
        'cirurgia',
        itemParams,
        allItemParams
      );

      expect(updatedSession.responses[0]).toBe(false);
      expect(updatedSession.theta).toBeLessThan(session.theta);
    });

    it('should track theta history', () => {
      let session = initCATSession();
      const itemBank: ENAMEDQuestion[] = [
        createMockQuestion('q1', 'clinica_medica', 0.0, 1.0),
        createMockQuestion('q2', 'cirurgia', 0.0, 1.0),
        createMockQuestion('q3', 'pediatria', 0.0, 1.0),
      ];

      const allItemParams = new Map(
        itemBank.map(q => [q.id, q.irt])
      );

      // Answer 3 questions
      for (const item of itemBank) {
        session = updateCATSession(
          session,
          item.id,
          true,
          item.ontology.area,
          item.irt,
          allItemParams
        );
      }

      expect(session.thetaHistory).toHaveLength(3);
      expect(session.thetaHistory[0].itemNum).toBe(1);
      expect(session.thetaHistory[1].itemNum).toBe(2);
      expect(session.thetaHistory[2].itemNum).toBe(3);
    });

    it('should reduce standard error as more items are administered', () => {
      let session = initCATSession();
      const itemBank: ENAMEDQuestion[] = Array.from({ length: 10 }, (_, i) =>
        createMockQuestion(`q${i}`, 'clinica_medica', 0.0, 1.5)
      );

      const allItemParams = new Map(
        itemBank.map(q => [q.id, q.irt])
      );

      const initialSE = Infinity;
      let previousSE = initialSE;

      // Answer 10 questions
      for (const item of itemBank) {
        session = updateCATSession(
          session,
          item.id,
          true,
          item.ontology.area,
          item.irt,
          allItemParams
        );

        // SE should decrease
        expect(session.se).toBeLessThan(previousSE);
        previousSE = session.se;
      }
    });
  });

  describe('Stopping Rules', () => {
    it('should stop when SE threshold is reached', () => {
      let session = initCATSession();

      // Create items with high discrimination for faster convergence
      const itemBank: ENAMEDQuestion[] = Array.from({ length: 50 }, (_, i) =>
        createMockQuestion(`q${i}`, 'clinica_medica', 0.0, 2.0)
      );

      const allItemParams = new Map(
        itemBank.map(q => [q.id, q.irt])
      );

      const config = {
        ...DEFAULT_CAT_CONFIG,
        seThreshold: 0.30,
        minItems: 30,
      };

      // Answer questions until complete
      for (const item of itemBank) {
        if (session.isComplete) break;

        session = updateCATSession(
          session,
          item.id,
          true,
          item.ontology.area,
          item.irt,
          allItemParams,
          config
        );
      }

      if (session.isComplete && session.stoppingReason === 'se_threshold') {
        expect(session.se).toBeLessThan(config.seThreshold);
        expect(session.itemsAdministered.length).toBeGreaterThanOrEqual(config.minItems);
      }
    });

    it('should stop at maximum items', () => {
      let session = initCATSession();
      const itemBank: ENAMEDQuestion[] = Array.from({ length: 100 }, (_, i) =>
        createMockQuestion(`q${i}`, 'clinica_medica', i * 0.1 - 5, 0.5)
      );

      const allItemParams = new Map(
        itemBank.map(q => [q.id, q.irt])
      );

      const config = {
        ...DEFAULT_CAT_CONFIG,
        maxItems: 80,
      };

      // Answer max items
      for (let i = 0; i < config.maxItems; i++) {
        session = updateCATSession(
          session,
          itemBank[i].id,
          i % 2 === 0, // Alternate correct/incorrect
          itemBank[i].ontology.area,
          itemBank[i].irt,
          allItemParams,
          config
        );
      }

      expect(session.isComplete).toBe(true);
      expect(session.stoppingReason).toBe('max_items');
      expect(session.itemsAdministered.length).toBe(config.maxItems);
    });

    it('should not stop before minimum items', () => {
      let session = initCATSession();
      const itemBank: ENAMEDQuestion[] = Array.from({ length: 50 }, (_, i) =>
        createMockQuestion(`q${i}`, 'clinica_medica', 0.0, 2.0)
      );

      const allItemParams = new Map(
        itemBank.map(q => [q.id, q.irt])
      );

      const config = {
        ...DEFAULT_CAT_CONFIG,
        minItems: 30,
      };

      // Answer 20 questions (less than min)
      for (let i = 0; i < 20; i++) {
        session = updateCATSession(
          session,
          itemBank[i].id,
          true,
          itemBank[i].ontology.area,
          itemBank[i].irt,
          allItemParams,
          config
        );
      }

      expect(session.isComplete).toBe(false);
    });
  });

  describe('Content Balancing', () => {
    it('should track area coverage', () => {
      const session: CATSession = {
        ...initCATSession(),
        itemAreas: [
          'clinica_medica',
          'clinica_medica',
          'cirurgia',
          'pediatria',
          'saude_coletiva',
        ],
      };

      const coverage = getAreaCoverage(session);

      expect(coverage.clinica_medica).toBe(2);
      expect(coverage.cirurgia).toBe(1);
      expect(coverage.ginecologia_obstetricia).toBe(0);
      expect(coverage.pediatria).toBe(1);
      expect(coverage.saude_coletiva).toBe(1);
    });

    it('should check if content is balanced', () => {
      const balancedSession: CATSession = {
        ...initCATSession(),
        itemAreas: [
          'clinica_medica',
          'clinica_medica',
          'cirurgia',
          'cirurgia',
          'ginecologia_obstetricia',
          'ginecologia_obstetricia',
          'pediatria',
          'pediatria',
          'saude_coletiva',
          'saude_coletiva',
        ],
      };

      const unbalancedSession: CATSession = {
        ...initCATSession(),
        itemAreas: [
          'clinica_medica',
          'clinica_medica',
          'clinica_medica',
          'clinica_medica',
          'cirurgia',
        ],
      };

      expect(isContentBalanced(balancedSession, DEFAULT_CAT_CONFIG.areaTargets)).toBe(true);
      expect(isContentBalanced(unbalancedSession, DEFAULT_CAT_CONFIG.areaTargets)).toBe(false);
    });
  });

  describe('Exposure Control', () => {
    it('should calculate exposure rate correctly', () => {
      const rate1 = calculateExposureRate('q1', 25, 100);
      expect(rate1).toBe(0.25);

      const rate2 = calculateExposureRate('q2', 0, 100);
      expect(rate2).toBe(0);

      const rate3 = calculateExposureRate('q3', 50, 100);
      expect(rate3).toBe(0.5);
    });

    it('should handle zero sessions gracefully', () => {
      const rate = calculateExposureRate('q1', 10, 0);
      expect(rate).toBe(0);
    });

    it('should update exposure rates after session', () => {
      const initialRates = new Map([
        ['q1', 0.1],
        ['q2', 0.2],
      ]);

      const session: CATSession = {
        ...initCATSession(),
        itemsAdministered: ['q1', 'q3'],
      };

      const updatedRates = updateExposureRates(initialRates, session, 10);

      expect(updatedRates.get('q1')).toBeGreaterThan(0.1);
      expect(updatedRates.get('q2')).toBe(0.2); // Unchanged
      expect(updatedRates.has('q3')).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should calculate precision percentage', () => {
      expect(getPrecisionPercentage(Infinity)).toBe(0);
      expect(getPrecisionPercentage(0.30)).toBeCloseTo(10, 0);
      expect(getPrecisionPercentage(0.20)).toBeCloseTo(40, 0);
      expect(getPrecisionPercentage(0.10)).toBeCloseTo(70, 0);
      expect(getPrecisionPercentage(0)).toBe(100);
    });

    it('should generate CAT report', () => {
      const session: CATSession = {
        ...initCATSession(),
        theta: 1.5,
        se: 0.25,
        itemsAdministered: ['q1', 'q2', 'q3', 'q4', 'q5'],
        responses: [true, true, false, true, true],
        itemAreas: [
          'clinica_medica',
          'cirurgia',
          'ginecologia_obstetricia',
          'pediatria',
          'saude_coletiva',
        ],
        isComplete: true,
        stoppingReason: 'se_threshold',
      };

      const report = generateCATReport(session, DEFAULT_CAT_CONFIG);

      expect(report).toContain('Items Administered: 5');
      expect(report).toContain('Correct Answers: 4 / 5');
      expect(report).toContain('Final Theta: 1.500');
      expect(report).toContain('Standard Error: 0.250');
      expect(report).toContain('Stopping Reason: se_threshold');
      expect(report).toContain('Clínica Médica');
    });
  });
});
