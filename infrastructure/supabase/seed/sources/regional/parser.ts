/**
 * Regional Exams PDF Parser
 * Handles varied PDF formats from AMRIGS, SURCE, and SUS-SP Quadrix
 */

import { extractPDFText, extractQuestionsFromText, extractAnswerKey, extractOptions } from '../../etl-core/utils/pdf';
import { REGIONAL_CONFIG, mapRegionalAreaFromPosition, getSourceConfig } from './config';
import type { RawQuestion } from '../../etl-core/types/plugin';

export interface ParsedRegionalExam {
  sourceId: 'amrigs' | 'surce' | 'susSp';
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

export class RegionalParser {
  /**
   * Parse regional exam PDF and extract questions
   */
  async parsePDF(
    pdfBuffer: Buffer,
    sourceId: 'amrigs' | 'surce' | 'susSp',
    year: number
  ): Promise<ParsedRegionalExam> {
    const sourceConfig = getSourceConfig(sourceId);
    console.log(`  📖 Parsing ${sourceConfig.name} ${year} PDF...`);

    let pdfText = '';
    try {
      pdfText = await extractPDFText(pdfBuffer);
    } catch (err) {
      console.warn(`  ⚠️  Failed to extract text: ${err}`);
      return this.createEmptyResult(sourceId, year);
    }

    if (!pdfText || pdfText.trim().length === 0) {
      console.warn(`  ⚠️  PDF extraction returned empty`);
      return this.createEmptyResult(sourceId, year);
    }

    // Try source-specific parsing
    let result: ParsedRegionalExam | null = null;

    if (sourceId === 'amrigs') {
      result = await this.parseAMRIGSFormat(pdfText, year);
    } else if (sourceId === 'surce') {
      result = await this.parseSURCEFormat(pdfText, year);
    } else if (sourceId === 'susSp') {
      result = await this.parseSUSSpFormat(pdfText, year);
    }

    // Fallback to generic parsing
    if (!result || result.questions.length === 0) {
      result = await this.parseGenericFormat(pdfText, sourceId, year);
    }

    return result || this.createEmptyResult(sourceId, year);
  }

  /**
   * Parse AMRIGS format
   */
  private async parseAMRIGSFormat(text: string, year: number): Promise<ParsedRegionalExam> {
    const extractedQuestions = await extractQuestionsFromText(text);
    const answerKey = extractAnswerKey(text);
    const questions: RawQuestion[] = [];

    for (let i = 0; i < extractedQuestions.length && i < 100; i++) {
      const stem = extractedQuestions[i];
      const questionNumber = i + 1;
      const options = extractOptions(stem);

      questions.push({
        number: questionNumber,
        stem,
        options: options.slice(0, 5),
        correctAnswer: answerKey.get(questionNumber),
        metadata: {
          source: 'amrigs',
          year,
          area: mapRegionalAreaFromPosition(questionNumber),
        },
      });
    }

    return {
      sourceId: 'amrigs',
      year,
      questions,
      answerKey,
      parseStats: {
        totalExtracted: extractedQuestions.length,
        successCount: questions.length,
        failureCount: Math.max(0, extractedQuestions.length - questions.length),
        warnings: questions.length < 90 ? [`Only ${questions.length} questions found`] : [],
      },
    };
  }

  /**
   * Parse SURCE format
   */
  private async parseSURCEFormat(text: string, year: number): Promise<ParsedRegionalExam> {
    const extractedQuestions = await extractQuestionsFromText(text);
    const answerKey = extractAnswerKey(text);
    const questions: RawQuestion[] = [];

    for (let i = 0; i < extractedQuestions.length && i < 100; i++) {
      const stem = extractedQuestions[i];
      const questionNumber = i + 1;
      const options = extractOptions(stem);

      questions.push({
        number: questionNumber,
        stem,
        options: options.slice(0, 5),
        correctAnswer: answerKey.get(questionNumber),
        metadata: {
          source: 'surce',
          year,
          area: mapRegionalAreaFromPosition(questionNumber),
        },
      });
    }

    return {
      sourceId: 'surce',
      year,
      questions,
      answerKey,
      parseStats: {
        totalExtracted: extractedQuestions.length,
        successCount: questions.length,
        failureCount: Math.max(0, extractedQuestions.length - questions.length),
        warnings: questions.length < 90 ? [`Only ${questions.length} questions found`] : [],
      },
    };
  }

