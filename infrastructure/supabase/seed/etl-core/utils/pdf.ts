/**
 * PDF Parsing Utilities
 * Wrapper around pdf-parse with common patterns
 */

/**
 * Parse PDF text content
 * NOTE: Requires pdf-parse to be installed
 * Falls back to error if not available
 */
export async function extractPDFText(pdfBuffer: Buffer): Promise<string> {
  try {
    // Try to import pdf-parse dynamically
    const pdfParse = await import('pdf-parse');
    const pdf = await pdfParse.default(pdfBuffer);
    return pdf.text;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error(
        'pdf-parse not installed. Install with: npm install pdf-parse'
      );
    }
    throw error;
  }
}

/**
 * Extract question patterns from PDF text
 * Tries multiple patterns commonly used in medical exams
 */
export function extractQuestionsFromText(
  text: string,
  patterns: RegExp[] = DEFAULT_QUESTION_PATTERNS
): Array<{ number: number; content: string }> {
  const questions: Array<{ number: number; content: string }> = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const number = parseInt(match[1], 10);
      if (number > 0) {
        questions.push({
          number,
          content: match[0],
        });
      }
    }
  }

  // Sort by question number
  questions.sort((a, b) => a.number - b.number);

  // Remove duplicates (keep first occurrence)
  const unique: Array<{ number: number; content: string }> = [];
  const seen = new Set<number>();
  for (const q of questions) {
    if (!seen.has(q.number)) {
      unique.push(q);
      seen.add(q.number);
    }
  }

  return unique;
}

/**
 * Common PDF question patterns
 */
export const DEFAULT_QUESTION_PATTERNS = [
  // Pattern: "Questão 1" or "QUESTÃO 1" or "QUESTION 1"
  /(?:Questão|QUESTÃO|Question|QUESTION)\s+(\d+)[\s\S]*?(?=(?:Questão|QUESTÃO|Question|QUESTION)\s+\d+|$)/gi,

  // Pattern: "Q. 1" or "Q.1"
  /Q\.?\s*(\d+)[\s\S]*?(?=Q\.?\s*\d+|$)/gi,

  // Pattern: "1." at start of line followed by text
  /^\s*(\d+)\.\s+[\s\S]*?(?=^\s*\d+\.|$)/gim,

  // Pattern: "[1]" or "(1)" at start
  /^[\[\(]\s*(\d+)\s*[\]\)][\s\S]*?(?=^[\[\(]\s*\d+\s*[\]\)]|$)/gim,
];

/**
 * Extract answer key (gabarito) from PDF text
 * Common pattern: "Questão 1: A" or "1. B" etc.
 */
export function extractAnswerKey(text: string): Record<number, string> {
  const answers: Record<number, string> = {};

  // Try multiple gabarito patterns
  const patterns = [
    // Pattern: "Questão 1: A" or "Questão 1: Resposta: A"
    /Questão\s+(\d+)[\s\S]{0,100}?([A-D])/i,
    // Pattern: "1. Gabarito: A"
    /(\d+)\.\s+(?:Gabarito|GABARITO|Answer)[\s:]*([A-D])/i,
    // Pattern: "Gabarito oficial\n1-A\n2-B"
    /^(\d+)\s*[-:]\s*([A-D])$/gm,
  ];

  for (const pattern of patterns) {
    let match;
    if (pattern.global) {
      while ((match = pattern.exec(text)) !== null) {
        const number = parseInt(match[1], 10);
        const answer = match[2].toUpperCase();
        if (number > 0 && answer.match(/[A-D]/)) {
          answers[number] = answer;
        }
      }
    } else {
      match = pattern.exec(text);
      if (match) {
        const number = parseInt(match[1], 10);
        const answer = match[2].toUpperCase();
        if (number > 0 && answer.match(/[A-D]/)) {
          answers[number] = answer;
        }
      }
    }
  }

  return answers;
}

/**
 * Extract multiple choice options from question text
 */
export function extractOptions(questionText: string): Array<{
  letter: string;
  text: string;
}> {
  const options: Array<{ letter: string; text: string }> = [];

  // Pattern: "A) option text" or "A. option text" or "A - option text"
  const pattern = /([A-D])\s*[).\-]\s+([^\n]+)/gi;
  let match;

  while ((match = pattern.exec(questionText)) !== null) {
    options.push({
      letter: match[1].toUpperCase(),
      text: match[2].trim(),
    });
  }

  // If we found some options, ensure they're in order A-D
  if (options.length > 0) {
    options.sort((a, b) => a.letter.charCodeAt(0) - b.letter.charCodeAt(0));
  }

  return options;
}

/**
 * Clean extracted PDF text
 */
export function cleanPDFText(text: string): string {
  return (
    text
      // Remove multiple whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers
      .replace(/page \d+/gi, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '') // Remove dates
      // Remove extra line breaks
      .replace(/\n\n+/g, '\n')
      .trim()
  );
}
