/**
 * Minimax AI Client
 *
 * HTTP client wrapper for Minimax API with rate limiting and error handling.
 *
 * @module packages/shared/src/services/ai/minimax-client
 */

import type {
  MinimaxConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  QuestionGenerationParams,
  AIGeneratedQuestion,
  ExplainParams,
  ExplanationResponse,
  CaseStudyParams,
  CaseStudy,
  SummarizeParams,
  SummaryResponse,
} from '../../types/ai';
import { AIError } from '../../types/ai';

/**
 * Default Minimax API configuration
 */
const DEFAULT_CONFIG = {
  baseUrl: 'https://api.minimax.chat/v1',
  model: 'abab6.5-chat', // Cost-optimized model
  timeout: 60000, // 60 seconds
};

/**
 * Minimax AI client for text generation
 */
export class MinimaxClient {
  private config: Required<MinimaxConfig>;

  constructor(config: MinimaxConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      baseUrl: config.baseUrl || DEFAULT_CONFIG.baseUrl,
      model: config.model || DEFAULT_CONFIG.model,
      timeout: config.timeout || DEFAULT_CONFIG.timeout,
    };
  }

  /**
   * Send a chat completion request
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          top_p: options.topP ?? 1.0,
          stop: options.stop,
          stream: options.stream ?? false,
          tokens_to_generate: options.maxTokens ?? 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: { message: 'Unknown error', code: 'UNKNOWN' },
        }));
        throw new AIError(
          error.error?.message || 'Minimax API request failed',
          error.error?.code || 'API_ERROR',
          response.status,
          error
        );
      }

      const data = await response.json();
      return this.normalizeChatResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIError(
          'Request timeout exceeded',
          'TIMEOUT',
          408
        );
      }

      throw new AIError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Generate ENAMED-style medical question
   */
  async generateQuestion(
    params: QuestionGenerationParams
  ): Promise<AIGeneratedQuestion> {
    const prompt = this.buildQuestionPrompt(params);

    const response = await this.chat(
      [
        {
          role: 'system',
          content:
            'Você é um especialista em educação médica brasileira, criando questões para o ENAMED. ' +
            'Suas questões seguem o padrão do exame: clinicamente relevantes, 4 alternativas, uma correta. ' +
            'Retorne a resposta em JSON com: stem, options (array de 4 strings), correctAnswer (0-3), explanation.',
        },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.8,
        maxTokens: 1500,
      }
    );

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        stem: parsed.stem,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
        explanation: parsed.explanation,
        area: params.area,
        topic: params.topic,
        icd10Codes: params.icd10Codes,
        atcCodes: params.atcCodes,
        estimatedDifficulty: this.estimateDifficulty(params),
        metadata: {
          model: this.config.model,
          tokensUsed: response.usage.totalTokens,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new AIError(
        'Failed to parse question generation response',
        'PARSE_ERROR',
        500,
        error
      );
    }
  }

  /**
   * Generate personalized explanation for a question
   */
  async explainAnswer(params: ExplainParams): Promise<ExplanationResponse> {
    const prompt = this.buildExplanationPrompt(params);

    const response = await this.chat(
      [
        {
          role: 'system',
          content:
            'Você é um tutor médico experiente explicando conceitos para estudantes do ENAMED. ' +
            'Adapte sua explicação ao nível do estudante e aos erros cometidos. ' +
            'Retorne JSON com: explanation, misconceptionAnalysis, keyConceptsToReview.',
        },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 1000,
      }
    );

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        // Fallback: treat entire response as explanation text
        return {
          explanation: content,
          keyConceptsToReview: [],
        };
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return parsed;
    } catch (error) {
      throw new AIError(
        'Failed to parse explanation response',
        'PARSE_ERROR',
        500,
        error
      );
    }
  }

  /**
   * Generate interactive case study
   */
  async generateCaseStudy(params: CaseStudyParams): Promise<CaseStudy> {
    const prompt = this.buildCaseStudyPrompt(params);

    const response = await this.chat(
      [
        {
          role: 'system',
          content:
            'Você é um educador médico criando casos clínicos interativos para o ENAMED. ' +
            'Crie casos progressivos que simulam atendimento real, com revelação gradual de informações. ' +
            'Retorne JSON com: title, initialPresentation, stages (array), correctDiagnosis, learningObjectives.',
        },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.8,
        maxTokens: 2500,
      }
    );

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        id: `case-${Date.now()}`,
        title: parsed.title,
        initialPresentation: parsed.initialPresentation,
        stages: parsed.stages,
        correctDiagnosis: parsed.correctDiagnosis,
        icd10Code: params.icd10Codes?.[0],
        learningObjectives: parsed.learningObjectives || [],
        metadata: {
          area: params.area,
          complexity: params.complexity || 'moderate',
          estimatedTimeMinutes: Math.ceil(parsed.stages?.length * 3) || 15,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new AIError(
        'Failed to parse case study response',
        'PARSE_ERROR',
        500,
        error
      );
    }
  }

  /**
   * Summarize medical content
   */
  async summarize(params: SummarizeParams): Promise<SummaryResponse> {
    const prompt = this.buildSummarizePrompt(params);

    const response = await this.chat(
      [
        {
          role: 'system',
          content:
            'Você é um médico especialista resumindo conteúdo médico para estudantes. ' +
            'Foque nos pontos clinicamente relevantes e aplicações práticas. ' +
            'Retorne JSON com: summary, keyPoints (array), clinicalPearls (array).',
        },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.5,
        maxTokens: 1000,
      }
    );

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        // Fallback: treat entire response as summary
        return {
          summary: content,
          keyPoints: [],
          clinicalPearls: [],
        };
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return {
        ...parsed,
        estimatedReadingTime: Math.ceil(parsed.summary?.split(' ').length / 3), // ~180 wpm
      };
    } catch (error) {
      throw new AIError(
        'Failed to parse summary response',
        'PARSE_ERROR',
        500,
        error
      );
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Normalize Minimax response to standard format
   */
  private normalizeChatResponse(data: any): ChatResponse {
    return {
      id: data.id || `chatcmpl-${Date.now()}`,
      object: data.object || 'chat.completion',
      created: data.created || Math.floor(Date.now() / 1000),
      model: data.model || this.config.model,
      choices: (data.choices || []).map((choice: any) => ({
        index: choice.index || 0,
        message: {
          role: choice.message?.role || 'assistant',
          content: choice.message?.content || choice.text || '',
        },
        finishReason: choice.finish_reason || 'stop',
      })),
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionPrompt(params: QuestionGenerationParams): string {
    let prompt = `Crie uma questão de múltipla escolha para o ENAMED sobre ${params.area}.`;

    if (params.topic) {
      prompt += `\nTópico específico: ${params.topic}`;
    }

    if (params.difficulty) {
      const difficultyMap = {
        muito_facil: 'muito fácil',
        facil: 'fácil',
        medio: 'médio',
        dificil: 'difícil',
        muito_dificil: 'muito difícil',
      };
      prompt += `\nNível de dificuldade: ${difficultyMap[params.difficulty]}`;
    }

    if (params.icd10Codes?.length) {
      prompt += `\nCódigos ICD-10 relevantes: ${params.icd10Codes.join(', ')}`;
    }

    if (params.atcCodes?.length) {
      prompt += `\nMedicamentos (ATC): ${params.atcCodes.join(', ')}`;
    }

    if (params.context) {
      prompt += `\n\nContexto adicional: ${params.context}`;
    }

    prompt += '\n\nFormato da resposta (JSON):\n';
    prompt += '{\n';
    prompt += '  "stem": "Texto da questão...",\n';
    prompt += '  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n';
    prompt += '  "correctAnswer": 0,\n';
    prompt += '  "explanation": "Explicação detalhada..."\n';
    prompt += '}';

    return prompt;
  }

  /**
   * Build prompt for explanation generation
   */
  private buildExplanationPrompt(params: ExplainParams): string {
    const userAnswerLetter = String.fromCharCode(65 + params.userAnswer); // 0 -> A, 1 -> B, etc.
    const correctAnswerLetter = String.fromCharCode(65 + params.question.correctIndex);

    let prompt = `Questão:\n${params.question.stem}\n\n`;
    prompt += `Opções:\n${params.question.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o.text}`).join('\n')}\n\n`;
    prompt += `Resposta correta: ${correctAnswerLetter}) ${params.question.options[params.question.correctIndex]?.text}\n`;
    prompt += `Resposta do estudante: ${userAnswerLetter}) ${params.question.options[params.userAnswer]?.text}\n\n`;

    if (params.userTheta !== undefined) {
      const thetaLevel =
        params.userTheta < -1 ? 'iniciante' :
        params.userTheta < 0 ? 'intermediário' :
        params.userTheta < 1 ? 'avançado' : 'expert';
      prompt += `Nível do estudante: ${thetaLevel} (theta: ${params.userTheta.toFixed(2)})\n\n`;
    }

    if (params.userContext?.weakAreas?.length) {
      prompt += `Áreas fracas: ${params.userContext.weakAreas.join(', ')}\n`;
    }

    prompt += '\nGere uma explicação personalizada adaptada ao nível do estudante.\n';
    prompt += 'Retorne JSON com:\n';
    prompt += '{\n';
    prompt += '  "explanation": "Explicação principal...",\n';
    prompt += '  "misconceptionAnalysis": "Por que o estudante errou...",\n';
    prompt += '  "keyConceptsToReview": ["Conceito 1", "Conceito 2"]\n';
    prompt += '}';

    return prompt;
  }

  /**
   * Build prompt for case study generation
   */
  private buildCaseStudyPrompt(params: CaseStudyParams): string {
    let prompt = `Crie um caso clínico interativo para ${params.area}.`;

    if (params.complexity) {
      prompt += `\nComplexidade: ${params.complexity}`;
    }

    if (params.targetDiagnosis) {
      prompt += `\nDiagnóstico alvo: ${params.targetDiagnosis}`;
    }

    if (params.icd10Codes?.length) {
      prompt += `\nCódigos ICD-10: ${params.icd10Codes.join(', ')}`;
    }

    prompt += '\n\nO caso deve ter:\n';
    prompt += '1. Apresentação inicial (queixa principal, dados vitais)\n';
    prompt += '2. Múltiplos estágios progressivos (história, exame físico, exames complementares)\n';
    prompt += '3. Perguntas em cada estágio com feedback\n';
    prompt += '4. Diagnóstico final e objetivos de aprendizado\n\n';

    prompt += 'Retorne JSON no formato:\n';
    prompt += '{\n';
    prompt += '  "title": "Título do caso",\n';
    prompt += '  "initialPresentation": "Apresentação inicial...",\n';
    prompt += '  "stages": [\n';
    prompt += '    {\n';
    prompt += '      "stage": 1,\n';
    prompt += '      "title": "História",\n';
    prompt += '      "information": "Informações reveladas...",\n';
    prompt += '      "question": "Qual a próxima conduta?",\n';
    prompt += '      "options": ["Opção A", "Opção B", "Opção C"],\n';
    prompt += '      "correctOption": 0,\n';
    prompt += '      "feedback": "Feedback..."\n';
    prompt += '    }\n';
    prompt += '  ],\n';
    prompt += '  "correctDiagnosis": "Diagnóstico final",\n';
    prompt += '  "learningObjectives": ["Objetivo 1", "Objetivo 2"]\n';
    prompt += '}';

    return prompt;
  }

  /**
   * Build prompt for content summarization
   */
  private buildSummarizePrompt(params: SummarizeParams): string {
    let prompt = `Resuma o seguinte conteúdo médico sobre ${params.type}:\n\n`;
    prompt += params.content;

    if (params.targetLength) {
      const lengthMap = {
        brief: 'breve (2-3 frases)',
        moderate: 'moderado (1 parágrafo)',
        comprehensive: 'abrangente (2-3 parágrafos)',
      };
      prompt += `\n\nTamanho alvo: ${lengthMap[params.targetLength]}`;
    }

    if (params.focus?.length) {
      prompt += `\n\nFoque em: ${params.focus.join(', ')}`;
    }

    prompt += '\n\nRetorne JSON com:\n';
    prompt += '{\n';
    prompt += '  "summary": "Resumo do conteúdo...",\n';
    prompt += '  "keyPoints": ["Ponto 1", "Ponto 2"],\n';
    prompt += '  "clinicalPearls": ["Pérola clínica 1", "Pérola clínica 2"]\n';
    prompt += '}';

    return prompt;
  }

  /**
   * Estimate difficulty based on parameters
   */
  private estimateDifficulty(params: QuestionGenerationParams): number {
    const difficultyMap = {
      muito_facil: -2.0,
      facil: -1.0,
      medio: 0.0,
      dificil: 1.0,
      muito_dificil: 2.0,
    };

    return difficultyMap[params.difficulty || 'medio'];
  }
}

// ============================================
// Standalone API Functions
// ============================================

/**
 * API style (minimax or openai-compatible)
 */
export type MinimaxApiStyle = 'minimax' | 'openai';

/**
 * Message format for chat completion
 */
export interface MinimaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat completion request
 */
export interface MinimaxChatRequest {
  messages: MinimaxMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}

/**
 * Chat completion response
 */
export interface MinimaxChatResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Configuration for standalone minimaxChat function
 */
export interface MinimaxChatConfig {
  apiKey: string;
  groupId?: string;
  baseUrl?: string;
  apiStyle?: MinimaxApiStyle;
  timeoutMs?: number;
}

/**
 * Standalone chat completion function for use in API routes
 *
 * @param request - Chat request with messages and options
 * @param config - API configuration
 * @returns Chat response with text and token usage
 */
export async function minimaxChat(
  request: MinimaxChatRequest,
  config: MinimaxChatConfig
): Promise<MinimaxChatResponse> {
  const baseUrl = config.baseUrl || 'https://api.minimax.chat/v1';
  const model = request.model || 'abab6.5-chat';
  const timeout = config.timeoutMs || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        top_p: request.topP ?? 1.0,
        stop: request.stop,
        tokens_to_generate: request.maxTokens ?? 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: 'Unknown error', code: 'UNKNOWN' },
      }));
      throw new AIError(
        error.error?.message || 'Minimax API request failed',
        error.error?.code || 'API_ERROR',
        response.status,
        error
      );
    }

    const data = await response.json();

    // Extract text from response
    const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';

    // Extract usage
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        }
      : undefined;

    return { text, usage };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AIError('Request timeout', 'TIMEOUT', 408);
      }
      throw new AIError(error.message, 'NETWORK_ERROR', undefined, error);
    }

    throw new AIError('Unknown error during API request', 'UNKNOWN_ERROR');
  }
}