  /**
   * Parse SUS-SP Quadrix format
   * Quadrix uses standardized format across all concursos
   */
  private async parseSUSSpFormat(text: string, year: number): Promise<ParsedRegionalExam> {
    const extractedQuestions = await extractQuestionsFromText(text);
    const answerKey = extractAnswerKey(text);
    const questions: RawQuestion[] = [];

    for (let i = 0; i < extractedQuestions.length && i < 100; i++) {
      const stem = extractedQuestions[i];
      const questionNumber = i + 1;
      const options = extractOptions(stem);

      questions.push({
        number: questionNumber,
        stem,
        options: options.slice(0, 5),
        correctAnswer: answerKey.get(questionNumber),
        metadata: {
          source: 'sus-sp-quadrix',
          year,
          area: mapRegionalAreaFromPosition(questionNumber),
        },
      });
    }

    return {
      sourceId: 'susSp',
      year,
      questions,
      answerKey,
      parseStats: {
        totalExtracted: extractedQuestions.length,
        successCount: questions.length,
        failureCount: Math.max(0, extractedQuestions.length - questions.length),
        warnings: questions.length < 90 ? [`Only ${questions.length} questions found`] : [],
      },
    };
  }

  /**
   * Generic parser for varied formats
   */
  private parseGenericFormat(
    text: string,
    sourceId: 'amrigs' | 'surce' | 'susSp',
    year: number
  ): ParsedRegionalExam {
    const lines = text.split('\n');
    const questions: RawQuestion[] = [];
    const answerKey = new Map<number, string>();
    let questionCount = 0;

    // Look for numbered lines starting questions
    const patterns = [
      /^\s*(\d+)\s*[\):.]\s*(.+)$/m,
      /^(\d+)\.\s+(.+)$/m,
      /^QUESTÃO\s+(\d+)\s*[:]\s*(.+)$/i,
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const num = parseInt(match[1]);
          if (num > 0 && num <= 150) {
            questionCount++;

            if (questionCount <= 100) {
              questions.push({
                number: num,
                stem: match[2] || trimmed,
                options: [
                  { letter: 'A', text: '[Option A]' },
                  { letter: 'B', text: '[Option B]' },
                  { letter: 'C', text: '[Option C]' },
                  { letter: 'D', text: '[Option D]' },
                  { letter: 'E', text: '[Option E]' },
                ],
                metadata: {
                  source: sourceId,
                  year,
                  area: mapRegionalAreaFromPosition(num),
                },
              });
            }
            break;
          }
        }
      }
    }

    return {
      sourceId,
      year,
      questions: questions.sort((a, b) => a.number - b.number),
      answerKey,
      parseStats: {
        totalExtracted: questionCount,
        successCount: questions.length,
        failureCount: 0,
        warnings:
          questions.length < 80
            ? [
                `Only ${questions.length} questions extracted`,
                'Generic format parser used - may be incomplete',
              ]
            : [],
      },
    };
  }

  /**
   * Create empty result
   */
  private createEmptyResult(
    sourceId: 'amrigs' | 'surce' | 'susSp',
    year: number
  ): ParsedRegionalExam {
    return {
      sourceId,
      year,
      questions: [],
      answerKey: new Map(),
      parseStats: {
        totalExtracted: 0,
        successCount: 0,
        failureCount: 0,
        warnings: ['PDF parsing failed'],
      },
    };
  }
}
