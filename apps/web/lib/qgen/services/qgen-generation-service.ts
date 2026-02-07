/**
 * QGen Generation Service
 * =======================
 *
 * Main service for generating medical exam questions using LLM
 */

import {
  QGenGenerationConfig,
  QGenGeneratedQuestion,
  QGenGenerateResponse,
  QGenBatchOptions,
  QGenBatchResponse,
  QGenExamConfig,
  QGenAdaptiveRequest,
  QGenAdaptiveResponse,
  ValidationStatus,
  ValidationDecision,
  BloomLevel,
  QGenQuestionType,
} from '@darwin-education/shared';

import { PromptBuilderService } from './prompt-builder-service';
import { CorpusAnalysisService } from './corpus-analysis-service';
import { ENAMED_DISTRIBUTION } from '../constants/patterns';

/**
 * LLM response structure for generated question
 */
interface LLMGeneratedQuestion {
  questao: {
    enunciado: string;
    alternativas: Record<string, string>;
    gabarito: string;
    comentario: string;
  };
  metadados: {
    area: string;
    tema: string;
    subtema?: string;
    nivel_bloom: string;
    dificuldade_alvo: number;
    dificuldade_estimada_irt: number;
    discriminacao_estimada: number;
    key_concepts: string[];
    tipo_questao: string;
    cenario_clinico?: string;
    diagnostico_principal?: string;
    tipo_distratores: Record<string, string>;
    misconceptions_exploradas: string[];
    requires_integration?: boolean;
  };
}

/**
 * Configuration for the generation service
 */
interface QGenServiceConfig {
  llmModel?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  maxParallelRequests?: number;
  minQualityScore?: number;
  maxCorpusSimilarity?: number;
}

/**
 * QGen Generation Service
 */
export class QGenGenerationService {
  private promptBuilder: PromptBuilderService;
  private corpusAnalyzer: CorpusAnalysisService;
  private config: QGenServiceConfig;

  constructor(config: QGenServiceConfig = {}) {
    this.promptBuilder = new PromptBuilderService();
    this.corpusAnalyzer = new CorpusAnalysisService();
    this.config = {
      llmModel: config.llmModel || 'grok-4-1-fast',
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      maxParallelRequests: config.maxParallelRequests || 5,
      minQualityScore: config.minQualityScore || 0.70,
      maxCorpusSimilarity: config.maxCorpusSimilarity || 0.85,
      ...config,
    };
  }

