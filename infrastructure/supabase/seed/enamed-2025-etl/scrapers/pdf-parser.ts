/**
 * PDF Parser for ENAMED exam booklets
 * Extracts questions, options, and answer key from PDFs
 */

import type { ExtractedQuestion, QuestionOption, Gabarito } from '../types';

// We'll use pdf-parse for text extraction
// Install with: pnpm add pdf-parse @types/pdf-parse

/**
 * Parse a single question from extracted text
 * Improved for ENAMED 2025 format
 */
function parseQuestionBlock(
  block: string,
  questionNumber: number,
  caderno: 1 | 2
): ExtractedQuestion | null {
  try {
    // Clean up the block - normalize whitespace but preserve structure
    let cleaned = block
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    if (!cleaned) return null;

    const options: QuestionOption[] = [];

    // ENAMED format: "(A) text" - extract each option
    // Match (A), (B), (C), (D) followed by text until next option or end
    const optionMatches = cleaned.matchAll(/\(([A-D])\)\s*([\s\S]*?)(?=\([A-D]\)|$)/g);

    for (const match of optionMatches) {
      const letter = match[1] as 'A' | 'B' | 'C' | 'D';
      let text = match[2]
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Remove trailing punctuation if it's just a period
      text = text.replace(/\.$/, '').trim();

      if (text) {
        options.push({ letter, text });
      }
    }

    // Extract stem (everything before first option)
    const stemEnd = cleaned.search(/\([A-D]\)/);
    let stem = stemEnd > 0 ? cleaned.substring(0, stemEnd).trim() : cleaned;

    // Clean up stem - normalize line breaks to spaces
    stem = stem.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // If we have less than 4 options, try an alternative approach
    if (options.length < 4) {
      // Try matching each letter individually
      const letterA = cleaned.match(/\(A\)\s*([\s\S]*?)(?=\(B\)|$)/);
      const letterB = cleaned.match(/\(B\)\s*([\s\S]*?)(?=\(C\)|$)/);
      const letterC = cleaned.match(/\(C\)\s*([\s\S]*?)(?=\(D\)|$)/);
      const letterD = cleaned.match(/\(D\)\s*([\s\S]*?)$/);

      const altOptions: QuestionOption[] = [];

      if (letterA?.[1]) altOptions.push({ letter: 'A', text: letterA[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.$/, '') });
      if (letterB?.[1]) altOptions.push({ letter: 'B', text: letterB[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.$/, '') });
      if (letterC?.[1]) altOptions.push({ letter: 'C', text: letterC[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.$/, '') });
      if (letterD?.[1]) altOptions.push({ letter: 'D', text: letterD[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.$/, '') });

      if (altOptions.length === 4) {
        options.length = 0;
        options.push(...altOptions);
      }
    }

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
 * Optimized for ENAMED 2025 format
 */
function extractQuestionsFromText(
  text: string,
  caderno: 1 | 2
): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];

  // Normalize text - replace multiple spaces with single space but preserve newlines
  const normalizedText = text.replace(/[ \t]+/g, ' ');

  // ENAMED uses "QUESTÃO  1" format (with variable spaces)
  // Match QUESTÃO followed by number, capture everything until next QUESTÃO or end
  const questionPattern =
    /QUEST[ÃA]O\s+(\d+)\s*([\s\S]*?)(?=QUEST[ÃA]O\s+\d+|$)/gi;

  let match;
  while ((match = questionPattern.exec(normalizedText)) !== null) {
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
 * ENAMED format: "1A11Anulada21A" (compact, no spaces)
 */
function extractGabaritoFromText(text: string, caderno: 1 | 2): Gabarito {
  const answers: Record<number, 'A' | 'B' | 'C' | 'D' | null> = {};

  // ENAMED 2025 gabarito format is compact: "1A", "11Anulada", "21A"
  // Need to match number followed directly by single letter A-D OR "Anulada"
  // Pattern: one or more digits, followed by A/B/C/D or "Anulada"
  const compactPattern = /(\d+)(A|B|C|D|Anulada)(?=\d|$|\s|Questão|GABARITO)/gi;

  let match;
  while ((match = compactPattern.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const answer = match[2].toUpperCase();

    if (num >= 1 && num <= 100 && !answers[num]) {
      if (answer === 'A' || answer === 'B' || answer === 'C' || answer === 'D') {
        answers[num] = answer as 'A' | 'B' | 'C' | 'D';
      } else if (answer === 'ANULADA') {
        answers[num] = null; // Mark as annulled
      }
    }
  }

  // Count valid answers (non-null)
  const validCount = Object.values(answers).filter(a => a !== null).length;
  const annulledCount = Object.values(answers).filter(a => a === null).length;

  console.log(
    `Extracted ${validCount} valid answers and ${annulledCount} annulled for caderno ${caderno}`
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
