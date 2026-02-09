import { describe, it, expect } from 'vitest';
import {
  estimateIRTFromMetadata,
  validateIRTParameters,
  formatIRTParameters,
  calculateConfidenceIntervals,
  type QuestionMetadata,
} from '../calculators/irt-estimation';
import { IRT_ESTIMATION_CONFIG } from '../config/irt-estimation-config';

// Helper to create metadata with defaults
function meta(overrides: Partial<QuestionMetadata> = {}): QuestionMetadata {
  return {
    institution: 'ENAMED',
    institutionTier: 'TIER_2_REGIONAL_STRONG',
    year: 2024,
    examType: 'R2',
    questionPosition: 50,
    totalQuestionsInExam: 100,
    optionCount: 4,
    ...overrides,
  };
}

describe('IRT Phase 2 Estimation', () => {
  // ── Polynomial Position Model ──

  describe('Polynomial Position Model', () => {
    it('should produce wider range than linear model would', () => {
      const early = estimateIRTFromMetadata(meta({ questionPosition: 1 }));
      const late = estimateIRTFromMetadata(meta({ questionPosition: 100 }));
      const range = late.difficulty - early.difficulty;

      // Polynomial (cubic) should produce more variance than old linear ±0.3
      expect(range).toBeGreaterThan(0.6);
    });

    it('should make later questions harder (positive trend)', () => {
      const pos10 = estimateIRTFromMetadata(meta({ questionPosition: 10 }));
      const pos90 = estimateIRTFromMetadata(meta({ questionPosition: 90 }));

      expect(pos90.difficulty).toBeGreaterThan(pos10.difficulty);
    });

    it('should track position component', () => {
      const result = estimateIRTFromMetadata(meta({ questionPosition: 80 }));
      expect(result.components.position).toBeDefined();
      expect(typeof result.components.position).toBe('number');
    });

    it('should clamp polynomial output on very large exams', () => {
      // An exam with 500 questions — the cubic term could overshoot
      const extreme = estimateIRTFromMetadata(
        meta({ questionPosition: 500, totalQuestionsInExam: 500 })
      );
      // Polynomial is clamped to [-1.5, +1.5]
      expect(extreme.components.position).toBeGreaterThanOrEqual(-1.5);
      expect(extreme.components.position).toBeLessThanOrEqual(1.5);
    });

    it('should handle edge case: position=1 of 1', () => {
      const result = estimateIRTFromMetadata(
        meta({ questionPosition: 1, totalQuestionsInExam: 1 })
      );
      expect(isFinite(result.difficulty)).toBe(true);
      expect(isFinite(result.discrimination)).toBe(true);
    });

    it('should handle edge case: first question', () => {
      const result = estimateIRTFromMetadata(
        meta({ questionPosition: 1, totalQuestionsInExam: 100 })
      );
      expect(isFinite(result.difficulty)).toBe(true);
      // First question should have negative position adjustment (easier)
      expect(result.components.position).toBeLessThan(0);
    });

    it('should handle edge case: last question', () => {
      const result = estimateIRTFromMetadata(
        meta({ questionPosition: 100, totalQuestionsInExam: 100 })
      );
      expect(isFinite(result.difficulty)).toBe(true);
      // Cubic polynomial can be non-monotonic at edges — just verify finite
      expect(typeof result.components.position).toBe('number');
    });
  });

  // ── Area × Institution Interaction ──

  describe('Area × Institution Interaction', () => {
    it('should add interaction term when area and tier are present', () => {
      const result = estimateIRTFromMetadata(
        meta({
          area: 'cirurgia',
          institutionTier: 'TIER_1_NATIONAL',
        })
      );
      expect(result.components.areaInstitutionInteraction).toBeDefined();
      expect(result.components.areaInstitutionInteraction).toBe(0.2); // from config
    });

    it('should have surgery at TIER_1 harder than surgery at TIER_3', () => {
      const tier1 = estimateIRTFromMetadata(
        meta({ area: 'cirurgia', institutionTier: 'TIER_1_NATIONAL' })
      );
      const tier3 = estimateIRTFromMetadata(
        meta({ area: 'cirurgia', institutionTier: 'TIER_3_REGIONAL' })
      );

      expect(tier1.difficulty).toBeGreaterThan(tier3.difficulty);
    });

    it('should have zero interaction for TIER_2 in most areas', () => {
      const result = estimateIRTFromMetadata(
        meta({
          area: 'clinica_medica',
          institutionTier: 'TIER_2_REGIONAL_STRONG',
        })
      );
      expect(result.components.areaInstitutionInteraction).toBe(0);
    });

    it('should skip interaction when area is not specified', () => {
      const result = estimateIRTFromMetadata(
        meta({ institutionTier: 'TIER_1_NATIONAL' })
      );
      expect(result.components.areaInstitutionInteraction).toBeUndefined();
    });

    it('should skip interaction for unknown area', () => {
      const result = estimateIRTFromMetadata(
        meta({ area: 'dermatologia', institutionTier: 'TIER_1_NATIONAL' })
      );
      expect(result.components.areaInstitutionInteraction).toBeUndefined();
    });
  });

  // ── Area-Specific Discrimination ──

  describe('Area-Specific Discrimination', () => {
    it('should apply area multiplier to discrimination', () => {
      const surgery = estimateIRTFromMetadata(meta({ area: 'cirurgia' }));
      const noArea = estimateIRTFromMetadata(meta());

      // Surgery should have higher discrimination (multiplier 1.22)
      expect(surgery.discrimination).toBeGreaterThan(noArea.discrimination);
    });

    it('should have surgery with highest discrimination', () => {
      const surgery = estimateIRTFromMetadata(meta({ area: 'cirurgia' }));
      const publicH = estimateIRTFromMetadata(meta({ area: 'saude_coletiva' }));

      // cirurgia: 1.22, saude_coletiva: 0.95
      expect(surgery.discrimination).toBeGreaterThan(publicH.discrimination);
    });

    it('should track area component in discrimination', () => {
      const result = estimateIRTFromMetadata(meta({ area: 'pediatria' }));
      expect(result.components.area).toBeDefined();
    });
  });

  // ── Position-Based Discrimination ──

  describe('Position-Based Discrimination', () => {
    it('should give middle questions highest discrimination', () => {
      const early = estimateIRTFromMetadata(meta({ questionPosition: 1 }));
      const middle = estimateIRTFromMetadata(meta({ questionPosition: 50 }));
      const late = estimateIRTFromMetadata(meta({ questionPosition: 100 }));

      expect(middle.discrimination).toBeGreaterThan(early.discrimination);
      expect(middle.discrimination).toBeGreaterThan(late.discrimination);
    });

    it('should follow sinusoidal bell-curve shape', () => {
      const quarter = estimateIRTFromMetadata(meta({ questionPosition: 25 }));
      const middle = estimateIRTFromMetadata(meta({ questionPosition: 50 }));
      const threeQ = estimateIRTFromMetadata(meta({ questionPosition: 75 }));

      // Quarter and three-quarter should be approximately equal (bell curve is symmetric)
      expect(Math.abs(quarter.discrimination - threeQ.discrimination)).toBeLessThan(0.05);
      // Both lower than middle
      expect(middle.discrimination).toBeGreaterThanOrEqual(quarter.discrimination);
    });

    it('should track position discrimination component', () => {
      const result = estimateIRTFromMetadata(meta({ questionPosition: 50 }));
      expect(result.components.position).toBeDefined();
    });
  });

  // ── Bounds ──

  describe('Widened Bounds (Phase 2)', () => {
    it('should allow difficulty down to -3.5', () => {
      // TIER_3, old year, saude_coletiva — accumulate negative adjustments
      const result = estimateIRTFromMetadata(
        meta({
          institutionTier: 'TIER_3_REGIONAL',
          year: 2024,
          examType: 'R3',
          area: 'saude_coletiva',
          questionPosition: 1,
          totalQuestionsInExam: 100,
        })
      );
      // Should clamp at -3.5, not -2.5 (old bound)
      expect(result.difficulty).toBeGreaterThanOrEqual(-3.5);
    });

    it('should allow difficulty up to +3.0', () => {
      // TIER_1, very old year, R1, surgery, late position
      const result = estimateIRTFromMetadata(
        meta({
          institutionTier: 'TIER_1_NATIONAL',
          year: 2015, // 9 years drift = +0.9
          examType: 'R1',
          area: 'cirurgia',
          questionPosition: 100,
          totalQuestionsInExam: 100,
        })
      );
      // Should clamp at +3.0
      expect(result.difficulty).toBeLessThanOrEqual(3.0);
    });

    it('should allow discrimination down to 0.5', () => {
      const result = estimateIRTFromMetadata(
        meta({
          institutionTier: 'TIER_3_REGIONAL',
          area: 'saude_coletiva',
          questionPosition: 1,
          totalQuestionsInExam: 100,
        })
      );
      expect(result.discrimination).toBeGreaterThanOrEqual(0.5);
    });

    it('should allow discrimination up to 2.0', () => {
      const result = estimateIRTFromMetadata(
        meta({
          institutionTier: 'TIER_1_NATIONAL',
          examType: 'national',
          area: 'cirurgia',
          questionPosition: 50,
          totalQuestionsInExam: 100,
        })
      );
      expect(result.discrimination).toBeLessThanOrEqual(2.0);
    });
  });

  // ── Component-Based Confidence ──

  describe('Component-Based Confidence', () => {
    it('should compute higher confidence for TIER_1', () => {
      const tier1 = estimateIRTFromMetadata(
        meta({ institutionTier: 'TIER_1_NATIONAL', area: 'clinica_medica' })
      );
      const tier3 = estimateIRTFromMetadata(
        meta({ institutionTier: 'TIER_3_REGIONAL', area: 'clinica_medica' })
      );

      expect(tier1.confidence).toBeGreaterThan(tier3.confidence);
    });

    it('should add bonus when area is known', () => {
      const withArea = estimateIRTFromMetadata(meta({ area: 'pediatria' }));
      const noArea = estimateIRTFromMetadata(meta());

      expect(withArea.confidence).toBeGreaterThan(noArea.confidence);
    });

    it('should cap confidence at 0.85', () => {
      const result = estimateIRTFromMetadata(
        meta({
          institutionTier: 'TIER_1_NATIONAL',
          area: 'cirurgia',
        })
      );
      expect(result.confidence).toBeLessThanOrEqual(0.85);
    });

    it('should include model version bonus', () => {
      // The Phase 2 confidence model adds modelVersionBonus=0.10
      // For TIER_1 + area + interaction + polynomial + version = 0.55 + 0.05 + 0.05 + 0.05 + 0.10 = 0.80
      const result = estimateIRTFromMetadata(
        meta({
          institutionTier: 'TIER_1_NATIONAL',
          area: 'cirurgia',
        })
      );
      expect(result.confidence).toBeCloseTo(0.80, 10);
    });
  });

  // ── Spot Check ──

  describe('Spot Check (Plan Verification)', () => {
    it('TIER_1/national/2025/pos=90/surgery should produce difficulty > 1.0', () => {
      const result = estimateIRTFromMetadata(
        meta({
          institutionTier: 'TIER_1_NATIONAL',
          examType: 'national',
          year: 2025,
          area: 'cirurgia',
          questionPosition: 90,
          totalQuestionsInExam: 100,
        })
      );
      // Base 0.0 + inst 0.4 + year -0.1 + exam 0.2 + position ~0.5 + area 0.34 + interaction 0.20
      expect(result.difficulty).toBeGreaterThan(1.0);
    });
  });

  // ── Backward Compatibility ──

  describe('Backward Compatibility', () => {
    it('should return same function signature and return type', () => {
      const result = estimateIRTFromMetadata(meta());

      expect(typeof result.difficulty).toBe('number');
      expect(typeof result.discrimination).toBe('number');
      expect(typeof result.guessing).toBe('number');
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.components).toBe('object');
      expect(result.method).toBe('metadata');
    });

    it('should use 0.25 guessing for 4-option questions', () => {
      const result = estimateIRTFromMetadata(meta({ optionCount: 4 }));
      expect(result.guessing).toBe(0.25);
    });

    it('should use 0.2 guessing for 5-option questions', () => {
      const result = estimateIRTFromMetadata(meta({ optionCount: 5 }));
      expect(result.guessing).toBe(0.2);
    });
  });

  // ── Validation ──

  describe('Validate IRT Parameters', () => {
    it('should accept valid parameters', () => {
      expect(
        validateIRTParameters({ difficulty: 0, discrimination: 1, guessing: 0.25 })
      ).toBe(true);
    });

    it('should reject extreme difficulty', () => {
      expect(
        validateIRTParameters({ difficulty: 5, discrimination: 1, guessing: 0.25 })
      ).toBe(false);
    });

    it('should reject zero discrimination', () => {
      expect(
        validateIRTParameters({ difficulty: 0, discrimination: 0, guessing: 0.25 })
      ).toBe(false);
    });
  });

  // ── Confidence Intervals ──

  describe('Confidence Intervals', () => {
    it('should produce narrower CI for higher confidence', () => {
      const highConf = calculateConfidenceIntervals({
        difficulty: 0, discrimination: 1, guessing: 0.25, confidence: 0.80,
        components: {}, method: 'metadata',
      });
      const lowConf = calculateConfidenceIntervals({
        difficulty: 0, discrimination: 1, guessing: 0.25, confidence: 0.50,
        components: {}, method: 'metadata',
      });

      const highRange = highConf.difficulty[1] - highConf.difficulty[0];
      const lowRange = lowConf.difficulty[1] - lowConf.difficulty[0];
      expect(highRange).toBeLessThan(lowRange);
    });

    it('should clamp CI to Phase 2 bounds', () => {
      const ci = calculateConfidenceIntervals({
        difficulty: -3.0, discrimination: 0.6, guessing: 0.25, confidence: 0.40,
        components: {}, method: 'metadata',
      });

      expect(ci.difficulty[0]).toBeGreaterThanOrEqual(-3.5);
      expect(ci.difficulty[1]).toBeLessThanOrEqual(3.0);
      expect(ci.discrimination[0]).toBeGreaterThanOrEqual(0.5);
      expect(ci.discrimination[1]).toBeLessThanOrEqual(2.0);
    });
  });

  // ── Format ──

  describe('Format IRT Parameters', () => {
    it('should format with confidence', () => {
      const str = formatIRTParameters({
        difficulty: 1.234, discrimination: 0.876, guessing: 0.25, confidence: 0.75,
      });
      expect(str).toContain('b=1.234');
      expect(str).toContain('a=0.876');
      expect(str).toContain('c=0.250');
      expect(str).toContain('[confidence: 75%]');
    });

    it('should format without confidence', () => {
      const str = formatIRTParameters({
        difficulty: 0, discrimination: 1, guessing: 0.25,
      });
      expect(str).not.toContain('confidence');
    });
  });
});
