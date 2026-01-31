/**
 * Question Generator
 * ==================
 *
 * Automatic generation of ENAMED-style questions using:
 * - Schema.org medical ontology
 * - ENAMED question patterns
 * - Portuguese clinical vignette templates
 * - IRT parameter estimation
 *
 * @module packages/shared/src/generators/question-generator
 */

import {
  MedicalCondition,
  Drug,
  MedicalOntology,
  QuestionPatternType,
  GeneratedQuestion,
  OntologyReference,
} from '../types/schema-medical';
import { ENAMEDArea } from '../types/education';
import {
  TemplateEngine,
  TemplateContext,
  generateAge,
  generateSex,
  generateDuration,
} from './template-engine';
import { QuestionPattern, selectPattern } from '../analyzers/question-patterns';

// ============================================
// Types
// ============================================

/**
 * Configuration for question generation
 */
export interface QuestionGeneratorConfig {
  targetDifficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil';
  targetArea: ENAMEDArea;
  patternType?: QuestionPatternType;
  language: 'pt' | 'en';
  distractorCount: number;
}

/**
 * Difficulty to IRT parameter mapping
 */
const DIFFICULTY_TO_IRT: Record<string, [number, number]> = {
  muito_facil: [-2.0, -0.5],
  facil: [-0.5, 0.5],
  medio: [0.5, 1.2],
  dificil: [1.2, 2.0],
  muito_dificil: [2.0, 3.0],
};

// ============================================
// Question Generator
// ============================================

/**
 * Main question generator class
 */
export class QuestionGenerator {
  private ontology: MedicalOntology;
  private templateEngine: TemplateEngine;

