/**
 * REVALIDA Transformer
 * Applies metadata-based IRT estimation with lower confidence for area classification
 */

import { estimateIRTFromMetadata } from '../../etl-core/utils/irt';
import { generateDeterministicId } from '../../etl-core/utils/sql';
import { REVALIDA_CONFIG, mapREVALIDAAreaFromPosition } from './config';
import type { CompleteQuestion, CompleteQuestions } from '../../etl-core/types/plugin';
import type { QuestionMetadata } from '../../etl-core/utils/irt';

export interface RawQuestion {
  number: number;
  stem: string;
  options: Array<{ letter: string; text: string }>;
  correctAnswer?: string;
  metadata?: {
    source?: string;
    year?: number;
    area?: string;
  };
}

export class REVALIDATransformer {
  /**
   * Transform parsed REVALIDA questions to complete questions with IRT parameters
   * Flags questions with uncertain area classification for manual review
   */
  transformQuestions(allQuestions: Map<number, RawQuestion[]>): CompleteQuestions {
    const completeQuestions: CompleteQuestion[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const [year, yearQuestions] of allQuestions) {
      for (const q of yearQuestions) {
        try {
          const completeQ = this.transformQuestion(q, year);
          completeQuestions.push(completeQ);
          successCount++;
        } catch (err) {
          console.warn(`  ⚠️  Failed to transform REVALIDA ${year} Q${q.number}: ${err}`);
          failureCount++;
        }
      }
    }

    return {
      questions: completeQuestions,
      validationStats: {
        totalProcessed: completeQuestions.length + failureCount,
        successCount,
        failureCount,
        issues: [
          'REVALIDA area classification is estimated and may be inaccurate',
          'Manual review recommended for all questions',
        ],
      },
    };
  }

  /**
   * Transform single question with metadata-based IRT estimation
   * Uses lower confidence due to uncertain area classification
   */
  private transformQuestion(q: RawQuestion, year: number): CompleteQuestion {
    const position = q.number;
    const area = mapREVALIDAAreaFromPosition(position);

    // Build metadata for IRT estimation
    const metadata: QuestionMetadata = {
      institution: REVALIDA_CONFIG.institution,
      institutionTier: REVALIDA_CONFIG.institutionTier,
      year,
      examType: REVALIDA_CONFIG.examType,
      questionPosition: position,
      totalQuestionsInExam: 80, // Only 80 objective questions
      area,
      optionCount: REVALIDA_CONFIG.optionCount,
    };

    // Estimate IRT parameters from metadata
    const irtEstimation = estimateIRTFromMetadata(metadata);

    // REVALIDA area classification is uncertain, so reduce confidence
    // and mark for manual review
    const adjustedConfidence = Math.max(0.3, irtEstimation.confidence * 0.6);

    // Find correct answer index
    let correctIndex = 0;
    if (q.correctAnswer) {
      const answerLetterIndex = q.options.findIndex(
        (opt) => opt.letter === q.correctAnswer
      );
      if (answerLetterIndex !== -1) {
        correctIndex = answerLetterIndex;
      }
    }

    return {
      id: generateDeterministicId('revalida', year, position),
      bankId: `revalida-${year}`,
      stem: q.stem,
      options: q.options.map((opt) => ({
        letter: opt.letter,
        text: opt.text,
        feedback: '',
      })),
      correctIndex,
      area,
      year,
      metadata: {
        institution: REVALIDA_CONFIG.institution,
        institutionTier: REVALIDA_CONFIG.institutionTier,
        examType: REVALIDA_CONFIG.examType,
        questionPosition: position,
        totalQuestionsInExam: 80,
        optionCount: REVALIDA_CONFIG.optionCount,
        source: 'revalida-inep',
      },
      irt: {
        difficulty: irtEstimation.difficulty,
        discrimination: irtEstimation.discrimination,
        guessing: irtEstimation.guessing,
        infit: undefined,
        outfit: undefined,
        estimated: true,
        confidence: adjustedConfidence,
        method: 'metadata',
      },
    };
  }
}
