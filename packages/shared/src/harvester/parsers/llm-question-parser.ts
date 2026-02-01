/**
 * LLM Question Parser
 *
 * Usa Grok ou Minimax para extrair e estruturar questões médicas
 * a partir de texto bruto extraído de PDFs/OCR.
 */

import type {
  ParsedQuestion,
  ParsedOption,
  LLMParseResult,
  RawQuestionBlock,
} from '../types';

// ============================================
// Prompts para Parsing
// ============================================

const SYSTEM_PROMPT = `Você é um especialista em extrair e estruturar questões de provas de medicina brasileiras.

Sua tarefa é analisar texto bruto de provas e extrair questões no formato JSON estruturado.

REGRAS IMPORTANTES:
1. Identifique cada questão pelo número (ex: "Questão 1", "01.", "1)")
2. Extraia o enunciado completo (stem) incluindo caso clínico se houver
3. Identifique as 4-5 alternativas (A, B, C, D, E)
4. Se houver gabarito no texto, identifique a resposta correta
5. Classifique a área médica (Clínica Médica, Cirurgia, Pediatria, GO, Saúde Coletiva)
6. Identifique códigos CID-10 de doenças mencionadas
7. Identifique medicamentos e seus códigos ATC se possível
8. Atribua dificuldade estimada (easy, medium, hard)

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "number": 1,
      "stem": "Enunciado completo da questão...",
      "options": [
        {"letter": "A", "text": "Texto da alternativa A"},
        {"letter": "B", "text": "Texto da alternativa B"},
        {"letter": "C", "text": "Texto da alternativa C"},
        {"letter": "D", "text": "Texto da alternativa D"}
      ],
      "correctAnswer": "A",
      "area": "Clínica Médica",
      "subspecialty": "Cardiologia",
      "topics": ["Insuficiência Cardíaca", "Tratamento"],
      "icd10Codes": ["I50"],
      "atcCodes": ["C09AA02"],
      "difficulty": "medium",
      "confidence": 0.95
    }
  ],
  "parseErrors": []
}

Se não conseguir extrair algum campo, use null. Sempre retorne JSON válido.`;

const EXTRACTION_PROMPT = `Analise o seguinte texto extraído de uma prova de medicina e extraia todas as questões encontradas:

---
{text}
---

Retorne APENAS o JSON estruturado, sem explicações adicionais.`;

// ============================================
// Interfaces de API
// ============================================

interface GrokAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
}

interface MinimaxAPIResponse {
  reply: string;
  usage: {
    total_tokens: number;
  };
}

// ============================================
// Parser Principal
// ============================================

