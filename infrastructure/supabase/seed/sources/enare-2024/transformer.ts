/**
 * ENARE Transformer
 * Applies metadata-based IRT estimation to parsed questions
 */

import { estimateIRTFromMetadata } from '../../etl-core/utils/irt';
import { generateDeterministicId } from '../../etl-core/utils/sql';
import { ENARE_CONFIG } from './config';
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
    difficulty?: number;
    area?: string;
  };
}

export class ENARETransformer {
  /**
   * Transform parsed ENARE questions to complete questions with IRT parameters
   */
  transformQuestions(
    allQuestions: Map<number, RawQuestion[]>
  ): CompleteQuestions {
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
          console.warn(`  ⚠️  Failed to transform ENARE ${year} Q${q.number}: ${err}`);
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
        issues: [],
      },
    };
  }

  /**
   * Transform single question with metadata-based IRT estimation
   */
  private transformQuestion(q: RawQuestion, year: number): CompleteQuestion {
    const position = q.number;

    // Build metadata for IRT estimation
    const metadata: QuestionMetadata = {
      institution: ENARE_CONFIG.institution,
      institutionTier: ENARE_CONFIG.institutionTier,
      year,
      examType: ENARE_CONFIG.examType,
      questionPosition: position,
      totalQuestionsInExam: 100,
      area: q.metadata?.area || 'clinica_medica',
      optionCount: ENARE_CONFIG.optionCount,
    };

    // Estimate IRT parameters from metadata
    const irtEstimation = estimateIRTFromMetadata(metadata);

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
      id: generateDeterministicId('enare-2024', year, position),
      bankId: `enare-${year}`,
      stem: q.stem,
      options: q.options.map((opt) => ({
        letter: opt.letter,
        text: opt.text,
        feedback: '',
      })),
      correctIndex,
      area: q.metadata?.area || 'clinica_medica',
      year,
      metadata: {
        institution: ENARE_CONFIG.institution,
        institutionTier: ENARE_CONFIG.institutionTier,
        examType: ENARE_CONFIG.examType,
        questionPosition: position,
        totalQuestionsInExam: 100,
        optionCount: ENARE_CONFIG.optionCount,
        source: 'enare-fgv',
      },
      irt: {
        difficulty: irtEstimation.difficulty,
        discrimination: irtEstimation.discrimination,
        guessing: irtEstimation.guessing,
        infit: undefined, // Not available for ENARE
        outfit: undefined, // Not available for ENARE
        estimated: true,
        confidence: irtEstimation.confidence,
        method: 'metadata',
      },
    };
  }
}
