/**
 * ENARE PDF Parser
 * Extracts questions from FGV table-based PDF format
 */

import { extractPDFText, extractQuestionsFromText, extractAnswerKey, extractOptions } from '../../etl-core/utils/pdf';
import { ENARE_CONFIG, mapENAREAreaFromPosition } from './config';
import type { RawQuestion, ParsedQuestions } from '../../etl-core/types/plugin';

export interface ParsedENAREExam {
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

export class ENAREParser {
  /**
   * Parse ENARE PDF and extract questions
   */
  async parsePDF(pdfBuffer: Buffer, year: number): Promise<ParsedENAREExam> {
    console.log(`  📖 Parsing ENARE ${year} PDF...`);

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

    // Extract questions using multiple patterns
    const extractedQuestions = await extractQuestionsFromText(pdfText);

    if (extractedQuestions.length === 0) {
      console.warn(`  ⚠️  No questions extracted from PDF text`);
      // Try table-based pattern parsing
      return this.parseTableFormat(pdfText, year);
    }

    // Parse answer key if embedded in PDF text
    const answerKey = extractAnswerKey(pdfText);

    // Build question objects
    const questions: RawQuestion[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < extractedQuestions.length; i++) {
      const stem = extractedQuestions[i];
      const questionNumber = i + 1;

      // Extract options from text following question stem
      const optionsText = this.extractOptionsFromText(pdfText, stem);
      const options = extractOptions(optionsText || stem);

      if (options.length < 4) {
        warnings.push(
          `Question ${questionNumber}: Only ${options.length} options found (expected 5)`
        );
      }

      questions.push({
        number: questionNumber,
        stem,
        options: options.slice(0, 5), // Limit to 5 options for ENARE
        correctAnswer: answerKey.get(questionNumber),
        metadata: {
          source: 'enare-fgv',
          year,
          difficulty: undefined, // Will be estimated
          area: mapENAREAreaFromPosition(questionNumber),
        },
      });
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
          questions.length < ENARE_CONFIG.questionsPerYear[year as keyof typeof ENARE_CONFIG.questionsPerYear]
            ? [
                `Only ${questions.length} questions found (expected ${
                  ENARE_CONFIG.questionsPerYear[
                    year as keyof typeof ENARE_CONFIG.questionsPerYear
                  ]
                })`,
                ...warnings,
              ]
            : warnings,
      },
    };
  }

  /**
   * Parse ENARE in table format (common for FGV)
   * Format: | Q# | Question text | Answer |
   */
  private parseTableFormat(text: string, year: number): ParsedENAREExam {
    const questions: RawQuestion[] = [];
    const answerKey = new Map<number, string>();
    const warnings: string[] = [];

    // Split by lines and look for table rows
    const lines = text.split('\n');
    let questionCount = 0;

    for (const line of lines) {
      // Table format: | 1 | question text | A |
      const match = line.match(/\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([A-E])\s*\|/);
      if (match) {
        const questionNumber = parseInt(match[1]);
        const questionText = match[2].trim();
        const answer = match[3];

        if (questionNumber > 0 && questionNumber <= 100) {
          questionCount++;
          answerKey.set(questionNumber, answer);

          questions.push({
            number: questionNumber,
            stem: questionText,
            options: [
              { letter: 'A', text: '[Option A]' },
              { letter: 'B', text: '[Option B]' },
              { letter: 'C', text: '[Option C]' },
              { letter: 'D', text: '[Option D]' },
              { letter: 'E', text: '[Option E]' },
            ],
            correctAnswer: answer,
            metadata: {
              source: 'enare-fgv-table',
              year,
              difficulty: undefined,
              area: mapENAREAreaFromPosition(questionNumber),
            },
          });
        }
      }
    }

    if (questionCount === 0) {
      warnings.push('No table-format questions found in PDF');
    }

    return {
      year,
      questions: questions.sort((a, b) => a.number - b.number),
      answerKey,
      parseStats: {
        totalExtracted: questionCount,
        successCount: questions.length,
        failureCount: 0,
        warnings,
      },
    };
  }

  /**
   * Extract options text following a question stem
   */
  private extractOptionsFromText(text: string, stem: string): string | null {
    const stemIndex = text.indexOf(stem);
    if (stemIndex === -1) return null;

    // Get text after stem (next 500 characters or until next question)
    const afterStem = text.substring(stemIndex + stem.length, stemIndex + stem.length + 500);

    // Stop at next question marker
    const nextQuestionMatch = afterStem.match(/[Qq]uestão\s+\d+|[Qq]uestion\s+\d+/);
    if (nextQuestionMatch) {
      return afterStem.substring(0, nextQuestionMatch.index);
    }

    return afterStem;
  }

  /**
   * Create empty result when parsing fails
   */
  private createEmptyResult(year: number): ParsedENAREExam {
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