  constructor(ontology: MedicalOntology) {
    this.ontology = ontology;
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Generate a question based on configuration
   */
  async generateQuestion(
    config: QuestionGeneratorConfig
  ): Promise<GeneratedQuestion | null> {
    // Select appropriate question pattern
    const difficultyRange = DIFFICULTY_TO_IRT[config.targetDifficulty];
    const targetDifficulty = (difficultyRange[0] + difficultyRange[1]) / 2;

    const pattern = selectPattern(config.targetArea, targetDifficulty);
    if (!pattern) {
      console.warn(`No suitable pattern found for area ${config.targetArea}`);
      return null;
    }

    // Generate question based on pattern type
    switch (pattern.pattern) {
      case 'clinical_vignette_diagnosis':
        return this.generateDiagnosisQuestion(config, pattern);

      case 'clinical_vignette_treatment':
        return this.generateTreatmentQuestion(config, pattern);

      case 'clinical_vignette_workup':
        return this.generateWorkupQuestion(config, pattern);

      case 'mechanism_action':
        return this.generateMechanismQuestion(config, pattern);

      case 'differential_diagnosis':
        return this.generateDifferentialQuestion(config, pattern);

      case 'epidemiology':
        return this.generateEpidemiologyQuestion(config, pattern);

      default:
        console.warn(`Unsupported pattern type: ${pattern.pattern}`);
        return null;
    }
  }

  /**
   * Generate diagnosis question
   */
  private async generateDiagnosisQuestion(
    config: QuestionGeneratorConfig,
    pattern: QuestionPattern
  ): Promise<GeneratedQuestion | null> {
    // Select a condition from the ontology
    const conditions = Array.from(this.ontology.conditions.values());
    if (conditions.length === 0) return null;

    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    // Build template context
    const context: TemplateContext = {
      age: generateAge(config.targetArea),
      sex: generateSex(),
      conditionName: condition.name,
      chiefComplaint: this.getChiefComplaint(condition),
      duration: generateDuration(),
      physicalFindings: this.getPhysicalFindings(condition),
      labFindings: this.getLabFindings(condition),
    };

    // Generate stem
    const stem = this.templateEngine.generateStem(
      'clinical_vignette_diagnosis',
      context,
      'basic'
    );

    if (!stem) return null;

    // Generate options (correct answer + distractors)
    const correctAnswer = condition.name;
    const distractors = await this.generateDistractors(
      condition,
      config.distractorCount
    );

    const options = this.shuffleOptions(correctAnswer, distractors);
    const correctIndex = options.indexOf(correctAnswer);

    // Generate explanation
    const explanation = this.generateExplanation(condition, context);

    // Estimate IRT parameters
    const difficultyRange = DIFFICULTY_TO_IRT[config.targetDifficulty];
    const estimatedDifficulty =
      difficultyRange[0] + Math.random() * (difficultyRange[1] - difficultyRange[0]);
    const estimatedDiscrimination = 1.0 + Math.random() * 0.8; // 1.0-1.8

    // Create ontology references
    const ontologyRefs: OntologyReference[] = [
      {
        entityId: condition.id,
        entityType: 'MedicalCondition',
        role: 'correct_answer',
        codes: condition.code,
      },
    ];

    return {
      stem,
      options,
      correctIndex,
      explanation,
      pattern: 'clinical_vignette_diagnosis',
      ontologyRefs,
      estimatedDifficulty,
      estimatedDiscrimination,
      status: 'draft',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate treatment question
   */
  private async generateTreatmentQuestion(
    config: QuestionGeneratorConfig,
    pattern: QuestionPattern
  ): Promise<GeneratedQuestion | null> {
    // Select a condition
    const conditions = Array.from(this.ontology.conditions.values());
    if (conditions.length === 0) return null;

    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    // Try to find a drug that treats this condition
    let correctDrug: Drug | null = null;
    if (condition.drug && condition.drug.length > 0) {
      correctDrug = condition.drug[0];
    } else {
      // Fallback: select any drug
      const drugs = Array.from(this.ontology.drugs.values());
      if (drugs.length > 0) {
        correctDrug = drugs[Math.floor(Math.random() * drugs.length)];
      }
    }

    if (!correctDrug) return null;

    // Build context
    const context: TemplateContext = {
      age: generateAge(config.targetArea),
      sex: generateSex(),
      conditionName: condition.name,
      additionalContext: this.getAdditionalContext(condition),
    };

    const stem = this.templateEngine.generateStem(
      'clinical_vignette_treatment',
      context
    );

    if (!stem) return null;

    // Generate options
    const correctAnswer = correctDrug.name;
    const distractors = await this.generateDrugDistractors(
      correctDrug,
      config.distractorCount
    );

    const options = this.shuffleOptions(correctAnswer, distractors);
    const correctIndex = options.indexOf(correctAnswer);

    const explanation = `${correctDrug.name} é o tratamento de primeira linha para ${condition.name}.`;

    const difficultyRange = DIFFICULTY_TO_IRT[config.targetDifficulty];
    const estimatedDifficulty =
      difficultyRange[0] + Math.random() * (difficultyRange[1] - difficultyRange[0]);
    const estimatedDiscrimination = 1.1 + Math.random() * 0.9;

    return {
      stem,
      options,
      correctIndex,
      explanation,
      pattern: 'clinical_vignette_treatment',
      ontologyRefs: [
        {
          entityId: condition.id,
          entityType: 'MedicalCondition',
          role: 'subject',
        },
        {
          entityId: correctDrug.id,
          entityType: 'Drug',
          role: 'correct_answer',
        },
      ],
      estimatedDifficulty,
      estimatedDiscrimination,
      status: 'draft',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate workup/diagnostic test question
   */
  private async generateWorkupQuestion(
    config: QuestionGeneratorConfig,
    pattern: QuestionPattern
  ): Promise<GeneratedQuestion | null> {
    const conditions = Array.from(this.ontology.conditions.values());
    if (conditions.length === 0) return null;

    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const context: TemplateContext = {
      conditionName: condition.name,
    };

    const stem = this.templateEngine.generateStem('clinical_vignette_workup', context);
    if (!stem) return null;

    // Use typical test if available
    const correctAnswer =
      condition.typicalTest && condition.typicalTest.length > 0
        ? condition.typicalTest[0].name
        : 'Exame laboratorial específico';

    const distractors = this.generateTestDistractors(config.distractorCount);

    const options = this.shuffleOptions(correctAnswer, distractors);
    const correctIndex = options.indexOf(correctAnswer);

    const explanation = `${correctAnswer} é o exame diagnóstico de escolha para ${condition.name}.`;

    const difficultyRange = DIFFICULTY_TO_IRT[config.targetDifficulty];
    const estimatedDifficulty =
      difficultyRange[0] + Math.random() * (difficultyRange[1] - difficultyRange[0]);

    return {
      stem,
      options,
      correctIndex,
      explanation,
      pattern: 'clinical_vignette_workup',
      ontologyRefs: [{ entityId: condition.id, entityType: 'MedicalCondition', role: 'subject' }],
      estimatedDifficulty,
      estimatedDiscrimination: 1.0 + Math.random() * 0.6,
      status: 'draft',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate mechanism of action question
   */
  private async generateMechanismQuestion(
    config: QuestionGeneratorConfig,
    pattern: QuestionPattern
  ): Promise<GeneratedQuestion | null> {
    const drugs = Array.from(this.ontology.drugs.values());
    if (drugs.length === 0) return null;

    const drug = drugs[Math.floor(Math.random() * drugs.length)];

    const context: TemplateContext = {
      medicationName: drug.name,
    };

    const stem = this.templateEngine.generateStem('mechanism_action', context);
    if (!stem) return null;

    const correctAnswer = drug.mechanismOfAction || 'Mecanismo específico';
    const distractors = this.generateMechanismDistractors(config.distractorCount);

    const options = this.shuffleOptions(correctAnswer, distractors);
    const correctIndex = options.indexOf(correctAnswer);

    const explanation = `${drug.name} atua por meio de: ${correctAnswer}`;

    const difficultyRange = DIFFICULTY_TO_IRT[config.targetDifficulty];
    const estimatedDifficulty =
      difficultyRange[0] + Math.random() * (difficultyRange[1] - difficultyRange[0]);

    return {
      stem,
      options,
      correctIndex,
      explanation,
      pattern: 'mechanism_action',
      ontologyRefs: [{ entityId: drug.id, entityType: 'Drug', role: 'subject' }],
      estimatedDifficulty,
      estimatedDiscrimination: 0.9 + Math.random() * 0.6,
      status: 'draft',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate differential diagnosis question
   */
  private async generateDifferentialQuestion(
    config: QuestionGeneratorConfig,
    pattern: QuestionPattern
  ): Promise<GeneratedQuestion | null> {
    const conditions = Array.from(this.ontology.conditions.values());
    if (conditions.length < 2) return null;

    const conditionA = conditions[Math.floor(Math.random() * conditions.length)];
    let conditionB = conditions[Math.floor(Math.random() * conditions.length)];

    // Ensure different conditions
    while (conditionB.id === conditionA.id) {
      conditionB = conditions[Math.floor(Math.random() * conditions.length)];
    }

    const context: TemplateContext = {
      chiefComplaint: this.getChiefComplaint(conditionA),
      conditionA: conditionA.name,
      conditionB: conditionB.name,
    };

    const stem = this.templateEngine.generateStem('differential_diagnosis', context);
    if (!stem) return null;

    const correctAnswer = `Achado específico de ${conditionA.name}`;
    const distractors = [
      `Achado inespecífico`,
      `Achado específico de ${conditionB.name}`,
      `Achado não discriminatório`,
    ];

    const options = this.shuffleOptions(correctAnswer, distractors);
    const correctIndex = options.indexOf(correctAnswer);

    const explanation = `${correctAnswer} ajuda a distinguir entre as duas condições.`;

    const difficultyRange = DIFFICULTY_TO_IRT[config.targetDifficulty];
    const estimatedDifficulty =
      difficultyRange[0] + Math.random() * (difficultyRange[1] - difficultyRange[0]);

    return {
      stem,
      options,
      correctIndex,
      explanation,
      pattern: 'differential_diagnosis',
      ontologyRefs: [
        { entityId: conditionA.id, entityType: 'MedicalCondition', role: 'subject' },
        { entityId: conditionB.id, entityType: 'MedicalCondition', role: 'context' },
      ],
      estimatedDifficulty,
      estimatedDiscrimination: 1.2 + Math.random() * 1.0,
      status: 'draft',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate epidemiology question
   */
  private async generateEpidemiologyQuestion(
    config: QuestionGeneratorConfig,
    pattern: QuestionPattern
  ): Promise<GeneratedQuestion | null> {
    const conditions = Array.from(this.ontology.conditions.values());
    if (conditions.length === 0) return null;

    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const context: TemplateContext = {
      conditionName: condition.name,
    };

    const stem = this.templateEngine.generateStem('epidemiology', context, 'basic');
    if (!stem) return null;

    // Use risk factors if available
    const correctAnswer =
      condition.riskFactor && condition.riskFactor.length > 0
        ? condition.riskFactor[0].name
        : 'Fator de risco principal';

    const distractors = this.generateRiskFactorDistractors(config.distractorCount);

    const options = this.shuffleOptions(correctAnswer, distractors);
    const correctIndex = options.indexOf(correctAnswer);

    const explanation = `${correctAnswer} é o principal fator de risco para ${condition.name}.`;

    const difficultyRange = DIFFICULTY_TO_IRT[config.targetDifficulty];
    const estimatedDifficulty =
      difficultyRange[0] + Math.random() * (difficultyRange[1] - difficultyRange[0]);

    return {
      stem,
      options,
      correctIndex,
      explanation,
      pattern: 'epidemiology',
      ontologyRefs: [{ entityId: condition.id, entityType: 'MedicalCondition', role: 'subject' }],
      estimatedDifficulty,
      estimatedDiscrimination: 0.8 + Math.random() * 0.6,
      status: 'draft',
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getChiefComplaint(condition: MedicalCondition): string {
    if (condition.signOrSymptom && condition.signOrSymptom.length > 0) {
      return condition.signOrSymptom[0].name;
    }
    return 'sintomas característicos';
  }

  private getPhysicalFindings(condition: MedicalCondition): string[] {
    if (condition.signOrSymptom && condition.signOrSymptom.length > 1) {
      return [condition.signOrSymptom[1].name];
    }
    return ['achados ao exame físico'];
  }

  private getLabFindings(condition: MedicalCondition): string[] {
    if (condition.typicalTest && condition.typicalTest.length > 0) {
      return [`${condition.typicalTest[0].name}: alterado`];
    }
    return ['exames laboratoriais alterados'];
  }

  private getAdditionalContext(condition: MedicalCondition): string {
    return `Sem contraindicações ao tratamento padrão`;
  }

  private generateExplanation(condition: MedicalCondition, context: TemplateContext): string {
    return `O quadro clínico apresentado é característico de ${condition.name}. ` +
      `Os achados de ${context.chiefComplaint} associados a ${context.physicalFindings} ` +
      `são típicos desta condição.`;
  }

  private async generateDistractors(condition: MedicalCondition, count: number): Promise<string[]> {
    // Get all conditions except the correct one
    const otherConditions = Array.from(this.ontology.conditions.values()).filter(
      c => c.id !== condition.id
    );

    // Randomly select distractors
    const distractors: string[] = [];
    for (let i = 0; i < count && i < otherConditions.length; i++) {
      const randomIndex = Math.floor(Math.random() * otherConditions.length);
      distractors.push(otherConditions[randomIndex].name);
      otherConditions.splice(randomIndex, 1);
    }

    return distractors;
  }

  private async generateDrugDistractors(drug: Drug, count: number): Promise<string[]> {
    const otherDrugs = Array.from(this.ontology.drugs.values()).filter(d => d.id !== drug.id);

    const distractors: string[] = [];
    for (let i = 0; i < count && i < otherDrugs.length; i++) {
      const randomIndex = Math.floor(Math.random() * otherDrugs.length);
      distractors.push(otherDrugs[randomIndex].name);
      otherDrugs.splice(randomIndex, 1);
    }

    return distractors;
  }

  private generateTestDistractors(count: number): string[] {
    const commonTests = [
      'Hemograma completo',
      'Radiografia de tórax',
      'Ultrassonografia abdominal',
      'Tomografia computadorizada',
      'Ressonância magnética',
      'Eletrocardiograma',
    ];

    const distractors: string[] = [];
    for (let i = 0; i < count && i < commonTests.length; i++) {
      distractors.push(commonTests[i]);
    }

    return distractors;
  }

  private generateMechanismDistractors(count: number): string[] {
    return [
      'Inibição enzimática específica',
      'Bloqueio de receptores',
      'Agonismo de receptores',
      'Modulação de canais iônicos',
    ].slice(0, count);
  }

  private generateRiskFactorDistractors(count: number): string[] {
    return [
      'Tabagismo',
      'Obesidade',
      'Hipertensão arterial',
      'Diabetes mellitus',
      'Sedentarismo',
    ].slice(0, count);
  }

  private shuffleOptions(correctAnswer: string, distractors: string[]): string[] {
    const options = [correctAnswer, ...distractors];

    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return options;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a single question
 */
export async function generateQuestion(
  ontology: MedicalOntology,
  config: QuestionGeneratorConfig
): Promise<GeneratedQuestion | null> {
  const generator = new QuestionGenerator(ontology);
  return generator.generateQuestion(config);
}

/**
 * Generate multiple questions
 */
export async function generateQuestions(
  ontology: MedicalOntology,
  configs: QuestionGeneratorConfig[]
): Promise<GeneratedQuestion[]> {
  const generator = new QuestionGenerator(ontology);
  const questions: GeneratedQuestion[] = [];

  for (const config of configs) {
    const question = await generator.generateQuestion(config);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}
