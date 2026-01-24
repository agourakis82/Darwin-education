/**
 * USP/UNIFESP Transformer
 * Applies metadata-based IRT estimation, handles specialty-specific exams
 */

import { estimateIRTFromMetadata } from '../../etl-core/utils/irt';
import { generateDeterministicId } from '../../etl-core/utils/sql';
import { USP_CONFIG, mapUSPAreaFromPosition } from './config';
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

export interface USPParsedExam {
  year: number;
  title: string;
  questions: RawQuestion[];
}

export class USPTransformer {
  /**
   * Transform parsed USP/UNIFESP questions to complete questions with IRT parameters
   */
  transformQuestions(allExams: USPParsedExam[]): CompleteQuestions {
    const completeQuestions: CompleteQuestion[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const exam of allExams) {
      for (const q of exam.questions) {
        try {
          const completeQ = this.transformQuestion(q, exam.year, exam.title);
          completeQuestions.push(completeQ);
          successCount++;
        } catch (err) {
          console.warn(`  ⚠️  Failed to transform USP ${exam.year} Q${q.number}: ${err}`);
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
   * Handles specialty-specific exams where all questions map to one area
   */
  private transformQuestion(
    q: RawQuestion,
    year: number,
    examTitle: string
  ): CompleteQuestion {
    const position = q.number;

    // Determine area - check if specialty-specific exam
    let area = mapUSPAreaFromPosition(position, examTitle);

    // Build metadata for IRT estimation
    const metadata: QuestionMetadata = {
      institution: USP_CONFIG.institution,
      institutionTier: USP_CONFIG.institutionTier,
      year,
      examType: USP_CONFIG.examType,
      questionPosition: position,
      totalQuestionsInExam: 100,
      area,
      optionCount: USP_CONFIG.optionCount,
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
      id: generateDeterministicId('usp-fuvest', year, position),
      bankId: `usp-fuvest-${year}`,
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
        institution: USP_CONFIG.institution,
        institutionTier: USP_CONFIG.institutionTier,
        examType: USP_CONFIG.examType,
        questionPosition: position,
        totalQuestionsInExam: 100,
        optionCount: USP_CONFIG.optionCount,
        source: 'usp-fuvest',
      },
      irt: {
        difficulty: irtEstimation.difficulty,
        discrimination: irtEstimation.discrimination,
        guessing: irtEstimation.guessing,
        infit: undefined,
        outfit: undefined,
        estimated: true,
        confidence: irtEstimation.confidence,
        method: 'metadata',
      },
    };
  }
}