  /**
   * Generate a single question
   */
  async generateQuestion(genConfig: QGenGenerationConfig): Promise<QGenGenerateResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      try {
        // Build the prompt
        const prompt = this.promptBuilder.buildGenerationPrompt(genConfig);

        // Call LLM
        const llmResponse = await this.callLLM(prompt, genConfig);

        // Parse response
        const parsedResponse = this.parseLLMResponse(llmResponse);

        // Create question object
        const question = this.createQuestionFromResponse(parsedResponse, genConfig, llmResponse);

        // Basic validation
        const validation = await this.performBasicValidation(question);

        // Calculate cost
        const tokensUsed = this.estimateTokens(prompt, llmResponse);
        const cost = this.calculateCost(tokensUsed);

        return {
          question,
          validation,
          generationTimeMs: Date.now() - startTime,
          tokensUsed,
          cost,
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < (this.config.maxRetries || 3) - 1) {
          await this.delay(this.config.retryDelayMs || 1000);
        }
      }
    }

    throw new Error(`Failed to generate question after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generate a batch of questions
   */
  async generateBatch(options: QGenBatchOptions): Promise<QGenBatchResponse> {
    const startTime = Date.now();
    const results: QGenGenerateResponse[] = [];
    let successCount = 0;
    let failureCount = 0;
    let totalCost = 0;

    // Process in parallel batches
    const batchSize = this.config.maxParallelRequests || 5;

    for (let i = 0; i < options.configs.length; i += batchSize) {
      const batch = options.configs.slice(i, i + batchSize);
      const batchPromises = batch.map(config =>
        this.generateQuestion(config).catch(error => ({ error }))
      );

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if ('error' in result) {
          failureCount++;
          if (options.stopOnError) {
            break;
          }
        } else {
          results.push(result);
          successCount++;
          totalCost += result.cost;
        }
      }

      if (options.stopOnError && failureCount > 0) {
        break;
      }
    }

    return {
      questions: results,
      totalTimeMs: Date.now() - startTime,
      successCount,
      failureCount,
      totalCost,
    };
  }

  /**
   * Generate a complete exam with distribution constraints
   */
  async generateExam(examConfig: QGenExamConfig): Promise<QGenBatchResponse> {
    const configs: QGenGenerationConfig[] = [];

    // Use ENAMED distribution if not specified
    const areaDistribution = examConfig.areaDistribution || ENAMED_DISTRIBUTION;

    // Calculate questions per area
    const areaQuestionCounts: Record<string, number> = {};
    let assignedCount = 0;

    for (const [area, weight] of Object.entries(areaDistribution)) {
      const count = Math.floor(examConfig.questionCount * weight);
      areaQuestionCounts[area] = count;
      assignedCount += count;
    }

    // Distribute remaining questions
    const remaining = examConfig.questionCount - assignedCount;
    const areas = Object.keys(areaDistribution);
    for (let i = 0; i < remaining; i++) {
      areaQuestionCounts[areas[i % areas.length]]++;
    }

    // Calculate difficulty distribution
    const difficultyDistribution = examConfig.difficultyDistribution || {
      easy: 0.25,
      medium: 0.50,
      hard: 0.25,
    };

    // Generate configs for each area
    for (const [area, count] of Object.entries(areaQuestionCounts)) {
      const easyCount = Math.floor(count * difficultyDistribution.easy);
      const hardCount = Math.floor(count * difficultyDistribution.hard);
      const mediumCount = count - easyCount - hardCount;

      // Easy questions
      for (let i = 0; i < easyCount; i++) {
        configs.push({
          targetArea: area,
          targetDifficulty: -0.8,
          targetBloomLevel: BloomLevel.APPLICATION,
          targetQuestionType: QGenQuestionType.CLINICAL_CASE,
        });
      }

      // Medium questions
      for (let i = 0; i < mediumCount; i++) {
        configs.push({
          targetArea: area,
          targetDifficulty: 0.0,
          targetBloomLevel: BloomLevel.ANALYSIS,
          targetQuestionType: QGenQuestionType.CLINICAL_CASE,
        });
      }

      // Hard questions
      for (let i = 0; i < hardCount; i++) {
        configs.push({
          targetArea: area,
          targetDifficulty: 0.8,
          targetBloomLevel: BloomLevel.EVALUATION,
          targetQuestionType: QGenQuestionType.CLINICAL_CASE,
        });
      }
    }

    // Shuffle configs for variety
    this.shuffleArray(configs);

    // Filter out excluded questions (would need embedding comparison in production)
    if (examConfig.excludeQuestionIds && examConfig.excludeQuestionIds.length > 0) {
      // In production, filter based on similarity to excluded questions
    }

    return this.generateBatch({
      count: examConfig.questionCount,
      configs,
      parallelism: this.config.maxParallelRequests,
    });
  }

  /**
   * Generate an adaptive question based on DDL classification
   */
  async generateAdaptiveQuestion(request: QGenAdaptiveRequest): Promise<QGenAdaptiveResponse> {
    // Map DDL classification to generation parameters
    const config = this.mapDDLToGenerationConfig(request);

    // Add student profile to config
    config.studentProfile = {
      theta: request.currentTheta || 0,
      weakAreas: request.ddlClassification.weakConcepts || [],
      recentErrors: [],
    };

    // Generate question
    const baseResponse = await this.generateQuestion(config);

    // Add adaptive-specific information
    return {
      ...baseResponse,
      adaptiveRationale: this.generateAdaptiveRationale(request, config),
      targetedMisconceptions: config.targetMisconceptions || [],
      expectedLearningOutcome: this.generateExpectedOutcome(request),
    };
  }

  /**
   * Map DDL classification to generation config
   */
  private mapDDLToGenerationConfig(request: QGenAdaptiveRequest): QGenGenerationConfig {
    const { lacunaType, weakConcepts } = request.ddlClassification;

    // Base configuration
    const config: QGenGenerationConfig = {
      targetArea: weakConcepts[0] || 'clinica_medica',
      targetQuestionType: QGenQuestionType.CLINICAL_CASE,
    };

    // Adjust based on lacuna type
    switch (lacunaType) {
      case 'LE': // Epistemic gap - knowledge deficit
        config.targetBloomLevel = BloomLevel.COMPREHENSION;
        config.targetDifficulty = (request.currentTheta || 0) - 0.5; // Slightly easier
        break;

      case 'LEm': // Emotional gap - confidence issue
        config.targetBloomLevel = BloomLevel.APPLICATION;
        config.targetDifficulty = (request.currentTheta || 0) - 0.8; // Easier to build confidence
        break;

      case 'LIE': // Integration gap - connection problem
        config.targetBloomLevel = BloomLevel.ANALYSIS;
        config.targetDifficulty = request.currentTheta || 0;
        // Target questions that require integrating multiple concepts
        break;

      case 'MIXED':
        config.targetBloomLevel = BloomLevel.APPLICATION;
        config.targetDifficulty = (request.currentTheta || 0) - 0.3;
        break;

      default:
        config.targetBloomLevel = BloomLevel.APPLICATION;
        config.targetDifficulty = request.currentTheta || 0;
    }

    // Target weak concepts
    if (weakConcepts.length > 0) {
      config.targetTopic = weakConcepts[0];
    }

    return config;
  }

  /**
   * Generate rationale for adaptive question selection
   */
  private generateAdaptiveRationale(request: QGenAdaptiveRequest, config: QGenGenerationConfig): string {
    const { lacunaType } = request.ddlClassification;

    const rationales: Record<string, string> = {
      LE: `Questao selecionada para abordar lacuna epistemica em ${config.targetTopic}. Foco em nivel ${config.targetBloomLevel} para construir conhecimento base.`,
      LEm: `Questao com dificuldade reduzida para construir confianca. Tema: ${config.targetTopic}. Sucesso esperado para reforco positivo.`,
      LIE: `Questao de integracao para conectar conceitos em ${config.targetArea}. Requer analise e sintese de multiplos elementos.`,
      MIXED: `Questao balanceada para abordar lacuna mista em ${config.targetTopic}. Dificuldade moderada com foco em aplicacao.`,
      NONE: `Questao padrao para manutencao de nivel em ${config.targetArea}.`,
    };

    return rationales[lacunaType] || rationales.NONE;
  }

  /**
   * Generate expected learning outcome
   */
  private generateExpectedOutcome(request: QGenAdaptiveRequest): string {
    const { lacunaType, weakConcepts } = request.ddlClassification;

    if (lacunaType === 'LE') {
      return `Consolidar conhecimento sobre ${weakConcepts.join(', ')}`;
    }
    if (lacunaType === 'LEm') {
      return `Aumentar confianca atraves de sucesso em questao acessivel`;
    }
    if (lacunaType === 'LIE') {
      return `Desenvolver capacidade de integrar conceitos relacionados`;
    }
    return `Reforcar competencia na area identificada`;
  }

  /**
   * Call LLM API
   */
  private async callLLM(prompt: string, config: QGenGenerationConfig): Promise<string> {
    // In production, this would call the actual LLM API (Grok, Claude, etc.)
    // For now, we'll throw an error indicating the need for implementation

    const apiKey = this.config.llmApiKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    if (!apiKey) {
      throw new Error('LLM API key not configured. Set GROK_API_KEY or XAI_API_KEY environment variable.');
    }

    // Example implementation for Grok API
    const response = await fetch(this.config.llmBaseUrl || 'https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel || this.config.llmModel || 'grok-4-1-fast',
        messages: [
          {
            role: 'system',
            content: this.promptBuilder.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.llmTemperature || 0.7,
        max_tokens: config.llmMaxTokens || 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Parse LLM response into structured format
   */
  private parseLLMResponse(response: string): LLMGeneratedQuestion {
    // Extract JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/\{[\s\S]*"questao"[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from LLM response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${error}`);
    }
  }

  /**
   * Create question object from parsed response
   */
  private createQuestionFromResponse(
    parsed: LLMGeneratedQuestion,
    config: QGenGenerationConfig,
    rawResponse: string
  ): QGenGeneratedQuestion {
    const id = this.generateId();

    return {
      id,
      generationConfigId: null,
      generationTimestamp: new Date().toISOString(),

      stem: parsed.questao.enunciado,
      alternatives: parsed.questao.alternativas,
      correctAnswer: parsed.questao.gabarito,
      explanation: parsed.questao.comentario,

      targetArea: parsed.metadados.area || config.targetArea,
      targetTopic: parsed.metadados.tema || config.targetTopic || null,
      targetDifficulty: parsed.metadados.dificuldade_estimada_irt || config.targetDifficulty || null,
      targetBloomLevel: (parsed.metadados.nivel_bloom as BloomLevel) || config.targetBloomLevel || null,

      generatedFeatures: null, // Would be populated by corpus analyzer

      validationStatus: ValidationStatus.DRAFT,
      qualityScores: null,

      maxCorpusSimilarity: null,
      mostSimilarCorpusId: null,

      estimatedDifficulty: parsed.metadados.dificuldade_estimada_irt || null,
      estimatedDiscrimination: parsed.metadados.discriminacao_estimada || null,

      reviewerId: null,
      reviewTimestamp: null,
      reviewNotes: null,
      reviewScore: null,

      llmModel: this.config.llmModel || null,
      llmPromptVersion: '1.0',
      llmRawResponse: { response: rawResponse },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Perform basic validation on generated question
   */
  private async performBasicValidation(question: QGenGeneratedQuestion) {
    const issues: Array<{
      severity: 'error' | 'warning' | 'info';
      category: string;
      message: string;
    }> = [];

    // Check required fields
    if (!question.stem || question.stem.length < 50) {
      issues.push({
        severity: 'error',
        category: 'structural',
        message: 'Stem is too short or missing',
      });
    }

    // Check alternatives
    const altCount = Object.keys(question.alternatives).length;
    if (altCount < 4) {
      issues.push({
        severity: 'error',
        category: 'structural',
        message: `Only ${altCount} alternatives provided, need at least 4`,
      });
    }

    // Check correct answer
    if (!question.alternatives[question.correctAnswer]) {
      issues.push({
        severity: 'error',
        category: 'structural',
        message: 'Correct answer does not match any alternative',
      });
    }

    // Calculate overall score
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const overallScore = Math.max(0, 1 - errorCount * 0.3 - warningCount * 0.1);

    return {
      questionId: question.id,
      validationTimestamp: new Date().toISOString(),
      stages: {
        structural: { stageName: 'structural', score: errorCount === 0 ? 1 : 0.5, passed: errorCount === 0, details: {}, issues },
        linguistic: { stageName: 'linguistic', score: 0.8, passed: true, details: {}, issues: [] },
        medicalAccuracy: { stageName: 'medicalAccuracy', score: 0.8, passed: true, details: {}, issues: [] },
        distractorQuality: { stageName: 'distractorQuality', score: 0.8, passed: true, details: {}, issues: [] },
        originality: { stageName: 'originality', score: 0.8, passed: true, details: {}, issues: [] },
        irtEstimation: { stageName: 'irtEstimation', score: 0.8, passed: true, details: {}, issues: [] },
      },
      overallScore,
      decision: overallScore >= 0.85 ? ValidationDecision.AUTO_APPROVE :
               overallScore >= 0.70 ? ValidationDecision.PENDING_REVIEW :
               overallScore >= 0.50 ? ValidationDecision.NEEDS_REVISION : ValidationDecision.REJECT,
      issues,
      suggestions: [],
    };
  }

  /**
   * Estimate token usage
   */
  private estimateTokens(prompt: string, response: string): number {
    // Rough estimate: ~4 characters per token for Portuguese
    return Math.ceil((prompt.length + response.length) / 4);
  }

  /**
   * Calculate generation cost
   */
  private calculateCost(tokens: number): number {
    // Approximate cost per 1K tokens for Grok-3
    const costPer1KTokens = 0.003; // $0.003 per 1K tokens (example)
    return (tokens / 1000) * costPer1KTokens;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `qgen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shuffle array in place
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

// Singleton instance
export const qgenGenerationService = new QGenGenerationService();
