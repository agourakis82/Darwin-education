/**
 * DDL Integration Service
 * =======================
 *
 * Connects QGen with the DDL (Differential Diagnosis of Learning) system
 * to generate adaptive questions based on learner gap classifications.
 */

import type {
  LacunaType,
  ClassificationResult,
  DDLFullAnalysisResult,
  ConfidenceLevel,
} from '../../ddl/types';
import {
  type QGenGenerationConfig,
  BloomLevel,
  QGenQuestionType,
  ClinicalScenario,
} from '@darwin-education/shared';
import { ENAMED_DISTRIBUTION } from '../constants/patterns';

/**
 * Student profile for adaptive question selection
 */
export interface StudentProfile {
  userId: string;
  currentTheta: number; // -4 to +4 IRT ability estimate
  recentPerformance: {
    area: string;
    topic: string;
    correctRate: number;
    averageTimeMs: number;
  }[];
  learningHistory: {
    questionsAttempted: number;
    averageScore: number;
    weakAreas: string[];
    strongAreas: string[];
  };
  baselineData?: {
    avgResponseTimeMs: number;
    avgHesitationIndex: number;
    avgSemanticSimilarity: number;
  };
}

/**
 * DDL-based difficulty adjustment parameters
 */
interface DifficultyAdjustment {
  baseDifficulty: number;
  adjustment: number;
  finalDifficulty: number;
  reason: string;
}

/**
 * Distractor selection parameters for targeting misconceptions
 */
interface DistractorSelectionParams {
  targetMisconceptionTypes: string[];
  plausibilityRange: { min: number; max: number };
  avoidCategories: string[];
  preferCategories: string[];
}

/**
 * DDL-to-QGen mapping result
 */
export interface DDLToQGenMapping {
  config: Partial<QGenGenerationConfig>;
  distractorParams: DistractorSelectionParams;
  difficultyAdjustment: DifficultyAdjustment;
  rationale: string;
}

/**
 * Lacuna-specific generation strategies
 */
const LACUNA_STRATEGIES: Record<LacunaType, {
  bloomLevels: BloomLevel[];
  questionTypes: QGenQuestionType[];
  difficultyModifier: number;
  distractorFocus: string[];
  scenarioPreference: ClinicalScenario[];
  description: string;
}> = {
  LE: {
    // Epistemic Gap: Knowledge/memory deficiency
    bloomLevels: [BloomLevel.KNOWLEDGE, BloomLevel.COMPREHENSION],
    questionTypes: [QGenQuestionType.CONCEPTUAL, QGenQuestionType.CLINICAL_CASE],
    difficultyModifier: -0.5, // Start easier to build foundation
    distractorFocus: ['common_confusion', 'similar_concepts'],
    scenarioPreference: [ClinicalScenario.OUTPATIENT, ClinicalScenario.PRIMARY_CARE],
    description: 'Focus on foundational concepts with clear explanations',
  },
  LEm: {
    // Emotional Gap: Anxiety/confidence issues
    bloomLevels: [BloomLevel.APPLICATION, BloomLevel.COMPREHENSION],
    questionTypes: [QGenQuestionType.CLINICAL_CASE],
    difficultyModifier: -0.3, // Slightly easier to build confidence
    distractorFocus: ['plausible_alternatives', 'partial_truths'],
    scenarioPreference: [ClinicalScenario.OUTPATIENT, ClinicalScenario.INPATIENT],
    description: 'Clear clinical scenarios with step-by-step reasoning',
  },
  LIE: {
    // Integration Gap: Difficulty connecting concepts
    bloomLevels: [BloomLevel.ANALYSIS, BloomLevel.SYNTHESIS, BloomLevel.APPLICATION],
    questionTypes: [QGenQuestionType.CLINICAL_CASE, QGenQuestionType.INTERPRETATION],
    difficultyModifier: 0, // Standard difficulty
    distractorFocus: ['incomplete_integration', 'missing_connection'],
    scenarioPreference: [ClinicalScenario.EMERGENCY, ClinicalScenario.ICU],
    description: 'Complex cases requiring multi-concept integration',
  },
  MIXED: {
    // Mixed gaps: Multiple issues present
    bloomLevels: [BloomLevel.COMPREHENSION, BloomLevel.APPLICATION],
    questionTypes: [QGenQuestionType.CLINICAL_CASE],
    difficultyModifier: -0.2, // Slightly easier
    distractorFocus: ['common_confusion', 'partial_truths'],
    scenarioPreference: [ClinicalScenario.OUTPATIENT, ClinicalScenario.INPATIENT],
    description: 'Balanced approach addressing multiple gap types',
  },
  NONE: {
    // No significant gap detected
    bloomLevels: [BloomLevel.ANALYSIS, BloomLevel.SYNTHESIS, BloomLevel.EVALUATION],
    questionTypes: [QGenQuestionType.CLINICAL_CASE, QGenQuestionType.CALCULATION, QGenQuestionType.INTERPRETATION],
    difficultyModifier: 0.3, // Challenge with harder questions
    distractorFocus: ['expert_traps', 'nuanced_distinctions'],
    scenarioPreference: [ClinicalScenario.EMERGENCY, ClinicalScenario.ICU, ClinicalScenario.SURGERY],
    description: 'Challenging questions to push to next level',
  },
};

