/**
 * REVALIDA PDF Parser
 * Extracts objective questions from REVALIDA PDF (skips discursive portion)
 */

import { extractPDFText, extractQuestionsFromText, extractAnswerKey, extractOptions } from '../../etl-core/utils/pdf';
import { REVALIDA_CONFIG, mapREVALIDAAreaFromPosition } from './config';
import type { RawQuestion } from '../../etl-core/types/plugin';

export interface ParsedREVALIDAExam {
  year: number;
  questions: RawQuestion[];
  answerKey: Map<number, string>;
  parseStats: {
    totalExtracted: number;
    successCount: number;
    failureCount: number;
    warnings: string[];
  };
}

export class REVALIDAParser {
  /**
   * Parse REVALIDA PDF and extract objective questions only
   */
  async parsePDF(pdfBuffer: Buffer, year: number): Promise<ParsedREVALIDAExam> {
    console.log(`  📖 Parsing REVALIDA ${year} PDF...`);

    let pdfText = '';
    try {
      pdfText = await extractPDFText(pdfBuffer);
    } catch (err) {
      console.warn(`  ⚠️  Failed to extract text from PDF: ${err}`);
      return this.createEmptyResult(year);
    }

    if (!pdfText || pdfText.trim().length === 0) {
      console.warn(`  ⚠️  PDF text extraction returned empty`);
      return this.createEmptyResult(year);
    }

    // Extract all questions using standard patterns
    const extractedQuestions = await extractQuestionsFromText(pdfText);
    const answerKey = extractAnswerKey(pdfText);

    // Filter to only objective questions (1-80), skip discursive (81-100)
    const questions: RawQuestion[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < extractedQuestions.length; i++) {
      const questionNumber = i + 1;

      // Skip discursive portion (REVALIDA has 80 objective + 20 discursive)
      if (questionNumber > REVALIDA_CONFIG.objectiveQuestionLimit) {
        console.log(
          `  ℹ️  Skipping discursive question ${questionNumber} (Phase 2 only)`
        );
        break;
      }

      const stem = extractedQuestions[i];
      const options = extractOptions(stem);

      if (options.length < 4) {
        warnings.push(
          `Question ${questionNumber}: Only ${options.length} options found`
        );
      }

      questions.push({
        number: questionNumber,
        stem,
        options: options.slice(0, 5),
        correctAnswer: answerKey.get(questionNumber),
        metadata: {
          source: 'revalida-inep',
          year,
          area: mapREVALIDAAreaFromPosition(questionNumber),
        },
      });
    }

    // Warn if area classification uncertain
    if (questions.length > 0) {
      warnings.push(
        'REVALIDA area classification is estimated (exam does not follow 5-area structure). Manual review recommended.'
      );
    }

    return {
      year,
      questions,
      answerKey,
      parseStats: {
        totalExtracted: extractedQuestions.length,
        successCount: questions.length,
        failureCount: extractedQuestions.length - questions.length,
        warnings:
          questions.length < 80
            ? [
                `Only ${questions.length} objective questions found (expected 80)`,
                ...warnings,
              ]
            : warnings,
      },
    };
  }

  /**
   * Create empty result when parsing fails
   */
  private createEmptyResult(year: number): ParsedREVALIDAExam {
    return {
      year,
      questions: [],
      answerKey: new Map(),
      parseStats: {
        totalExtracted: 0,
        successCount: 0,
        failureCount: 0,
        warnings: ['PDF parsing failed - no questions extracted'],
      },
    };
  }
}
