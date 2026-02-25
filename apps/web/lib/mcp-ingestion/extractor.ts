import { createClient } from '@supabase/supabase-js';
import { IngestedQuestion, McpSearchResult } from './types';
import { runMinimaxChat } from '../ai/minimax';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================
// Retry utility
// ============================================================

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  baseDelay = BASE_DELAY_MS
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const msg = String(error?.message ?? '').toLowerCase();
      const isRetryable =
        msg.includes('resources insufficient') ||
        msg.includes('rate limit') ||
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('overloaded') ||
        msg.includes('timeout') ||
        msg.includes('econnreset') ||
        msg.includes('fetch failed');

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`[Extractor] Retry ${attempt + 1}/${retries} after ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

// ============================================================
// Document fetching
// ============================================================

/**
 * Downloads the document (HTML or PDF) and extracts its raw text.
 */
async function fetchDocumentText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`[Extractor] Fetch failed for ${url} with status ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/pdf')) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      try {
        const pdfParse = await Function('return import("pdf-parse")')();
        const data = await pdfParse.default(buffer);
        return data.text;
      } catch (pdfError) {
        console.error(`[Extractor] PDF parsing failed for ${url}:`, pdfError);
        return null;
      }
    } else {
      const html = await response.text();
      const text = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return text;
    }
  } catch (error) {
    console.error(`[Extractor] Error fetching document ${url}:`, error);
    return null;
  }
}

// ============================================================
// Question extraction (AI-powered)
// ============================================================

/**
 * Downloads and parses an HTML or PDF document and extracts multiple-choice questions via AI.
 */
export async function extractQuestionsFromDocument(url: string, runId: string | null): Promise<Partial<IngestedQuestion>[]> {
  console.log(`[Extractor] Extracting content from: ${url}`);

  const rawText = await fetchDocumentText(url);
  if (!rawText) {
    console.error(`[Extractor] Could not extract text from ${url}`);
    return [];
  }

  const chunkSize = 15000;
  const overlap = 500;
  const chunks: string[] = [];

  for (let i = 0; i < rawText.length; i += chunkSize - overlap) {
    chunks.push(rawText.slice(i, i + chunkSize));
  }

  console.log(`[Extractor] Document split into ${chunks.length} chunks`);

  const allQuestions: Partial<IngestedQuestion>[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const textChunk = chunks[i];
    console.log(`[Extractor] Processing chunk ${i + 1}/${chunks.length}...`);

    const prompt = `
    You are an expert medical exam data extractor. I will provide you with raw text extracted from an exam document (PDF or HTML).
    Your task is to identify and extract any medical multiple-choice questions from this text.
    Return your response strictly as a JSON array of objects. Do not include markdown formatting like \`\`\`json or any conversational text.

    For each question found, structure it like this:
    {
      "stem": "The full question text/stem...",
      "options": [
        { "letter": "A", "text": "First option text" },
        { "letter": "B", "text": "Second option text" }
      ],
      "exam_type": "Try to infer the exam (e.g. ENARE, REVALIDA, ENAMED) from context, or null",
      "year": 2026 // If found in the context, otherwise null
    }

    Raw text:
    ${textChunk}
    `;

    try {
      const response = await callWithRetry(() =>
        runMinimaxChat({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          model: 'grok-4-1-fast-non-reasoning'
        })
      );

      const jsonStr = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const questionsArray = JSON.parse(jsonStr);

      if (Array.isArray(questionsArray)) {
        const mapped = questionsArray.map((q: any) => ({
          run_id: runId,
          source_url: url,
          exam_type: q.exam_type || null,
          year: q.year || null,
          raw_text: rawText.slice(0, 5000),
          stem: q.stem,
          options: q.options || [],
          correct_index: null,
          status: 'pending' as const,
        }));

        allQuestions.push(...mapped);
      }
    } catch (error) {
      console.error(`[Extractor] AI extraction failed for chunk ${i + 1} of ${url}:`, error);
    }
  }

  // Deduplicate exact same questions (due to overlap)
  const uniqueQuestions = allQuestions.filter((q, index, self) =>
    index === self.findIndex((t) => t.stem === q.stem)
  );

  console.log(`[Extractor] Found ${uniqueQuestions.length} unique questions in document.`);
  return uniqueQuestions;
}

// ============================================================
// Gabarito (answer key) parsing
// ============================================================

const LETTER_TO_INDEX: Record<string, number> = {
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4,
};