export interface LLMParserConfig {
  provider: 'grok' | 'minimax';
  apiKey: string;
  groupId?: string; // Para Minimax
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class LLMQuestionParser {
  private config: LLMParserConfig;

  constructor(config: LLMParserConfig) {
    this.config = {
      maxTokens: 4096,
      temperature: 0.1, // Baixa temperatura para parsing preciso
      ...config,
    };
  }

  /**
   * Parse texto bruto em questões estruturadas
   */
  async parseText(text: string, sourceId: string): Promise<LLMParseResult> {
    const startTime = Date.now();

    try {
      const prompt = EXTRACTION_PROMPT.replace('{text}', text);

      let response: { content: string; tokens: number };

      if (this.config.provider === 'grok') {
        response = await this.callGrokAPI(prompt);
      } else {
        response = await this.callMinimaxAPI(prompt);
      }

      const parsed = this.parseJSONResponse(response.content, sourceId);

      return {
        success: true,
        questions: parsed.questions,
        rawResponse: response.content,
        tokensUsed: response.tokens,
        processingTimeMs: Date.now() - startTime,
        errors: parsed.errors,
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
   * Parse múltiplos blocos de questões
   */
  async parseBlocks(blocks: RawQuestionBlock[]): Promise<LLMParseResult> {
    const allQuestions: ParsedQuestion[] = [];
    const allErrors: string[] = [];
    let totalTokens = 0;
    const startTime = Date.now();

    for (const block of blocks) {
      const result = await this.parseText(block.rawText, block.documentId);

      if (result.success) {
        allQuestions.push(...result.questions);
      }

      if (result.errors) {
        allErrors.push(...result.errors);
      }

      totalTokens += result.tokensUsed;
    }

    return {
      success: allQuestions.length > 0,
      questions: allQuestions,
      rawResponse: `Parsed ${blocks.length} blocks`,
      tokensUsed: totalTokens,
      processingTimeMs: Date.now() - startTime,
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  }

  /**
   * Chama API do Grok
   */
  private async callGrokAPI(
    prompt: string
  ): Promise<{ content: string; tokens: number }> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'grok-3',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data: GrokAPIResponse = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Chama API do Minimax
   */
  private async callMinimaxAPI(
    prompt: string
  ): Promise<{ content: string; tokens: number }> {
    const response = await fetch(
      `https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${this.config.groupId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'abab6.5s-chat',
          messages: [
            { sender_type: 'SYSTEM', text: SYSTEM_PROMPT },
            { sender_type: 'USER', text: prompt },
          ],
          tokens_to_generate: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Minimax API error: ${response.status}`);
    }

    const data: MinimaxAPIResponse = await response.json();

    return {
      content: data.reply || '',
      tokens: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Parse resposta JSON do LLM
   */
  private parseJSONResponse(
    content: string,
    sourceId: string
  ): { questions: ParsedQuestion[]; errors: string[] } {
    const errors: string[] = [];
    const questions: ParsedQuestion[] = [];

    try {
      // Extrair JSON da resposta (pode ter texto extra)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        errors.push('Não foi possível encontrar JSON na resposta');
        return { questions, errors };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        errors.push('Resposta não contém array de questões');
        return { questions, errors };
      }

      for (const q of parsed.questions) {
        try {
          const question = this.normalizeQuestion(q, sourceId);
          if (question) {
            questions.push(question);
          }
        } catch (e) {
          errors.push(
            `Erro ao normalizar questão ${q.number}: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }

      if (parsed.parseErrors && Array.isArray(parsed.parseErrors)) {
        errors.push(...parsed.parseErrors);
      }
    } catch (e) {
      errors.push(
        `Erro ao parsear JSON: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    return { questions, errors };
  }

  /**
   * Normaliza questão extraída para formato padrão
   */
  private normalizeQuestion(
    raw: Record<string, unknown>,
    sourceId: string
  ): ParsedQuestion | null {
    if (!raw.stem || !raw.options) {
      return null;
    }

    const options: ParsedOption[] = [];
    const rawOptions = raw.options as Array<{
      letter: string;
      text: string;
    }>;

    for (const opt of rawOptions) {
      if (opt.letter && opt.text) {
        const isCorrect =
          typeof raw.correctAnswer === 'string' &&
          opt.letter.toUpperCase() === raw.correctAnswer.toUpperCase();

        options.push({
          letter: opt.letter.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E',
          text: opt.text.trim(),
          isCorrect,
        });
      }
    }

    if (options.length < 4) {
      return null; // Questão incompleta
    }

    const correctAnswer = raw.correctAnswer
      ? ((raw.correctAnswer as string).toUpperCase() as
          | 'A'
          | 'B'
          | 'C'
          | 'D'
          | 'E')
      : null;

    return {
      id: `q-${sourceId}-${raw.number || Date.now()}`,
      sourceId,
      documentId: sourceId,
      stem: (raw.stem as string).trim(),
      options,
      correctAnswer,
      explanation: raw.explanation as string | undefined,
      area: raw.area as string | undefined,
      subspecialty: raw.subspecialty as string | undefined,
      topics: raw.topics as string[] | undefined,
      difficulty: raw.difficulty as 'easy' | 'medium' | 'hard' | undefined,
      icd10Codes: raw.icd10Codes as string[] | undefined,
      atcCodes: raw.atcCodes as string[] | undefined,
      confidence: (raw.confidence as number) || 0.8,
      needsReview: (raw.confidence as number) < 0.9,
      parsedAt: new Date(),
    };
  }
}

// ============================================
// Factory Function
// ============================================

export function createQuestionParser(
  provider: 'grok' | 'minimax',
  apiKey: string,
  groupId?: string
): LLMQuestionParser {
  return new LLMQuestionParser({
    provider,
    apiKey,
    groupId,
  });
}

// ============================================
// Utility: Classificação de Área Médica
// ============================================

const AREA_KEYWORDS: Record<string, string[]> = {
  'Clínica Médica': [
    'diabetes',
    'hipertensão',
    'insuficiência cardíaca',
    'pneumonia',
    'DPOC',
    'asma',
    'infarto',
    'AVC',
    'arritmia',
    'anemia',
    'leucemia',
    'linfoma',
    'tireoide',
    'hepatite',
    'cirrose',
    'insuficiência renal',
    'HIV',
    'tuberculose',
  ],
  Cirurgia: [
    'apendicite',
    'colecistite',
    'hérnia',
    'obstrução intestinal',
    'abdome agudo',
    'trauma',
    'fratura',
    'hemorragia',
    'laparotomia',
    'colectomia',
    'gastrectomia',
  ],
  Pediatria: [
    'recém-nascido',
    'lactente',
    'criança',
    'adolescente',
    'puericultura',
    'vacinação',
    'bronquiolite',
    'icterícia neonatal',
    'prematuridade',
    'desenvolvimento',
  ],
  'Ginecologia e Obstetrícia': [
    'gestante',
    'gravidez',
    'pré-natal',
    'parto',
    'puerpério',
    'pré-eclâmpsia',
    'eclâmpsia',
    'placenta prévia',
    'DPP',
    'amenorreia',
    'sangramento uterino',
    'mioma',
    'câncer de colo',
    'câncer de mama',
  ],
  'Saúde Coletiva': [
    'epidemiologia',
    'vigilância',
    'SUS',
    'atenção básica',
    'ESF',
    'promoção de saúde',
    'prevenção',
    'incidência',
    'prevalência',
    'surto',
    'epidemia',
    'imunização',
  ],
};

export function classifyArea(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  let bestMatch: { area: string; count: number } | null = null;

  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    let count = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        count++;
      }
    }
    if (count > 0 && (!bestMatch || count > bestMatch.count)) {
      bestMatch = { area, count };
    }
  }

  return bestMatch?.area;
}
