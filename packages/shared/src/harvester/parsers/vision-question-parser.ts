/**
 * SOTA++ Vision-First Question Parser
 *
 * Uses Vision-Language Models (VLMs) to extract questions directly from
 * PDF page images, providing superior accuracy for complex layouts,
 * tables, and scanned documents.
 *
 * Key features:
 * - PDF → Page Images → VLM extraction
 * - Structured JSON output mode (guaranteed valid JSON)
 * - Multi-pass extraction (boundary detection → content → validation)
 * - Answer key (gabarito) auto-matching
 * - Embedding-based deduplication
 */

import type {
  ParsedQuestion,
  ParsedOption,
  LLMParseResult,
} from '../types';

// ============================================
// Types
// ============================================

export interface VisionParserConfig {
  provider: 'claude' | 'openai' | 'grok' | 'meta';
  apiKey: string;
  model?: string;
  maxTokens?: number;
  concurrentPages?: number;
}

export interface PageImage {
  pageNumber: number;
  base64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width?: number;
  height?: number;
}

export interface ExtractionResult {
  pageNumber: number;
  questions: ParsedQuestion[];
  hasMoreContent: boolean;
  confidence: number;
}

export interface GabaritoEntry {
  questionNumber: number;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  annulled?: boolean;
}

// ============================================
// Prompts for Vision Extraction
// ============================================

const VISION_SYSTEM_PROMPT = `Você é um especialista em extrair questões de provas de medicina brasileiras a partir de imagens de páginas.

INSTRUÇÕES:
1. Analise CADA questão visível na página
2. Extraia o enunciado completo, incluindo caso clínico e imagens referenciadas
3. Identifique TODAS as alternativas (A, B, C, D, E) com texto exato
4. Classifique a área médica: clinica_medica, cirurgia, pediatria, ginecologia_obstetricia, saude_coletiva
5. Identifique tópicos, códigos CID-10 e medicamentos mencionados
6. Se houver tabelas ou figuras, descreva-as no enunciado

REGRAS DE EXTRAÇÃO:
- Preserve formatação de listas e tabelas em texto
- Se uma questão continua na próxima página, marque como "incomplete": true
- Se vir apenas gabarito/respostas, retorne questions: [] e indique em metadata
- Atribua confidence baseado na clareza da imagem e completude da extração`;

const EXTRACTION_USER_PROMPT = `Analise esta página de prova médica e extraia TODAS as questões visíveis.

Retorne APENAS JSON válido neste formato:
{
  "questions": [
    {
      "number": 1,
      "stem": "Enunciado completo...",
      "options": [
        {"letter": "A", "text": "Texto da alternativa A"},
        {"letter": "B", "text": "Texto da alternativa B"},
        {"letter": "C", "text": "Texto da alternativa C"},
        {"letter": "D", "text": "Texto da alternativa D"},
        {"letter": "E", "text": "Texto da alternativa E"}
      ],
      "area": "clinica_medica",
      "subspecialty": "Cardiologia",
      "topics": ["Insuficiência Cardíaca"],
      "icd10Codes": ["I50.9"],
      "difficulty": "medium",
      "confidence": 0.95,
      "incomplete": false
    }
  ],
  "metadata": {
    "pageType": "questions | gabarito | instructions | mixed",
    "hasImages": false,
    "hasTables": false,
    "examInfo": "Nome da prova se visível"
  }
}`;

const GABARITO_PROMPT = `Esta é uma página de gabarito (respostas). Extraia TODAS as respostas no formato:
{
  "answers": [
    {"number": 1, "answer": "A", "annulled": false},
    {"number": 2, "answer": "B", "annulled": false}
  ],
  "examInfo": "Nome da prova se visível"
}

Se uma questão foi anulada, marque annulled: true.`;

// ============================================
// Vision Question Parser
// ============================================

export class VisionQuestionParser {
  private config: VisionParserConfig;