/**
 * DDL Integration Service
 */
export class DDLIntegrationService {
  /**
   * Get a question configuration based on DDL lacuna classification
   */
  getQuestionForLacuna(
    lacunaType: LacunaType,
    studentProfile: StudentProfile,
    targetArea?: string,
    targetTopic?: string
  ): DDLToQGenMapping {
    const strategy = LACUNA_STRATEGIES[lacunaType];

    // Calculate base difficulty from student's theta
    const baseDifficulty = this.thetaToDifficulty(studentProfile.currentTheta);

    // Apply lacuna-based adjustment
    const difficultyAdjustment = this.adjustDifficultyForGap(
      baseDifficulty,
      lacunaType,
      studentProfile
    );

    // Select appropriate Bloom level based on student history
    const bloomLevel = this.selectBloomLevel(
      strategy.bloomLevels,
      studentProfile,
      lacunaType
    );

    // Determine question type
    const questionType = this.selectQuestionType(
      strategy.questionTypes,
      studentProfile,
      lacunaType
    );

    // Get distractor parameters
    const distractorParams = this.getDistractorParamsForGap(
      lacunaType,
      studentProfile
    );

    // Determine target area if not specified
    const area = targetArea || this.selectTargetArea(studentProfile);

    // Build configuration
    const config: Partial<QGenGenerationConfig> = {
      targetArea: area,
      targetTopic: targetTopic,
      targetDifficulty: difficultyAdjustment.finalDifficulty,
      targetBloomLevel: bloomLevel,
      targetQuestionType: questionType,
    };

    return {
      config,
      distractorParams,
      difficultyAdjustment,
      rationale: this.buildRationale(lacunaType, strategy, studentProfile),
    };
  }

  /**
   * Adjust difficulty based on gap type and student profile
   */
  adjustDifficultyForGap(
    baseDifficulty: number,
    lacunaType: LacunaType,
    studentProfile: StudentProfile
  ): DifficultyAdjustment {
    const strategy = LACUNA_STRATEGIES[lacunaType];
    let adjustment = strategy.difficultyModifier;
    let reason = strategy.description;

    // Additional adjustments based on student profile

    // If student has been struggling recently, reduce difficulty more
    const recentCorrectRate = this.calculateRecentCorrectRate(studentProfile);
    if (recentCorrectRate < 0.4) {
      adjustment -= 0.3;
      reason += '; Recent performance indicates need for easier questions';
    } else if (recentCorrectRate > 0.8) {
      adjustment += 0.2;
      reason += '; Strong recent performance allows for challenge';
    }

    // Consider anxiety indicators for LEm
    if (lacunaType === 'LEm' && studentProfile.baselineData) {
      const anxietyIndicator = studentProfile.baselineData.avgHesitationIndex;
      if (anxietyIndicator > 0.7) {
        adjustment -= 0.2;
        reason += '; High hesitation suggests need for confidence building';
      }
    }

    // Clamp final difficulty to 1-5 scale
    const finalDifficulty = Math.max(1, Math.min(5, baseDifficulty + adjustment));

    return {
      baseDifficulty,
      adjustment,
      finalDifficulty,
      reason,
    };
  }

