/**
 * Regional Exams Transformer
 * Applies metadata-based IRT estimation for regional sources
 */

import { estimateIRTFromMetadata } from '../../etl-core/utils/irt';
import { generateDeterministicId } from '../../etl-core/utils/sql';
import { REGIONAL_CONFIG, mapRegionalAreaFromPosition, getSourceConfig } from './config';
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

export interface ParsedExam {
  sourceId: 'amrigs' | 'surce' | 'susSp';
  year: number;
  questions: RawQuestion[];
}

export class RegionalTransformer {
  /**
   * Transform parsed regional questions to complete questions with IRT parameters
   */
  transformQuestions(allExams: ParsedExam[]): CompleteQuestions {
    const completeQuestions: CompleteQuestion[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const exam of allExams) {
      for (const q of exam.questions) {
        try {
          const completeQ = this.transformQuestion(q, exam.year, exam.sourceId);
          completeQuestions.push(completeQ);
          successCount++;
        } catch (err) {
          console.warn(
            `  ⚠️  Failed to transform ${exam.sourceId} ${exam.year} Q${q.number}: ${err}`
          );
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
  private transformQuestion(
    q: RawQuestion,
    year: number,
    sourceId: 'amrigs' | 'surce' | 'susSp'
  ): CompleteQuestion {
    const position = q.number;
    const sourceConfig = getSourceConfig(sourceId);
    const area = mapRegionalAreaFromPosition(position);

    // Build metadata for IRT estimation
    const metadata: QuestionMetadata = {
      institution: sourceConfig.institution,
      institutionTier: sourceConfig.institutionTier,
      year,
      examType: sourceConfig.examType,
      questionPosition: position,
      totalQuestionsInExam: 100,
      area,
      optionCount: 5,
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
      id: generateDeterministicId(`regional-${sourceId}`, year, position),
      bankId: `regional-${sourceId}-${year}`,
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
        institution: sourceConfig.institution,
        institutionTier: sourceConfig.institutionTier,
        examType: sourceConfig.examType,
        questionPosition: position,
        totalQuestionsInExam: 100,
        optionCount: 5,
        source: `regional-${sourceId}`,
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