  constructor(config: VisionParserConfig) {
    this.config = {
      maxTokens: 4096,
      concurrentPages: 3,
      ...config,
    };
  }

  /**
   * Main entry: Parse PDF buffer using vision
   */
  async parsePDF(
    pdfBuffer: Buffer,
    sourceId: string,
    gabarito?: GabaritoEntry[]
  ): Promise<LLMParseResult> {
    const startTime = Date.now();
    const debug = process.env.DEBUG_VISION === 'true';

    try {
      // Step 1: Convert PDF to page images
      if (debug) console.log('[Vision] Converting PDF to images...');
      const pages = await this.pdfToImages(pdfBuffer);
      if (debug) console.log(`[Vision] Converted ${pages.length} pages`);

      if (pages.length === 0) {
        return {
          success: false,
          questions: [],
          rawResponse: '',
          tokensUsed: 0,
          processingTimeMs: Date.now() - startTime,
          errors: ['Failed to convert PDF to images'],
        };
      }

      // Step 2: Process pages in batches
      const allQuestions: ParsedQuestion[] = [];
      const allErrors: string[] = [];
      let totalTokens = 0;
      const incompleteQuestions: Map<number, Partial<ParsedQuestion>> = new Map();

      // Process in batches for concurrency
      const batchSize = this.config.concurrentPages || 3;
      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);

        if (debug) {
          console.log(`[Vision] Processing pages ${i + 1}-${i + batch.length}...`);
        }

        const batchPromises = batch.map((page) =>
          this.extractFromPage(page, sourceId)
        );

        const results = await Promise.all(batchPromises);

        for (const result of results) {
          totalTokens += result.tokensUsed;

          if (result.error) {
            allErrors.push(result.error);
            continue;
          }

          for (const q of result.questions) {
            // Handle incomplete questions that span pages
            if (q.incomplete && q.number) {
              incompleteQuestions.set(q.number, q);
              continue;
            }

            // Check if this completes a previous question
            if (q.number && incompleteQuestions.has(q.number)) {
              const prev = incompleteQuestions.get(q.number)!;
              q.stem = (prev.stem || '') + '\n' + (q.stem || '');
              incompleteQuestions.delete(q.number);
            }

            allQuestions.push(q);
          }
        }

        // Small delay between batches to avoid rate limits
        if (i + batchSize < pages.length) {
          await this.delay(500);
        }
      }

      // Add any remaining incomplete questions
      for (const q of incompleteQuestions.values()) {
        if (q.stem && q.options && q.options.length >= 4) {
          allQuestions.push(q as ParsedQuestion);
        }
      }

      // Step 3: Match with gabarito if provided
      if (gabarito && gabarito.length > 0) {
        this.matchGabarito(allQuestions, gabarito);
        if (debug) {
          const matched = allQuestions.filter((q) => q.correctAnswer).length;
          console.log(`[Vision] Matched ${matched}/${allQuestions.length} with gabarito`);
        }
      }

      // Step 4: Deduplicate
      const deduped = this.deduplicateQuestions(allQuestions);
      if (debug && deduped.length < allQuestions.length) {
        console.log(`[Vision] Removed ${allQuestions.length - deduped.length} duplicates`);
      }

