/**
 * USP/UNIFESP PDF Parser
 * Handles varied PDF formats across different years (legacy to modern)
 */

import { extractPDFText, extractQuestionsFromText, extractAnswerKey, extractOptions } from '../../etl-core/utils/pdf';
import { USP_CONFIG, mapUSPAreaFromPosition, getPDFFormatForYear } from './config';
import type { RawQuestion } from '../../etl-core/types/plugin';

export interface ParsedUSPExam {
  year: number;
  title: string;
  questions: RawQuestion[];
  answerKey: Map<number, string>;
  formatDetected: string;
  parseStats: {
    totalExtracted: number;
    successCount: number;
    failureCount: number;
    warnings: string[];
  };
}

export class USPParser {
  /**
   * Parse USP/UNIFESP PDF and extract questions
   * Handles legacy and modern formats
   */
  async parsePDF(pdfBuffer: Buffer, year: number, title?: string): Promise<ParsedUSPExam> {
    console.log(`  📖 Parsing USP/UNIFESP ${year} PDF...`);

    let pdfText = '';
    try {
      pdfText = await extractPDFText(pdfBuffer);
    } catch (err) {
      console.warn(`  ⚠️  Failed to extract text from PDF: ${err}`);
      return this.createEmptyResult(year, title);
    }

    if (!pdfText || pdfText.trim().length === 0) {
      console.warn(`  ⚠️  PDF text extraction returned empty`);
      return this.createEmptyResult(year, title);
    }

    const detectedFormat = getPDFFormatForYear(year);
    console.log(`  ℹ️  Detected format: ${detectedFormat}`);

    // Try multiple parsing strategies based on format
    let result: ParsedUSPExam | null = null;

    if (detectedFormat === 'legacy') {
      result = await this.parseLegacyFormat(pdfText, year, title);
    } else if (detectedFormat === 'standard') {
      result = await this.parseStandardFormat(pdfText, year, title);
    } else {
      result = await this.parseModernFormat(pdfText, year, title);
    }

    // Fallback if no questions extracted
    if (result.questions.length === 0 && detectedFormat !== 'legacy') {
      console.log(`  ℹ️  Retrying with legacy format parser...`);
      result = await this.parseLegacyFormat(pdfText, year, title);
    }

    result.formatDetected = detectedFormat;
    return result;
  }

  /**
   * Parse modern format (2024, 2023)
   * Standard numbered question format with multiple regex patterns
   */
  private async parseModernFormat(text: string, year: number, title?: string): Promise<ParsedUSPExam> {
    const extractedQuestions = await extractQuestionsFromText(text);
    const answerKey = extractAnswerKey(text);
    const warnings: string[] = [];
    const questions: RawQuestion[] = [];

    for (let i = 0; i < extractedQuestions.length; i++) {
      const stem = extractedQuestions[i];
      const questionNumber = i + 1;

      const options = extractOptions(stem);
      if (options.length < 4) {
        warnings.push(`Q${questionNumber}: Only ${options.length} options found`);
      }

      questions.push({
        number: questionNumber,
        stem,
        options: options.slice(0, 5),
        correctAnswer: answerKey.get(questionNumber),
        metadata: {
          source: 'usp-fuvest-modern',
          year,
          area: mapUSPAreaFromPosition(questionNumber, title),
        },
      });
    }

    return {
      year,
      title: title || `USP/UNIFESP ${year}`,
      questions,
      answerKey,
      formatDetected: 'modern',
      parseStats: {
        totalExtracted: extractedQuestions.length,
        successCount: questions.length,
        failureCount: extractedQuestions.length - questions.length,
        warnings:
          questions.length < 100
            ? [`Only ${questions.length} questions found (expected ~100)`, ...warnings]
            : warnings,
      },
    };
  }

