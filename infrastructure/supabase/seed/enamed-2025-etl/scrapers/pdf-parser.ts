/**
 * PDF Parser for ENAMED exam booklets
 * Extracts questions, options, and answer key from PDFs
 */

import type { ExtractedQuestion, QuestionOption, Gabarito } from '../types';

// We'll use pdf-parse for text extraction
// Install with: pnpm add pdf-parse @types/pdf-parse

/**
 * Parse a single question from extracted text
 */
function parseQuestionBlock(
  block: string,
  questionNumber: number,
  caderno: 1 | 2
): ExtractedQuestion | null {
  try {
    // Clean up the block
    const cleaned = block.trim();
    if (!cleaned) return null;

    // Extract options (A, B, C, D patterns)
    const optionPattern = /\(([A-D])\)\s*([^(]+?)(?=\([A-D]\)|$)/gs;
    const options: QuestionOption[] = [];
    let match;

    while ((match = optionPattern.exec(cleaned)) !== null) {
      options.push({
        letter: match[1] as 'A' | 'B' | 'C' | 'D',
        text: match[2].trim(),
      });
    }

    // If no options found with (A) pattern, try A) pattern
    if (options.length === 0) {
      const altPattern = /([A-D])\)\s*([^A-D]+?)(?=[A-D]\)|$)/gs;
      while ((match = altPattern.exec(cleaned)) !== null) {
        options.push({
          letter: match[1] as 'A' | 'B' | 'C' | 'D',
          text: match[2].trim(),
        });
      }
    }

    // Extract stem (everything before first option)
    const stemEnd = cleaned.search(/\([A-D]\)|[A-D]\)/);
    const stem = stemEnd > 0 ? cleaned.substring(0, stemEnd).trim() : cleaned;

    if (options.length < 4) {
      console.warn(
        `Question ${questionNumber}: Only found ${options.length} options`
      );
    }

    return {
      itemNumber: questionNumber,
      caderno,
      stem,
      options: options.length === 4 ? options : [],
    };
  } catch (error) {
    console.error(`Error parsing question ${questionNumber}:`, error);
    return null;
  }
}

/**
 * Extract questions from PDF text
 * This is a heuristic parser that may need adjustment based on actual PDF format
 */
function extractQuestionsFromText(
  text: string,
  caderno: 1 | 2
): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];

  // Try to find question boundaries
  // Common patterns: "QUESTÃO 1", "Questão 1", "1.", "1 -", etc.
  const questionPattern =
    /(?:QUESTÃO|Questão|QUEST[ÃA]O)\s*(\d+)[^\n]*\n([\s\S]*?)(?=(?:QUESTÃO|Questão|QUEST[ÃA]O)\s*\d+|$)/gi;

  let match;
  while ((match = questionPattern.exec(text)) !== null) {
    const questionNumber = parseInt(match[1], 10);
    const questionText = match[2];

    const parsed = parseQuestionBlock(questionText, questionNumber, caderno);
    if (parsed && parsed.options.length === 4) {
      questions.push(parsed);
    }
  }

  // If pattern didn't work, try alternative approach
  if (questions.length === 0) {
    console.log('Primary pattern failed, trying alternative...');

    // Try numbered pattern: "1." or "1 -"
    const altPattern = /^(\d+)[\.\-\s]+(.+?)(?=^\d+[\.\-\s]|$)/gms;
    while ((match = altPattern.exec(text)) !== null) {
      const questionNumber = parseInt(match[1], 10);
      if (questionNumber > 0 && questionNumber <= 100) {
        const parsed = parseQuestionBlock(match[2], questionNumber, caderno);
        if (parsed && parsed.options.length === 4) {
          questions.push(parsed);
        }
      }
    }
  }

  console.log(`Extracted ${questions.length} questions from caderno ${caderno}`);
  return questions;
}

/**
 * Parse gabarito (answer key) from PDF text
 */