/**
 * Downloads a gabarito (answer key) PDF and extracts question→answer mappings.
 * Strategy 1: Regex parsing for structured tables.
 * Strategy 2: AI fallback for complex layouts.
 */
export async function parseGabaritoPdf(url: string): Promise<Map<number, number>> {
  console.log(`[Gabarito] Parsing: ${url}`);
  const answers = new Map<number, number>();

  const text = await fetchDocumentText(url);
  if (!text) {
    console.error(`[Gabarito] Could not extract text from ${url}`);
    return answers;
  }

  // Strategy 1: Regex parsing for common gabarito formats
  const patterns = [
    /(\d+)\s*[-–.)]\s*([A-E])/gi,                    // "1-A", "1.A", "1)A"
    /(?:Quest[ãa]o\s+)?(\d+)\s+([A-E])(?:\s|$)/gi,   // "Questão 1 A" or "1 A"
    /(\d+)\s*\|\s*([A-E])/gi,                         // "1 | A" (table format)
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      const letter = match[2].toUpperCase();
      if (num > 0 && num <= 200 && LETTER_TO_INDEX[letter] !== undefined) {
        answers.set(num, LETTER_TO_INDEX[letter]);
      }
    }
    if (answers.size >= 10) break; // Good enough from this pattern
  }

  if (answers.size >= 10) {
    console.log(`[Gabarito] Regex parsed ${answers.size} answers from ${url}`);
    return answers;
  }

  // Strategy 2: AI-assisted parsing (fallback for complex layouts)
  try {
    const response = await callWithRetry(() =>
      runMinimaxChat({
        messages: [{
          role: 'user',
          content: `Extract the answer key from this gabarito (answer key) document. Return ONLY a JSON array like: [{"q": 1, "a": "A"}, {"q": 2, "a": "C"}, ...]. No markdown, no explanation.\n\nText:\n${text.slice(0, 12000)}`
        }],
        temperature: 0.1,
        model: 'grok-4-1-fast-non-reasoning'
      })
    );

    const jsonStr = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        const num = typeof entry.q === 'number' ? entry.q : parseInt(entry.q, 10);
        const letter = String(entry.a).toUpperCase();
        if (num > 0 && LETTER_TO_INDEX[letter] !== undefined) {
          answers.set(num, LETTER_TO_INDEX[letter]);
        }
      }
    }

    console.log(`[Gabarito] AI parsed ${answers.size} answers from ${url}`);
  } catch (error) {
    console.error(`[Gabarito] AI parsing failed for ${url}:`, error);
  }

  return answers;
}

/**
 * Matches extracted questions to their correct answers from the gabarito.
 * Tries to extract question number from stem; falls back to sequential index.
 */
export function matchAnswersToQuestions(
  questions: Partial<IngestedQuestion>[],
  answerMap: Map<number, number>
): void {
  let matched = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Try to extract question number from stem
    const numMatch = q.stem?.match(/^(?:Quest[ãa]o\s+)?(\d+)/i);
    const qNum = numMatch ? parseInt(numMatch[1], 10) : i + 1;

    const correctIdx = answerMap.get(qNum);
    if (correctIdx !== undefined) {
      q.correct_index = correctIdx;
      matched++;
    }
  }
  console.log(`[Gabarito] Matched ${matched}/${questions.length} questions with answers.`);
}

// ============================================================
// Link processing (called by search routine)
// ============================================================

/**
 * Processes a list of links found by the search routine.
 */
export async function processExtractedLinks(
  links: McpSearchResult[],
  runId: string | null,
  answerMap?: Map<number, number>
) {
  let totalExtracted = 0;

  for (const link of links) {
    try {
      const extractedQuestions = await extractQuestionsFromDocument(link.url, runId);

      // Match gabarito answers before inserting
      if (answerMap && answerMap.size > 0) {
        matchAnswersToQuestions(extractedQuestions, answerMap);
      }

      for (const q of extractedQuestions) {
        const { error } = await supabase
          .from('ingested_questions')
          .insert(q);

        if (error) {
          console.error(`[Extractor] Failed to insert question from ${link.url}:`, error);
        } else {
          totalExtracted++;
        }
      }

      // Rate-limit between PDFs to avoid API overload
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`[Extractor] Failed to process link ${link.url}:`, err);
    }
  }

  // Update the run count
  if (runId) {
    await supabase
      .from('ingestion_runs')
      .update({ questions_extracted: totalExtracted })
      .eq('id', runId);
  }

  return totalExtracted;
}