  /**
   * Parse standard format (2022, 2021)
   * May have formatting variations, mixed with non-question content
   */
  private parseStandardFormat(text: string, year: number, title?: string): ParsedUSPExam {
    const lines = text.split('\n');
    const questions: RawQuestion[] = [];
    const answerKey = new Map<number, string>();
    const warnings: string[] = [];

    let currentQuestion: RawQuestion | null = null;
    let questionCount = 0;

    // Multiple regex patterns for question detection
    const patterns = [
      /^\s*(\d+)[.):\s]+(.+)$/m, // "1) Question text" or "1. Question text"
      /^[\s]*\d+[\s]*[\(.][\s]*(.+)$/m, // "( 1 ) Question text"
      /^QUESTÃO\s+(\d+)[:\s]+(.+)$/i, // "QUESTÃO 1: Question text"
    ];

    // Pattern for answer keys
    const answerPattern = /(?:gabarito|resposta|answer)[:\s]+(\d+)[:\s]+([A-E])/i;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try to detect question number
      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const num = parseInt(match[1] || match[2]);
          if (num > 0 && num <= 150) {
            // Save previous question if exists
            if (currentQuestion && currentQuestion.number > 0 && currentQuestion.number <= 100) {
              questions.push(currentQuestion);
              questionCount++;
            }

            currentQuestion = {
              number: num,
              stem: match[2] || trimmed,
              options: [],
              metadata: {
                source: 'usp-fuvest-standard',
                year,
                area: mapUSPAreaFromPosition(num, title),
              },
            };
            break;
          }
        }
      }

      // Check for answer key
      const answerMatch = trimmed.match(answerPattern);
      if (answerMatch) {
        const qNum = parseInt(answerMatch[1]);
        answerKey.set(qNum, answerMatch[2]);
      }
    }

    // Add final question
    if (currentQuestion && currentQuestion.number > 0 && currentQuestion.number <= 100) {
      questions.push(currentQuestion);
      questionCount++;
    }

    // Add generic options if not extracted from text
    questions.forEach((q) => {
      if (!q.options || q.options.length === 0) {
        q.options = [
          { letter: 'A', text: '[Option A]' },
          { letter: 'B', text: '[Option B]' },
          { letter: 'C', text: '[Option C]' },
          { letter: 'D', text: '[Option D]' },
          { letter: 'E', text: '[Option E]' },
        ];
      }
    });

    return {
      year,
      title: title || `USP/UNIFESP ${year}`,
      questions: questions.sort((a, b) => a.number - b.number),
      answerKey,
      formatDetected: 'standard',
      parseStats: {
        totalExtracted: questionCount,
        successCount: questions.length,
        failureCount: 0,
        warnings:
          questions.length < 90
            ? [
                `Only ${questions.length} questions found (expected ~100)`,
                'May require manual extraction for legacy format',
                ...warnings,
              ]
            : warnings,
      },
    };
  }

  /**
   * Parse legacy format (2020, 2019)
   * Older formats, may have scanned PDFs with inconsistent formatting
   */
  private parseLegacyFormat(text: string, year: number, title?: string): ParsedUSPExam {
    // Legacy format is very inconsistent, try pattern matching
    const questions: RawQuestion[] = [];
    const answerKey = new Map<number, string>();
    const warnings: string[] = [
      'Legacy format detected - extraction may be incomplete',
      'Consider manual verification of extracted questions',
    ];

    // Try to find question blocks
    const questionBlocks = text.split(/\n\s*\n+/);

    let questionNumber = 0;
    for (const block of questionBlocks) {
      // Look for question-like patterns
      const firstLine = block.split('\n')[0];

      // Check if this looks like a question (starts with number)
      if (/^\s*\d+[.):]/.test(firstLine)) {
        questionNumber++;

        if (questionNumber > 100) break; // Safety limit

        // Extract question stem (remove leading number)
        const stem = firstLine.replace(/^\s*\d+[).:\s]+/, '').trim();

        if (stem.length > 10) {
          // Reasonable question length
          questions.push({
            number: questionNumber,
            stem,
            options: [
              { letter: 'A', text: '[Option A]' },
              { letter: 'B', text: '[Option B]' },
              { letter: 'C', text: '[Option C]' },
              { letter: 'D', text: '[Option D]' },
              { letter: 'E', text: '[Option E]' },
            ],
            metadata: {
              source: 'usp-fuvest-legacy',
              year,
              area: mapUSPAreaFromPosition(questionNumber, title),
            },
          });
        }
      }
    }

    return {
      year,
      title: title || `USP/UNIFESP ${year}`,
      questions,
      answerKey,
      formatDetected: 'legacy',
      parseStats: {
        totalExtracted: questionNumber,
        successCount: questions.length,
        failureCount: 0,
        warnings:
          questions.length < 80
            ? [
                `Only ${questions.length} questions found (expected ~100)`,
                'Legacy format requires manual extraction for complete dataset',
                ...warnings,
              ]
            : warnings,
      },
    };
  }

  /**
   * Create empty result when parsing fails
   */
  private createEmptyResult(year: number, title?: string): ParsedUSPExam {
    return {
      year,
      title: title || `USP/UNIFESP ${year}`,
      questions: [],
      answerKey: new Map(),
      formatDetected: 'unknown',
      parseStats: {
        totalExtracted: 0,
        successCount: 0,
        failureCount: 0,
        warnings: ['PDF parsing failed - no questions extracted'],
      },
    };
  }
}