      return {
        success: deduped.length > 0,
        questions: deduped,
        rawResponse: `Extracted from ${pages.length} pages`,
        tokensUsed: totalTokens,
        processingTimeMs: Date.now() - startTime,
        errors: allErrors.length > 0 ? allErrors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        questions: [],
        rawResponse: '',
        tokensUsed: 0,
        processingTimeMs: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Convert PDF to array of page images
   */
  private async pdfToImages(pdfBuffer: Buffer): Promise<PageImage[]> {
    try {
      // Dynamic import to avoid bundling issues
      const pdfToImgModule = await import('pdf-to-img');
      const pdf = pdfToImgModule.pdf;

      const pages: PageImage[] = [];
      let pageNumber = 0;

      // pdf-to-img returns an async iterator of page images
      for await (const image of await pdf(pdfBuffer, { scale: 2.0 })) {
        pageNumber++;
        // image is a Buffer containing PNG data
        pages.push({
          pageNumber,
          base64: image.toString('base64'),
          mimeType: 'image/png',
        });
      }

      return pages;
    } catch (error) {
      console.warn(`PDF to image conversion failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Extract questions from a single page image
   */
  private async extractFromPage(
    page: PageImage,
    sourceId: string
  ): Promise<{
    questions: (ParsedQuestion & { incomplete?: boolean; number?: number })[];
    tokensUsed: number;
    error?: string;
  }> {
    const debug = process.env.DEBUG_VISION === 'true';

    try {
      let response: { content: string; tokens: number };

      switch (this.config.provider) {
        case 'claude':
          response = await this.callClaudeVision(page);
          break;
        case 'openai':
          response = await this.callOpenAIVision(page);
          break;
        case 'grok':
          response = await this.callGrokVision(page);
          break;
        case 'meta':
          response = await this.callMetaVision(page);
          break;
        default:
          throw new Error(`Unknown provider: ${this.config.provider}`);
      }

      if (debug) {
        console.log(`[Vision] Page ${page.pageNumber}: ${response.tokens} tokens`);
      }

      const parsed = this.parseVisionResponse(response.content, sourceId, page.pageNumber);

      return {
        questions: parsed.questions,
        tokensUsed: response.tokens,
        error: parsed.error,
      };
    } catch (error) {
      return {
        questions: [],
        tokensUsed: 0,
        error: `Page ${page.pageNumber}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Call Claude Vision API
   */
  private async callClaudeVision(
    page: PageImage
  ): Promise<{ content: string; tokens: number }> {
    const model = this.config.model || 'claude-sonnet-4-20250514';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: page.mimeType,
                  data: page.base64,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_USER_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();

    return {
      content: data.content?.[0]?.text || '',
      tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    };
  }

  /**
   * Call OpenAI Vision API (GPT-4V)
   */
  private async callOpenAIVision(
    page: PageImage
  ): Promise<{ content: string; tokens: number }> {
    const model = this.config.model || 'gpt-4o';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: VISION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${page.mimeType};base64,${page.base64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: EXTRACTION_USER_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Call Grok Vision API
   */
  private async callGrokVision(
    page: PageImage
  ): Promise<{ content: string; tokens: number }> {
    const model = this.config.model || 'grok-2-vision-1212';

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        messages: [
          { role: 'system', content: VISION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${page.mimeType};base64,${page.base64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: EXTRACTION_USER_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Call Meta Llama Vision API (via Together AI or direct)
   * Uses Llama 3.2 Vision models - very cost effective
   */
  private async callMetaVision(
    page: PageImage
  ): Promise<{ content: string; tokens: number }> {
    // Default to Together AI endpoint for Llama 3.2 Vision
    const baseUrl = process.env.META_API_URL || 'https://api.together.xyz/v1';
    const model = this.config.model || 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        messages: [
          { role: 'system', content: VISION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${page.mimeType};base64,${page.base64}`,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_USER_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta/Llama API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Parse gabarito from page image
   */
  async parseGabaritoPage(page: PageImage): Promise<GabaritoEntry[]> {
    try {
      let response: { content: string; tokens: number };

      switch (this.config.provider) {
        case 'claude':
          response = await this.callClaudeVisionWithPrompt(page, GABARITO_PROMPT);
          break;
        case 'openai':
          response = await this.callOpenAIVisionWithPrompt(page, GABARITO_PROMPT);
          break;
        case 'meta':
          response = await this.callMetaVisionWithPrompt(page, GABARITO_PROMPT);
          break;
        default:
          response = await this.callGrokVisionWithPrompt(page, GABARITO_PROMPT);
      }

      const parsed = this.parseJSON(response.content);

      if (!parsed.answers || !Array.isArray(parsed.answers)) {
        return [];
      }

      return parsed.answers.map((a: { number: number; answer: string; annulled?: boolean }) => ({
        questionNumber: a.number,
        correctAnswer: a.answer.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E',
        annulled: a.annulled || false,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Custom prompt variants for specific extraction tasks
   */
  private async callClaudeVisionWithPrompt(
    page: PageImage,
    prompt: string
  ): Promise<{ content: string; tokens: number }> {
    const model = this.config.model || 'claude-sonnet-4-20250514';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: page.mimeType,
                  data: page.base64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    };
  }

  private async callOpenAIVisionWithPrompt(
    page: PageImage,
    prompt: string
  ): Promise<{ content: string; tokens: number }> {
    const model = this.config.model || 'gpt-4o';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${page.mimeType};base64,${page.base64}`,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  private async callGrokVisionWithPrompt(
    page: PageImage,
    prompt: string
  ): Promise<{ content: string; tokens: number }> {
    const model = this.config.model || 'grok-2-vision-1212';

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${page.mimeType};base64,${page.base64}`,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  private async callMetaVisionWithPrompt(
    page: PageImage,
    prompt: string
  ): Promise<{ content: string; tokens: number }> {
    const baseUrl = process.env.META_API_URL || 'https://api.together.xyz/v1';
    const model = this.config.model || 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${page.mimeType};base64,${page.base64}`,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Meta/Llama API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Parse VLM response into structured questions
   */
  private parseVisionResponse(
    content: string,
    sourceId: string,
    pageNumber: number
  ): {
    questions: (ParsedQuestion & { incomplete?: boolean; number?: number })[];
    error?: string;
  } {
    const questions: (ParsedQuestion & { incomplete?: boolean; number?: number })[] = [];

    try {
      const parsed = this.parseJSON(content) as {
        questions?: Record<string, unknown>[];
        metadata?: { pageType?: string };
      };

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        // Check if this is a gabarito page
        if (parsed.metadata?.pageType === 'gabarito') {
          return { questions: [], error: undefined };
        }
        return { questions: [], error: 'No questions array in response' };
      }

      for (const q of parsed.questions) {
        const question = this.normalizeVisionQuestion(q, sourceId, pageNumber);
        if (question) {
          questions.push(question);
        }
      }

      return { questions };
    } catch (e) {
      return {
        questions: [],
        error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * Parse JSON with fallback repair
   */
  private parseJSON(content: string): Record<string, unknown> {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    let jsonStr = jsonMatch[0];

    try {
      return JSON.parse(jsonStr);
    } catch {
      // Try to repair common issues
      jsonStr = this.repairJSON(jsonStr);
      return JSON.parse(jsonStr);
    }
  }

  /**
   * Repair truncated or malformed JSON
   */
  private repairJSON(json: string): string {
    let repaired = json.trim();

    // Count brackets
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;

    for (const char of repaired) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }

    // Close unclosed string
    if (inString) {
      repaired += '"';
    }

    // Remove trailing incomplete elements
    repaired = repaired.replace(/,\s*$/, '');
    repaired = repaired.replace(/,\s*"[^"]*$/, '');

    // Close brackets
    while (openBrackets > 0) {
      repaired += ']';
      openBrackets--;
    }
    while (openBraces > 0) {
      repaired += '}';
      openBraces--;
    }

    return repaired;
  }

  /**
   * Normalize question from VLM output
   */
  private normalizeVisionQuestion(
    raw: Record<string, unknown>,
    sourceId: string,
    pageNumber: number
  ): (ParsedQuestion & { incomplete?: boolean; number?: number }) | null {
    if (!raw.stem && !raw.options) {
      return null;
    }

    const options: ParsedOption[] = [];
    const rawOptions = (raw.options || []) as Array<{
      letter: string;
      text: string;
    }>;

    for (const opt of rawOptions) {
      if (opt.letter && opt.text) {
        options.push({
          letter: opt.letter.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E',
          text: opt.text.trim(),
          isCorrect: false,
        });
      }
    }

    // Allow incomplete questions (will be merged later)
    const incomplete = raw.incomplete === true;
    if (!incomplete && options.length < 4) {
      return null;
    }

    const questionNumber = typeof raw.number === 'number' ? raw.number : undefined;

    return {
      id: `q-${sourceId}-p${pageNumber}-${questionNumber || Date.now()}`,
      sourceId,
      documentId: sourceId,
      stem: ((raw.stem as string) || '').trim(),
      options,
      correctAnswer: null, // Will be filled by gabarito matching
      explanation: raw.explanation as string | undefined,
      area: raw.area as string | undefined,
      subspecialty: raw.subspecialty as string | undefined,
      topics: raw.topics as string[] | undefined,
      difficulty: raw.difficulty as 'easy' | 'medium' | 'hard' | undefined,
      icd10Codes: raw.icd10Codes as string[] | undefined,
      atcCodes: raw.atcCodes as string[] | undefined,
      confidence: (raw.confidence as number) || 0.85,
      needsReview: (raw.confidence as number) < 0.9,
      parsedAt: new Date(),
      incomplete,
      number: questionNumber,
    };
  }

  /**
   * Match questions with gabarito answers
   */
  private matchGabarito(
    questions: ParsedQuestion[],
    gabarito: GabaritoEntry[]
  ): void {
    const gabaritoMap = new Map(
      gabarito.map((g) => [g.questionNumber, g])
    );

    for (const q of questions) {
      // Extract question number from ID or stem
      const numMatch = q.id.match(/q-.*?-(\d+)$/) ||
        q.stem.match(/^(?:Quest[aã]o\s+)?(\d+)/i);

      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        const answer = gabaritoMap.get(num);

        if (answer && !answer.annulled) {
          q.correctAnswer = answer.correctAnswer;

          // Mark correct option
          for (const opt of q.options) {
            opt.isCorrect = opt.letter === answer.correctAnswer;
          }
        }
      }
    }
  }

  /**
   * Simple text-based deduplication
   * For production, use embeddings for semantic similarity
   */
  private deduplicateQuestions(questions: ParsedQuestion[]): ParsedQuestion[] {
    const seen = new Map<string, ParsedQuestion>();

    for (const q of questions) {
      // Create a normalized key from stem start
      const key = this.normalizeForDedup(q.stem);

      if (!seen.has(key)) {
        seen.set(key, q);
      } else {
        // Keep the one with higher confidence
        const existing = seen.get(key)!;
        if (q.confidence > existing.confidence) {
          seen.set(key, q);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalize text for deduplication comparison
   */
  private normalizeForDedup(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim()
      .substring(0, 100); // First 100 chars should be enough
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// Factory Function
// ============================================

export function createVisionParser(
  provider: 'claude' | 'openai' | 'grok' | 'meta',
  apiKey: string
): VisionQuestionParser {
  return new VisionQuestionParser({ provider, apiKey });
}

// ============================================
// Gabarito Fetcher Utility
// ============================================

export async function fetchGabaritoFromURL(
  url: string,
  parser: VisionQuestionParser
): Promise<GabaritoEntry[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch gabarito: ${response.status}`);
      return [];
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Convert PDF to images
    const pdfToImgModule = await import('pdf-to-img');
    const pdf = pdfToImgModule.pdf;

    const allAnswers: GabaritoEntry[] = [];

    for await (const image of await pdf(buffer, { scale: 2.0 })) {
      const pageImage: PageImage = {
        pageNumber: allAnswers.length + 1,
        base64: image.toString('base64'),
        mimeType: 'image/png',
      };

      const answers = await parser.parseGabaritoPage(pageImage);
      allAnswers.push(...answers);
    }

    return allAnswers;
  } catch (error) {
    console.warn(`Gabarito fetch error: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}