  /**
   * Select distractors that target specific misconceptions based on gap type
   */
  selectDistractorsForGap(
    distractors: Array<{ text: string; type: string; plausibility: number }>,
    lacunaType: LacunaType
  ): Array<{ text: string; type: string; plausibility: number }> {
    const strategy = LACUNA_STRATEGIES[lacunaType];
    const focusTypes = strategy.distractorFocus;

    // Score each distractor based on how well it matches the gap type focus
    const scoredDistractors = distractors.map(d => ({
      ...d,
      score: this.scoreDistractorForGap(d, focusTypes, lacunaType),
    }));

    // Sort by score and select top 3 (for 4-option MCQ)
    return scoredDistractors
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score, ...d }) => d);
  }

  /**
   * Map a full DDL analysis result to QGen generation parameters
   */
  mapDDLToGenerationParams(
    ddlResult: DDLFullAnalysisResult,
    studentProfile: StudentProfile
  ): DDLToQGenMapping {
    const { classification } = ddlResult;
    const primaryType = classification.primary_type;

    // Start with base mapping for primary type
    const mapping = this.getQuestionForLacuna(
      primaryType,
      studentProfile
    );

    // Refine based on specific analysis results
    this.refineConfigFromSemanticAnalysis(mapping, ddlResult);
    this.refineConfigFromBehavioralAnalysis(mapping, ddlResult);

    // Handle mixed types
    if (classification.secondary_type && classification.secondary_probability) {
      if (classification.secondary_probability > 0.3) {
        this.incorporateSecondaryType(
          mapping,
          classification.secondary_type,
          classification.secondary_probability
        );
      }
    }

    return mapping;
  }

  /**
   * Generate adaptive question for a specific student based on DDL classification
   */
  async generateAdaptiveQuestion(
    ddlClassification: ClassificationResult,
    studentProfile: StudentProfile,
    preferences?: {
      area?: string;
      topic?: string;
      avoidQuestionIds?: string[];
    }
  ): Promise<DDLToQGenMapping> {
    const lacunaType = ddlClassification.primary_type;

    // Get base mapping
    const mapping = this.getQuestionForLacuna(
      lacunaType,
      studentProfile,
      preferences?.area,
      preferences?.topic
    );

    // Adjust based on confidence level
    if (ddlClassification.primary_confidence === 'LOW') {
      // Low confidence - use more conservative approach
      mapping.config.targetDifficulty = Math.max(
        1,
        (mapping.config.targetDifficulty || 3) - 1
      );
    } else if (ddlClassification.primary_confidence === 'VERY_HIGH') {
      // High confidence - can be more targeted
      // Enhance distractor targeting for specific misconceptions
      mapping.distractorParams.plausibilityRange = { min: 0.5, max: 0.85 };
    }

    // Add supporting evidence to rationale
    if (ddlClassification.supporting_evidence) {
      mapping.rationale += `\n\nSupporting evidence: ${
        ddlClassification.supporting_evidence.for_primary.join('; ')
      }`;
    }

    return mapping;
  }

  /**
   * Get misconceptions to target based on gap type and topic
   */
  getMisconceptionsForGap(
    lacunaType: LacunaType,
    topic: string,
    specialty: string
  ): string[] {
    const misconceptionTypes: Record<LacunaType, string[]> = {
      LE: [
        // Epistemic gaps often involve factual confusion
        'factual_error',
        'outdated_information',
        'similar_name_confusion',
        'reversed_causality',
      ],
      LEm: [
        // Emotional gaps may lead to overthinking
        'overthinking_simple_case',
        'second_guessing_correct_answer',
        'anxiety_induced_errors',
        'time_pressure_mistakes',
      ],
      LIE: [
        // Integration gaps involve connection failures
        'missing_pathophysiology_link',
        'incomplete_differential',
        'isolated_concept_application',
        'failure_to_synthesize',
      ],
      MIXED: [
        // Mixed includes various types
        'factual_error',
        'incomplete_understanding',
        'partial_integration',
      ],
      NONE: [
        // No gap - target expert-level traps
        'nuanced_distinction',
        'edge_case_confusion',
        'overconfidence_trap',
        'expert_blind_spot',
      ],
    };

    return misconceptionTypes[lacunaType] || ['general_misconception'];
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  private thetaToDifficulty(theta: number): number {
    // Map theta (-4 to +4) to difficulty (1 to 5)
    // theta -4 -> difficulty 1
    // theta 0 -> difficulty 3
    // theta +4 -> difficulty 5
    return Math.max(1, Math.min(5, 3 + (theta / 2)));
  }

  private calculateRecentCorrectRate(profile: StudentProfile): number {
    if (!profile.recentPerformance.length) {
      return 0.5; // Default to neutral
    }
    return (
      profile.recentPerformance.reduce((sum, p) => sum + p.correctRate, 0) /
      profile.recentPerformance.length
    );
  }

  private selectBloomLevel(
    preferredLevels: BloomLevel[],
    profile: StudentProfile,
    lacunaType: LacunaType
  ): BloomLevel {
    // Select based on student's current ability and gap type
    const theta = profile.currentTheta;

    if (theta < -1) {
      // Lower ability - focus on lower Bloom levels
      return preferredLevels.find(l =>
        l === BloomLevel.KNOWLEDGE || l === BloomLevel.COMPREHENSION
      ) || preferredLevels[0];
    } else if (theta > 1) {
      // Higher ability - can handle higher Bloom levels
      return preferredLevels.find(l =>
        l === BloomLevel.ANALYSIS || l === BloomLevel.SYNTHESIS || l === BloomLevel.EVALUATION
      ) || preferredLevels[preferredLevels.length - 1];
    }

    // Middle range - use preferred based on gap type
    return preferredLevels[Math.floor(preferredLevels.length / 2)];
  }

  private selectQuestionType(
    preferredTypes: QGenQuestionType[],
    profile: StudentProfile,
    lacunaType: LacunaType
  ): QGenQuestionType {
    // For LEm (emotional), prefer clinical cases as they're more structured
    if (lacunaType === 'LEm') {
      return QGenQuestionType.CLINICAL_CASE;
    }

    // For LIE (integration), prefer complex types
    if (lacunaType === 'LIE') {
      return preferredTypes.find(t =>
        t === QGenQuestionType.CLINICAL_CASE || t === QGenQuestionType.INTERPRETATION
      ) || QGenQuestionType.CLINICAL_CASE;
    }

    // For LE (epistemic), conceptual questions help build foundation
    if (lacunaType === 'LE' && profile.currentTheta < 0) {
      return QGenQuestionType.CONCEPTUAL;
    }

    return preferredTypes[0];
  }

  private selectScenario(
    preferredScenarios: ClinicalScenario[],
    profile: StudentProfile
  ): ClinicalScenario | undefined {
    // Select based on complexity appropriate for student level
    const theta = profile.currentTheta;

    if (theta < -0.5) {
      // Lower ability - simpler scenarios
      return preferredScenarios.find(s =>
        s === ClinicalScenario.OUTPATIENT || s === ClinicalScenario.PRIMARY_CARE
      );
    } else if (theta > 1) {
      // Higher ability - complex scenarios
      return preferredScenarios.find(s =>
        s === ClinicalScenario.EMERGENCY || s === ClinicalScenario.ICU
      );
    }

    return preferredScenarios[0];
  }

  private selectTargetArea(profile: StudentProfile): string {
    // Prioritize weak areas but also maintain distribution
    const weakAreas = profile.learningHistory.weakAreas;

    if (weakAreas.length > 0) {
      // 70% chance to target weak area
      if (Math.random() < 0.7) {
        return weakAreas[Math.floor(Math.random() * weakAreas.length)];
      }
    }

    // Otherwise, select based on ENAMED distribution
    const rand = Math.random();
    let cumulative = 0;
    for (const [area, weight] of Object.entries(ENAMED_DISTRIBUTION)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return area;
      }
    }

    return 'clinica_medica'; // Default fallback
  }

  private getDistractorParamsForGap(
    lacunaType: LacunaType,
    profile: StudentProfile
  ): DistractorSelectionParams {
    const strategy = LACUNA_STRATEGIES[lacunaType];

    // Base plausibility range
    let plausibilityRange = { min: 0.4, max: 0.8 };

    // Adjust based on gap type
    if (lacunaType === 'LEm') {
      // For emotional gaps, avoid overly tricky distractors
      plausibilityRange = { min: 0.3, max: 0.7 };
    } else if (lacunaType === 'NONE') {
      // For no gaps, use more challenging distractors
      plausibilityRange = { min: 0.5, max: 0.9 };
    }

    return {
      targetMisconceptionTypes: this.getMisconceptionsForGap(
        lacunaType,
        '', // Will be filled when generating
        ''
      ),
      plausibilityRange,
      avoidCategories: lacunaType === 'LEm' ? ['anxiety_inducing'] : [],
      preferCategories: strategy.distractorFocus,
    };
  }

  private scoreDistractorForGap(
    distractor: { text: string; type: string; plausibility: number },
    focusTypes: string[],
    lacunaType: LacunaType
  ): number {
    let score = 0;

    // Score based on type match
    if (focusTypes.includes(distractor.type)) {
      score += 2;
    }

    // Score based on plausibility appropriateness
    const targetPlausibility = lacunaType === 'LEm' ? 0.5 : 0.65;
    const plausibilityDiff = Math.abs(distractor.plausibility - targetPlausibility);
    score += 1 - plausibilityDiff;

    return score;
  }

  private refineConfigFromSemanticAnalysis(
    mapping: DDLToQGenMapping,
    ddlResult: DDLFullAnalysisResult
  ): void {
    const { semantic } = ddlResult;

    // If there are specific missing concepts, target those
    if (semantic.concept_analysis.missing_concepts.length > 0) {
      // Could add these as focus topics
      const missingConcepts = semantic.concept_analysis.missing_concepts;
      mapping.rationale += `\nMissing concepts to target: ${missingConcepts.join(', ')}`;
    }

    // If integration gaps were detected
    if (semantic.integration_analysis.integration_score < 0.5) {
      mapping.config.targetQuestionType = QGenQuestionType.CLINICAL_CASE;
      mapping.config.targetBloomLevel = BloomLevel.ANALYSIS;
    }
  }

  private refineConfigFromBehavioralAnalysis(
    mapping: DDLToQGenMapping,
    ddlResult: DDLFullAnalysisResult
  ): void {
    const { behavioral } = ddlResult;

    // High anxiety - reduce complexity
    if (behavioral.anxiety_indicators.behavioral_anxiety_score > 0.7) {
      mapping.difficultyAdjustment.adjustment -= 0.5;
      mapping.difficultyAdjustment.finalDifficulty = Math.max(
        1,
        mapping.difficultyAdjustment.finalDifficulty - 0.5
      );
      mapping.difficultyAdjustment.reason += '; High anxiety detected - reducing difficulty';
    }

    // High revision rate suggests uncertainty
    if (behavioral.revision_pattern.revision_ratio > 0.3) {
      // Focus on clearer, more structured questions
      mapping.config.targetQuestionType = QGenQuestionType.CLINICAL_CASE;
    }
  }

  private incorporateSecondaryType(
    mapping: DDLToQGenMapping,
    secondaryType: LacunaType,
    probability: number
  ): void {
    const secondaryStrategy = LACUNA_STRATEGIES[secondaryType];

    // Blend difficulty adjustment
    mapping.difficultyAdjustment.adjustment =
      mapping.difficultyAdjustment.adjustment * (1 - probability) +
      secondaryStrategy.difficultyModifier * probability;

    // Add secondary focus to distractors
    mapping.distractorParams.preferCategories.push(
      ...secondaryStrategy.distractorFocus.slice(0, 2)
    );

    mapping.rationale += `\nSecondary ${secondaryType} gap (${(probability * 100).toFixed(0)}%) incorporated`;
  }

  private buildRationale(
    lacunaType: LacunaType,
    strategy: typeof LACUNA_STRATEGIES[LacunaType],
    profile: StudentProfile
  ): string {
    const parts = [
      `Lacuna type: ${lacunaType}`,
      `Strategy: ${strategy.description}`,
      `Student theta: ${profile.currentTheta.toFixed(2)}`,
      `Target Bloom levels: ${strategy.bloomLevels.join(', ')}`,
      `Question types: ${strategy.questionTypes.join(', ')}`,
    ];

    if (profile.learningHistory.weakAreas.length > 0) {
      parts.push(`Weak areas: ${profile.learningHistory.weakAreas.join(', ')}`);
    }

    return parts.join('\n');
  }
}

// Export singleton instance
export const ddlIntegrationService = new DDLIntegrationService();
