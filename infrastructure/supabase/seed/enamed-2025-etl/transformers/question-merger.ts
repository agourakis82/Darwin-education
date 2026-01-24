/**
 * Question Merger
 * Merges scraped PDF content with IRT parameters from microdata
 */

import { v4 as uuidv4 } from 'crypto';
import { QUESTION_BANK_CONFIG } from '../config';
import type {
  ExtractedQuestion,
  ProcessedItemParameters,
  CompleteQuestion,
  ENAMEDArea,
} from '../types';
import { answerToIndex } from '../scrapers/pdf-parser';
import { inferAreaFromPosition } from './area-mapper';

/**
 * Generate a deterministic question ID
 */
function generateQuestionId(
  year: number,
  caderno: number,
  itemNumber: number
): string {
  // Use a consistent format for reproducibility
  const paddedItem = itemNumber.toString().padStart(3, '0');
  return `q-enamed-${year}-c${caderno}-${paddedItem}`;
}

/**
 * Match scraped questions with IRT parameters
 */
export function matchQuestionsWithIRT(
  questions: ExtractedQuestion[],
  irtParams: ProcessedItemParameters[]
): Map<number, { question: ExtractedQuestion; irt: ProcessedItemParameters }> {
  const matched = new Map<
    number,
    { question: ExtractedQuestion; irt: ProcessedItemParameters }
  >();

  // Create lookup map for IRT params by question number
  const irtByNumber = new Map<number, ProcessedItemParameters>();
  for (const param of irtParams) {
    irtByNumber.set(param.NU_ITEM_PROVA_1, param);
    // Also index by alternate numbering if different
    if (param.NU_ITEM_PROVA_2 !== param.NU_ITEM_PROVA_1) {
      irtByNumber.set(param.NU_ITEM_PROVA_2, param);
    }
  }

  // Match each question
  for (const question of questions) {
    const irt = irtByNumber.get(question.itemNumber);
    if (irt && irt.ITEM_MANTIDO === 1) {
      matched.set(question.itemNumber, { question, irt });
    }
  }

  return matched;
}

/**
 * Create a complete question from merged data
 */
export function createCompleteQuestion(
  question: ExtractedQuestion,
  irt: ProcessedItemParameters,
  areaOverride?: ENAMEDArea
): CompleteQuestion | null {
  // Validate required fields
  if (
    !question.correctAnswer ||
    question.options.length !== 4 ||
    irt.PARAMETRO_B === null
  ) {
    return null;
  }

  const correctIndex = answerToIndex(question.correctAnswer);
  const area = areaOverride || inferAreaFromPosition(question.itemNumber);

  return {
    id: generateQuestionId(2025, question.caderno, question.itemNumber),
    bankId: QUESTION_BANK_CONFIG.id,

    // Content from PDF
    stem: question.stem,
    options: question.options,
    correctIndex,
    explanation: undefined, // Would need manual addition

    // IRT parameters from microdata
    irt: {
      difficulty: irt.PARAMETRO_B,
      discrimination: irt.estimatedDiscrimination,
      guessing: irt.guessing,
      infit: irt.INFIT,
      outfit: irt.OUTFIT,
    },

    // Classification
    area,
    year: 2025,

    // Metadata
    examVersion: question.caderno,
    originalItemNumber: question.itemNumber,
    validatedBy: 'expert',
  };
}

/**
 * Merge all questions from both exam versions
 */