function extractGabaritoFromText(text: string, caderno: 1 | 2): Gabarito {
  const answers: Record<number, 'A' | 'B' | 'C' | 'D' | null> = {};

  // Common gabarito patterns:
  // "1 - A", "1. A", "01 A", "1: A", "1 A"
  const patterns = [
    /(\d+)\s*[-.:]\s*([A-D])/gi, // "1 - A", "1. A", "1: A"
    /(\d+)\s+([A-D])(?:\s|$)/gi, // "1 A"
    /^(\d+)\s*([A-D])$/gm, // Line-based
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      const answer = match[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';

      if (num >= 1 && num <= 100 && !answers[num]) {
        answers[num] = answer;
      }
    }

    // If we found enough answers, stop trying other patterns
    if (Object.keys(answers).length >= 90) {
      break;
    }
  }

  console.log(
    `Extracted ${Object.keys(answers).length} answers for caderno ${caderno}`
  );
  return { caderno, answers };
}

/**
 * Main function to parse exam PDF using pdf-parse
 */
export async function parseExamPDF(
  pdfBuffer: Buffer,
  caderno: 1 | 2
): Promise<ExtractedQuestion[]> {
  try {
    // Dynamic import for pdf-parse (may not be installed yet)
    const pdfParse = await import('pdf-parse').then((m) => m.default);
    const data = await pdfParse(pdfBuffer);

    console.log(`Parsed PDF: ${data.numpages} pages, ${data.text.length} chars`);

    return extractQuestionsFromText(data.text, caderno);
  } catch (error) {
    if ((error as Error).message?.includes('Cannot find module')) {
      console.error(
        'pdf-parse not installed. Run: pnpm add pdf-parse @types/pdf-parse'
      );
    }
    throw error;
  }
}

/**
 * Parse gabarito PDF
 */
export async function parseGabaritoPDF(pdfBuffer: Buffer): Promise<{
  caderno1: Gabarito;
  caderno2: Gabarito;
}> {
  try {
    const pdfParse = await import('pdf-parse').then((m) => m.default);
    const data = await pdfParse(pdfBuffer);

    console.log(
      `Parsed Gabarito PDF: ${data.numpages} pages, ${data.text.length} chars`
    );

    // Try to split by caderno if the PDF has both
    const text = data.text;

    // Look for caderno markers in the text
    const caderno1Start = text.search(/caderno\s*1/i);
    const caderno2Start = text.search(/caderno\s*2/i);

    if (caderno1Start !== -1 && caderno2Start !== -1) {
      // Split the text
      const text1 = text.substring(
        caderno1Start,
        caderno2Start > caderno1Start ? caderno2Start : undefined
      );
      const text2 = text.substring(
        caderno2Start,
        caderno1Start > caderno2Start ? caderno1Start : undefined
      );

      return {
        caderno1: extractGabaritoFromText(text1, 1),
        caderno2: extractGabaritoFromText(text2, 2),
      };
    }

    // If no clear separation, parse the whole thing as both
    // (assume same answer key or deduce from structure)
    const gabarito = extractGabaritoFromText(text, 1);
    return {
      caderno1: gabarito,
      caderno2: { ...gabarito, caderno: 2 },
    };
  } catch (error) {
    if ((error as Error).message?.includes('Cannot find module')) {
      console.error(
        'pdf-parse not installed. Run: pnpm add pdf-parse @types/pdf-parse'
      );
    }
    throw error;
  }
}

/**
 * Merge questions with gabarito answers
 */
export function mergeQuestionsWithGabarito(
  questions: ExtractedQuestion[],
  gabarito: Gabarito
): ExtractedQuestion[] {
  return questions.map((q) => ({
    ...q,
    correctAnswer: gabarito.answers[q.itemNumber] || undefined,
  }));
}

/**
 * Convert answer letter to index
 */
export function answerToIndex(answer: 'A' | 'B' | 'C' | 'D'): number {
  return { A: 0, B: 1, C: 2, D: 3 }[answer];
}

/**
 * Convert index to answer letter
 */
export function indexToAnswer(index: number): 'A' | 'B' | 'C' | 'D' {
  return (['A', 'B', 'C', 'D'] as const)[index];
}
