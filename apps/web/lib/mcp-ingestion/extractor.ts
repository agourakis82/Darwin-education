import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { IngestedQuestion, McpSearchResult } from './types';
import { runMinimaxChat } from '../ai/minimax';
import {
  buildSourceEvidenceRecord,
  evaluateSourceUrl,
  inferSourceMetadataFromUrl,
  isSourceAllowedForExtraction,
} from './sourcePolicy';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

interface FetchDocumentTextResult {
  text: string | null;
  contentType: string;
  finalUrl: string;
}

interface ExtractedQuestionPayload {
  stem?: unknown;
  options?: unknown;
  exam_type?: unknown;
  year?: unknown;
}

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  baseDelay = BASE_DELAY_MS
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const msg = String((error as Error)?.message ?? '').toLowerCase();
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
      console.info(`[Extractor] Retry ${attempt + 1}/${retries} after ${Math.round(delay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}

async function fetchDocumentText(url: string): Promise<FetchDocumentTextResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`[Extractor] Fetch failed for ${url} with status ${response.status}`);
      return { text: null, contentType: '', finalUrl: url };
    }

    const contentType = response.headers.get('content-type') || '';
    const finalUrl = response.url || url;

    if (contentType.includes('application/pdf')) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const pdfParse = await Function('return import("pdf-parse")')();
        const data = await pdfParse.default(buffer);
        return { text: data.text, contentType, finalUrl };
      } catch (pdfError) {
        console.error(`[Extractor] PDF parsing failed for ${url}:`, pdfError);
        return { text: null, contentType, finalUrl };
      }
    }

    const html = await response.text();
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return { text, contentType, finalUrl };
  } catch (error) {
    console.error(`[Extractor] Error fetching document ${url}:`, error);
    return { text: null, contentType: '', finalUrl: url };
  }
}

function parseQuestionArrayFromLlm(rawResponse: string): ExtractedQuestionPayload[] {
  const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned) as unknown;

  if (Array.isArray(parsed)) return parsed as ExtractedQuestionPayload[];
  if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { questions?: unknown }).questions)
  ) {
    return (parsed as { questions: ExtractedQuestionPayload[] }).questions;
  }

  return [];
}

function normalizeOptions(value: unknown): { letter: string; text: string }[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((option) => {
      if (!option || typeof option !== 'object') return null;
      const candidate = option as { letter?: unknown; text?: unknown };
      const letter = String(candidate.letter || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-E]/g, '')
        .slice(0, 1);
      const text = String(candidate.text || '').trim();
      if (!letter || !text) return null;
      return { letter, text };
    })
    .filter((option): option is { letter: string; text: string } => Boolean(option));
}

export async function extractQuestionsFromDocument(
  url: string,
  runId: string | null,
  sourceMeta?: McpSearchResult
): Promise<Partial<IngestedQuestion>[]> {
  console.info(`[Extractor] Extracting content from: ${url}`);

  const sourcePolicy = sourceMeta?.sourcePolicy || evaluateSourceUrl(url);
  if (!isSourceAllowedForExtraction(sourcePolicy)) {
    console.warn(
      `[Extractor] Blocked by source policy (${sourcePolicy.reason}) for URL: ${sourcePolicy.canonicalUrl}`
    );
    return [];
  }

  const fetchResult = await fetchDocumentText(url);
  if (!fetchResult.text) {
    console.error(`[Extractor] Could not extract text from ${url}`);
    return [];
  }

  const finalPolicy = evaluateSourceUrl(fetchResult.finalUrl);
  if (!isSourceAllowedForExtraction(finalPolicy)) {
    console.warn(
      `[Extractor] Redirected URL blocked by source policy (${finalPolicy.reason}): ${fetchResult.finalUrl}`
    );
    return [];
  }

  const rawText = fetchResult.text;
  const chunkSize = 15000;
  const overlap = 500;
  const chunks: string[] = [];

  for (let index = 0; index < rawText.length; index += chunkSize - overlap) {
    chunks.push(rawText.slice(index, index + chunkSize));
  }

  const rawTextSha256 = createHash('sha256').update(rawText).digest('hex');
  const inferredMetadata = inferSourceMetadataFromUrl(fetchResult.finalUrl, finalPolicy);
  const extractedAtUtc = new Date().toISOString();
  const defaultStatus: IngestedQuestion['status'] =
    finalPolicy.decision === 'review' ? 'needs_review' : 'pending';

  console.info(`[Extractor] Document split into ${chunks.length} chunks`);

  const allQuestions: Partial<IngestedQuestion>[] = [];

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const textChunk = chunks[chunkIndex];
    console.info(`[Extractor] Processing chunk ${chunkIndex + 1}/${chunks.length}...`);

    const prompt = `
You are an expert medical exam data extractor.
Extract only multiple-choice questions from the text below.
Return strictly valid JSON (no markdown) as an array:
[
  {
    "stem": "question text",
    "options": [
      { "letter": "A", "text": "option A" },
      { "letter": "B", "text": "option B" }
    ],
    "exam_type": "ENARE | ENAMED | REVALIDA | ... | null",
    "year": 2025
  }
]

Raw text chunk:
${textChunk}
`;

    try {
      const response = await callWithRetry(() =>
        runMinimaxChat({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          model: 'grok-4-1-fast-non-reasoning',
        })
      );

      const questionsArray = parseQuestionArrayFromLlm(response.text);
      for (const entry of questionsArray) {
        const stem = String(entry.stem || '').trim();
        const options = normalizeOptions(entry.options);
        if (!stem || options.length < 2) continue;

        const yearCandidate = Number.parseInt(String(entry.year ?? ''), 10);
        const year = Number.isNaN(yearCandidate) ? inferredMetadata.year : yearCandidate;

        const evidenceRecord = buildSourceEvidenceRecord({
          policy: finalPolicy,
          discoveredFromUrl: sourceMeta?.discoveredFromUrl || null,
          sourceTitle: sourceMeta?.title || null,
          sourceType: sourceMeta?.type || null,
          extractionMethod: 'pdf_parse_or_html_text_plus_llm_chunking',
          rawTextSha256,
          chunkCount: chunks.length,
          fetchedAtUtc: extractedAtUtc,
        });

        allQuestions.push({
          run_id: runId,
          source_url: finalPolicy.canonicalUrl,
          institution: inferredMetadata.institution,
          exam_type: String(entry.exam_type || '').trim() || inferredMetadata.examType,
          year,
          raw_text: rawText.slice(0, 5000),
          source_raw_text_sha256: rawTextSha256,
          stem,
          options,
          correct_index: null,
          status: defaultStatus,
          source_policy_version: finalPolicy.policyVersion,
          source_policy_rule_id: finalPolicy.ruleId,
          source_policy_decision: finalPolicy.decision,
          source_rights_class: finalPolicy.rightsClass,
          source_requires_human_review: finalPolicy.requiresHumanReview,
          source_policy_reason: finalPolicy.reason,
          source_discovered_from_url: sourceMeta?.discoveredFromUrl || null,
          source_discovery_method: sourceMeta?.discoveryMethod || 'manual',
          source_extraction_method: 'pdf_parse_or_html_text_plus_llm_chunking',
          source_fetched_at: extractedAtUtc,
          curator_notes: JSON.stringify({
            ...evidenceRecord,
            extraction_context: {
              chunk_index: chunkIndex + 1,
              total_chunks: chunks.length,
            },
          }),
        });
      }
    } catch (error) {
      console.error(
        `[Extractor] AI extraction failed for chunk ${chunkIndex + 1} of ${url}:`,
        error
      );
    }
  }

  const uniqueQuestions = allQuestions.filter((question, index, arr) => {
    const normalizedStem = (question.stem || '').trim().toLowerCase();
    return index === arr.findIndex((candidate) => (candidate.stem || '').trim().toLowerCase() === normalizedStem);
  });

  console.info(`[Extractor] Found ${uniqueQuestions.length} unique questions in document.`);
  return uniqueQuestions;
}

const LETTER_TO_INDEX: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
};

export async function parseGabaritoPdf(
  url: string,
  sourceMeta?: McpSearchResult
): Promise<Map<number, number>> {
  console.info(`[Gabarito] Parsing: ${url}`);

  const answers = new Map<number, number>();
  const sourcePolicy = sourceMeta?.sourcePolicy || evaluateSourceUrl(url);
  if (!isSourceAllowedForExtraction(sourcePolicy)) {
    console.warn(`[Gabarito] Blocked by source policy (${sourcePolicy.reason}): ${url}`);
    return answers;
  }

  const fetchResult = await fetchDocumentText(url);
  if (!fetchResult.text) {
    console.error(`[Gabarito] Could not extract text from ${url}`);
    return answers;
  }

  const finalPolicy = evaluateSourceUrl(fetchResult.finalUrl);
  if (!isSourceAllowedForExtraction(finalPolicy)) {
    console.warn(
      `[Gabarito] Redirected URL blocked by source policy (${finalPolicy.reason}): ${fetchResult.finalUrl}`
    );
    return answers;
  }

  const text = fetchResult.text;
  const patterns = [
    /(\d+)\s*[-–.)]\s*([A-E])/gi,
    /(?:Quest(?:ao)?\s+)?(\d+)\s+([A-E])(?:\s|$)/gi,
    /(\d+)\s*\|\s*([A-E])/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const questionNumber = Number.parseInt(match[1], 10);
      const letter = match[2].toUpperCase();
      if (questionNumber > 0 && questionNumber <= 200 && LETTER_TO_INDEX[letter] !== undefined) {
        answers.set(questionNumber, LETTER_TO_INDEX[letter]);
      }
    }

    if (answers.size >= 10) break;
  }

  if (answers.size >= 10) {
    console.info(`[Gabarito] Regex parsed ${answers.size} answers from ${url}`);
    return answers;
  }

  try {
    const response = await callWithRetry(() =>
      runMinimaxChat({
        messages: [
          {
            role: 'user',
            content: `Extract the answer key from this document. Return ONLY JSON array: [{"q":1,"a":"A"}].\n\nText:\n${text.slice(
              0,
              12000
            )}`,
          },
        ],
        temperature: 0.1,
        model: 'grok-4-1-fast-non-reasoning',
      })
    );

    const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned) as Array<{ q: number | string; a: string }>;

    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        const questionNumber =
          typeof entry.q === 'number' ? entry.q : Number.parseInt(String(entry.q), 10);
        const letter = String(entry.a || '').toUpperCase();
        if (questionNumber > 0 && LETTER_TO_INDEX[letter] !== undefined) {
          answers.set(questionNumber, LETTER_TO_INDEX[letter]);
        }
      }
    }

    console.info(`[Gabarito] AI parsed ${answers.size} answers from ${url}`);
  } catch (error) {
    console.error(`[Gabarito] AI parsing failed for ${url}:`, error);
  }

  return answers;
}

export function matchAnswersToQuestions(
  questions: Partial<IngestedQuestion>[],
  answerMap: Map<number, number>
): void {
  let matched = 0;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const numberMatch = question.stem?.match(/^(?:Quest(?:ao)?\s+)?(\d+)/i);
    const questionNumber = numberMatch ? Number.parseInt(numberMatch[1], 10) : i + 1;

    const answerIndex = answerMap.get(questionNumber);
    if (answerIndex !== undefined) {
      question.correct_index = answerIndex;
      matched++;
    }
  }

  console.info(`[Gabarito] Matched ${matched}/${questions.length} questions with answers.`);
}

export async function processExtractedLinks(
  links: McpSearchResult[],
  runId: string | null,
  answerMap?: Map<number, number>
) {
  let totalExtracted = 0;

  for (const link of links) {
    try {
      const extractedQuestions = await extractQuestionsFromDocument(link.url, runId, link);

      if (answerMap && answerMap.size > 0) {
        matchAnswersToQuestions(extractedQuestions, answerMap);
      }

      for (const question of extractedQuestions) {
        const { error } = await getSupabase().from('ingested_questions').insert(question);
        if (error) {
          console.error(`[Extractor] Failed to insert question from ${link.url}:`, error);
        } else {
          totalExtracted++;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[Extractor] Failed to process link ${link.url}:`, error);
    }
  }

  if (runId) {
    await getSupabase()
      .from('ingestion_runs')
      .update({ questions_extracted: totalExtracted })
      .eq('id', runId);
  }

  return totalExtracted;
}