export function mergeAllQuestions(
  caderno1Questions: ExtractedQuestion[],
  caderno2Questions: ExtractedQuestion[],
  irtParams: ProcessedItemParameters[]
): {
  questions: CompleteQuestion[];
  unmatched: number[];
  warnings: string[];
} {
  const completeQuestions: CompleteQuestion[] = [];
  const unmatched: number[] = [];
  const warnings: string[] = [];

  // Create IRT lookup
  const irtByNumber1 = new Map<number, ProcessedItemParameters>();
  const irtByNumber2 = new Map<number, ProcessedItemParameters>();

  for (const param of irtParams) {
    irtByNumber1.set(param.NU_ITEM_PROVA_1, param);
    irtByNumber2.set(param.NU_ITEM_PROVA_2, param);
  }

  // Process caderno 1
  for (const question of caderno1Questions) {
    const irt = irtByNumber1.get(question.itemNumber);

    if (!irt) {
      unmatched.push(question.itemNumber);
      warnings.push(
        `Caderno 1, Q${question.itemNumber}: No IRT parameters found`
      );
      continue;
    }

    if (irt.ITEM_MANTIDO !== 1) {
      warnings.push(
        `Caderno 1, Q${question.itemNumber}: Item excluded from analysis`
      );
      continue;
    }

    const complete = createCompleteQuestion(question, irt);
    if (complete) {
      completeQuestions.push(complete);
    } else {
      warnings.push(
        `Caderno 1, Q${question.itemNumber}: Failed to create complete question`
      );
    }
  }

  // Process caderno 2 (only if different from caderno 1)
  // Note: ENAMED typically has two versions with different question ordering
  // For now, we prioritize caderno 1 and only add unique questions from caderno 2
  const existingNumbers = new Set(
    completeQuestions.map((q) => q.originalItemNumber)
  );

  for (const question of caderno2Questions) {
    // Use NU_ITEM_PROVA_2 mapping for caderno 2
    const irt = irtByNumber2.get(question.itemNumber);

    if (!irt) {
      continue; // Already counted in caderno 1 processing
    }

    // Skip if we already have this question from caderno 1
    if (existingNumbers.has(irt.NU_ITEM_PROVA_1)) {
      continue;
    }

    if (irt.ITEM_MANTIDO !== 1) {
      continue;
    }

    const complete = createCompleteQuestion(question, irt);
    if (complete) {
      complete.id = generateQuestionId(2025, 2, question.itemNumber);
      completeQuestions.push(complete);
    }
  }

  // Sort by original item number
  completeQuestions.sort((a, b) => a.originalItemNumber - b.originalItemNumber);

  return {
    questions: completeQuestions,
    unmatched,
    warnings,
  };
}

/**
 * Create placeholder questions for items without scraped content
 * Useful when PDF parsing fails but we still want IRT data
 */
export function createPlaceholderQuestions(
  irtParams: ProcessedItemParameters[],
  existingItemNumbers: Set<number>
): CompleteQuestion[] {
  const placeholders: CompleteQuestion[] = [];

  for (const irt of irtParams) {
    if (irt.ITEM_MANTIDO !== 1) continue;
    if (existingItemNumbers.has(irt.NU_ITEM_PROVA_1)) continue;
    if (irt.PARAMETRO_B === null) continue;

    const itemNumber = irt.NU_ITEM_PROVA_1;

    placeholders.push({
      id: generateQuestionId(2025, 1, itemNumber),
      bankId: QUESTION_BANK_CONFIG.id,

      // Placeholder content
      stem: `[Questão ${itemNumber} - Conteúdo pendente de extração do PDF]`,
      options: [
        { letter: 'A', text: '[Opção A]' },
        { letter: 'B', text: '[Opção B]' },
        { letter: 'C', text: '[Opção C]' },
        { letter: 'D', text: '[Opção D]' },
      ],
      correctIndex: 0, // Will need manual correction
      explanation: undefined,

      // IRT parameters (these are valid)
      irt: {
        difficulty: irt.PARAMETRO_B,
        discrimination: irt.estimatedDiscrimination,
        guessing: irt.guessing,
        infit: irt.INFIT,
        outfit: irt.OUTFIT,
      },

      area: inferAreaFromPosition(itemNumber),
      year: 2025,
      examVersion: 1,
      originalItemNumber: itemNumber,
      validatedBy: 'expert',
    });
  }

  return placeholders;
}

/**
 * Get merge statistics
 */
export function getMergeStatistics(
  questions: CompleteQuestion[],
  irtParams: ProcessedItemParameters[]
): {
  totalIRT: number;
  validIRT: number;
  merged: number;
  coverage: number;
  byArea: Record<ENAMEDArea, number>;
  byCaderno: Record<number, number>;
} {
  const validIRT = irtParams.filter((p) => p.ITEM_MANTIDO === 1).length;

  const byArea: Record<ENAMEDArea, number> = {
    clinica_medica: 0,
    cirurgia: 0,
    pediatria: 0,
    ginecologia_obstetricia: 0,
    saude_coletiva: 0,
  };

  const byCaderno: Record<number, number> = { 1: 0, 2: 0 };

  for (const q of questions) {
    byArea[q.area]++;
    byCaderno[q.examVersion]++;
  }

  return {
    totalIRT: irtParams.length,
    validIRT,
    merged: questions.length,
    coverage: questions.length / validIRT,
    byArea,
    byCaderno,
  };
}
