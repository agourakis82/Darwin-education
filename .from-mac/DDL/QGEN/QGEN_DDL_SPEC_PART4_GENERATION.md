# QGen-DDL: Sistema de Geração de Questões Médicas
## PARTE 4: GENERATION SERVICE, INTEGRAÇÃO DDL, MISCONCEPTIONS E API ROUTES

---

## 1. Question Generation Service

```typescript
// ============================================================
// QGEN GENERATION SERVICE
// src/lib/qgen/services/generation-service.ts
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { QGenValidationService } from './validation-service';
import { CorpusAnalysisService } from './corpus-analysis-service';
import { buildCompleteGenerationPrompt } from '../prompts/complete-template';
import { buildDistractorRefinementPrompt } from '../prompts/distractor-generator';
import { QGEN_SYSTEM_PROMPT } from '../prompts/system-prompt';
import { getFewShotForArea } from '../prompts/few-shot-examples';
import {
  QuestionType,
  BloomLevel,
  ClinicalScenario,
  DistractorType,
} from '../types/features';

// ============================================================
// TYPES
// ============================================================

export interface GenerationConfig {
  // Target specification
  area: string;
  topic: string;
  subtopic?: string;
  
  // Psychometric targets
  difficulty: number;        // 1-5
  bloomLevel: BloomLevel;
  questionType: QuestionType;
  
  // Content targets
  keyConcepts: string[];
  misconceptionsToExplore?: string[];
  clinicalScenario?: ClinicalScenario;
  
  // Generation settings
  numAlternatives: 4 | 5;
  includeExplanation: boolean;
  llmModel?: string;
  temperature?: number;
  maxRetries?: number;
  
  // Validation settings
  autoValidate: boolean;
  minQualityScore?: number;
  
  // DDL integration
  ddlContext?: {
    userId: string;
    classificationResult: any;
    targetGap: 'LE' | 'LEm' | 'LIE';
    specificConcepts: string[];
  };
}

export interface GenerationResult {
  success: boolean;
  question: GeneratedQuestion | null;
  validation: any | null;
  generationLog: GenerationLog;
  retryCount: number;
}

export interface GeneratedQuestion {
  id: string;
  
  // Content
  stem: string;
  alternatives: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  
  // Metadata
  area: string;
  topic: string;
  subtopic: string;
  questionType: QuestionType;
  bloomLevel: BloomLevel;
  
  // Psychometrics
  estimatedDifficulty: number;
  estimatedDiscrimination: number;
  targetDifficulty: number;
  
  // Distractor info
  distractorTypes: Record<string, DistractorType>;
  misconceptionsExploited: string[];
  
  // Quality
  qualityScores: {
    medicalAccuracy: number;
    linguisticQuality: number;
    distractorQuality: number;
    originality: number;
    overall: number;
  };
  
  // Generation info
  llmModel: string;
  promptVersion: string;
  generatedAt: string;
}

interface GenerationLog {
  configUsed: GenerationConfig;
  promptSent: string;
  rawResponse: string;
  parsedResponse: any;
  tokensUsed: number;
  responseTimeMs: number;
  errors: string[];
}

// ============================================================
// GENERATION SERVICE
// ============================================================

export class QGenGenerationService {
  private supabase: SupabaseClient;
  private anthropic: Anthropic;
  private validator: QGenValidationService;
  private corpusAnalyzer: CorpusAnalysisService;
  
  private static readonly DEFAULT_MODEL = 'claude-sonnet-4-20250514';
  private static readonly DEFAULT_TEMPERATURE = 0.7;
  private static readonly MAX_RETRIES = 3;
  private static readonly PROMPT_VERSION = '1.0.0';
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    this.validator = new QGenValidationService();
    this.corpusAnalyzer = new CorpusAnalysisService();
  }

  // ============================================================
  // MAIN GENERATION PIPELINE
  // ============================================================

  async generateQuestion(config: GenerationConfig): Promise<GenerationResult> {
    const maxRetries = config.maxRetries || QGenGenerationService.MAX_RETRIES;
    let retryCount = 0;
    let lastError: string = '';
    
    while (retryCount < maxRetries) {
      try {
        // Step 1: Enrich config with corpus data
        const enrichedConfig = await this.enrichConfig(config);
        
        // Step 2: Build prompt
        const prompt = this.buildPrompt(enrichedConfig);
        
        // Step 3: Call LLM
        const startTime = Date.now();
        const rawResponse = await this.callLLM(prompt, config);
        const responseTimeMs = Date.now() - startTime;
        
        // Step 4: Parse response
        const parsedResponse = this.parseResponse(rawResponse);
        
        if (!parsedResponse) {
          lastError = 'Failed to parse LLM response as JSON';
          retryCount++;
          continue;
        }
        
        // Step 5: Build generation log
        const generationLog: GenerationLog = {
          configUsed: config,
          promptSent: prompt,
          rawResponse,
          parsedResponse,
          tokensUsed: 0, // Would come from API response
          responseTimeMs,
          errors: [],
        };
        
        // Step 6: Validate if auto-validation enabled
        let validation = null;
        if (config.autoValidate) {
          validation = await this.validator.validateQuestion(parsedResponse, {
            area: config.area,
            topic: config.topic,
            difficulty: config.difficulty,
            bloomLevel: config.bloomLevel,
          });
          
          const minScore = config.minQualityScore || 0.70;
          
          if (validation.scores.weighted < minScore) {
            lastError = `Quality score ${validation.scores.weighted.toFixed(2)} below threshold ${minScore}`;
            generationLog.errors.push(lastError);
            
            // Try to refine distratores before full retry
            if (validation.scores.distractorQuality < 0.7 && retryCount < maxRetries - 1) {
              const refined = await this.refineDistractors(parsedResponse, config);
              if (refined) {
                parsedResponse.questao.alternativas = refined.alternativas;
                // Re-validate
                validation = await this.validator.validateQuestion(parsedResponse, {
                  area: config.area,
                  topic: config.topic,
                  difficulty: config.difficulty,
                  bloomLevel: config.bloomLevel,
                });
                
                if (validation.scores.weighted >= minScore) {
                  // Refinement successful
                  const question = this.buildGeneratedQuestion(parsedResponse, config);
                  await this.saveGeneratedQuestion(question, validation, generationLog);
                  return { success: true, question, validation, generationLog, retryCount };
                }
              }
            }
            
            retryCount++;
            continue;
          }
        }
        
        // Step 7: Build and save question
        const question = this.buildGeneratedQuestion(parsedResponse, config);
        await this.saveGeneratedQuestion(question, validation, generationLog);
        
        return {
          success: true,
          question,
          validation,
          generationLog,
          retryCount,
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        retryCount++;
      }
    }
    
    // All retries exhausted
    return {
      success: false,
      question: null,
      validation: null,
      generationLog: {
        configUsed: config,
        promptSent: '',
        rawResponse: '',
        parsedResponse: null,
        tokensUsed: 0,
        responseTimeMs: 0,
        errors: [`Generation failed after ${maxRetries} retries. Last error: ${lastError}`],
      },
      retryCount,
    };
  }

  // ============================================================
  // BATCH GENERATION
  // ============================================================

  async generateBatch(configs: GenerationConfig[]): Promise<{
    results: GenerationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      avgQuality: number;
      byArea: Record<string, number>;
    };
  }> {
    const results: GenerationResult[] = [];
    
    // Process sequentially to avoid rate limits
    for (const config of configs) {
      const result = await this.generateQuestion(config);
      results.push(result);
      
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Build summary
    const successful = results.filter(r => r.success);
    const byArea: Record<string, number> = {};
    let totalQuality = 0;
    
    for (const result of successful) {
      const area = result.question?.area || 'Unknown';
      byArea[area] = (byArea[area] || 0) + 1;
      totalQuality += result.question?.qualityScores.overall || 0;
    }
    
    return {
      results,
      summary: {
        total: configs.length,
        successful: successful.length,
        failed: configs.length - successful.length,
        avgQuality: successful.length > 0 ? totalQuality / successful.length : 0,
        byArea,
      },
    };
  }

  // ============================================================
  // EXAM GENERATION (full simulated exam)
  // ============================================================

  async generateExam(examConfig: {
    name: string;
    totalQuestions: number;
    distribution: {
      area: string;
      percentage: number;
      topics?: string[];
      difficultyRange?: [number, number];
    }[];
    bloomDistribution?: {
      level: BloomLevel;
      percentage: number;
    }[];
    questionTypes?: {
      type: QuestionType;
      percentage: number;
    }[];
  }): Promise<{
    exam: {
      name: string;
      questions: GeneratedQuestion[];
      metadata: {
        totalGenerated: number;
        totalApproved: number;
        avgDifficulty: number;
        avgQuality: number;
        areaDistribution: Record<string, number>;
        bloomDistribution: Record<string, number>;
      };
    };
    generationReport: GenerationResult[];
  }> {
    // Calculate question distribution
    const configs: GenerationConfig[] = [];
    
    for (const areaDist of examConfig.distribution) {
      const numQuestions = Math.round(examConfig.totalQuestions * areaDist.percentage / 100);
      
      for (let i = 0; i < numQuestions; i++) {
        // Vary difficulty within range
        const [minDiff, maxDiff] = areaDist.difficultyRange || [2, 4];
        const difficulty = minDiff + Math.round(Math.random() * (maxDiff - minDiff));
        
        // Select topic
        const topic = areaDist.topics 
          ? areaDist.topics[i % areaDist.topics.length]
          : areaDist.area;
        
        // Select Bloom level based on distribution
        const bloomLevel = this.selectBloomLevel(examConfig.bloomDistribution);
        
        // Select question type
        const questionType = this.selectQuestionType(examConfig.questionTypes);
        
        configs.push({
          area: areaDist.area,
          topic,
          difficulty,
          bloomLevel,
          questionType,
          keyConcepts: [],
          numAlternatives: 5,
          includeExplanation: true,
          autoValidate: true,
          minQualityScore: 0.70,
        });
      }
    }
    
    // Shuffle to mix areas
    this.shuffleArray(configs);
    
    // Generate all questions
    const batchResult = await this.generateBatch(configs);
    
    // Collect approved questions
    const approvedQuestions = batchResult.results
      .filter(r => r.success && r.question)
      .map(r => r.question!);
    
    // Calculate exam metadata
    const avgDifficulty = approvedQuestions.length > 0
      ? approvedQuestions.reduce((sum, q) => sum + q.estimatedDifficulty, 0) / approvedQuestions.length
      : 0;
    
    const avgQuality = approvedQuestions.length > 0
      ? approvedQuestions.reduce((sum, q) => sum + q.qualityScores.overall, 0) / approvedQuestions.length
      : 0;
    
    const areaDistribution: Record<string, number> = {};
    const bloomDistribution: Record<string, number> = {};
    
    for (const q of approvedQuestions) {
      areaDistribution[q.area] = (areaDistribution[q.area] || 0) + 1;
      bloomDistribution[q.bloomLevel] = (bloomDistribution[q.bloomLevel] || 0) + 1;
    }
    
    return {
      exam: {
        name: examConfig.name,
        questions: approvedQuestions,
        metadata: {
          totalGenerated: configs.length,
          totalApproved: approvedQuestions.length,
          avgDifficulty,
          avgQuality,
          areaDistribution,
          bloomDistribution,
        },
      },
      generationReport: batchResult.results,
    };
  }

  // ============================================================
  // DDL-INTEGRATED ADAPTIVE GENERATION
  // ============================================================

  async generateAdaptiveQuestion(ddlContext: {
    userId: string;
    classificationResult: {
      classification: 'LE' | 'LEm' | 'LIE';
      confidence: number;
      details: any;
    };
    previousQuestionId?: string;
    previousScore?: number;
  }): Promise<GenerationResult> {
    const { classificationResult } = ddlContext;
    
    // Fetch user's DDL history
    const history = await this.getUserDDLHistory(ddlContext.userId);
    
    // Determine generation strategy based on DDL classification
    const strategy = this.buildAdaptiveStrategy(classificationResult, history);
    
    // Build generation config
    const config: GenerationConfig = {
      area: strategy.targetArea,
      topic: strategy.targetTopic,
      subtopic: strategy.targetSubtopic,
      difficulty: strategy.difficulty,
      bloomLevel: strategy.bloomLevel,
      questionType: strategy.questionType,
      keyConcepts: strategy.conceptsToTest,
      misconceptionsToExplore: strategy.misconceptionsToExplore,
      numAlternatives: 4,
      includeExplanation: true,
      autoValidate: true,
      minQualityScore: 0.65,
      ddlContext: {
        userId: ddlContext.userId,
        classificationResult: classificationResult,
        targetGap: classificationResult.classification,
        specificConcepts: strategy.conceptsToTest,
      },
    };
    
    return this.generateQuestion(config);
  }

  private buildAdaptiveStrategy(
    classification: {
      classification: 'LE' | 'LEm' | 'LIE';
      confidence: number;
      details: any;
    },
    history: any[]
  ): {
    targetArea: string;
    targetTopic: string;
    targetSubtopic?: string;
    difficulty: number;
    bloomLevel: BloomLevel;
    questionType: QuestionType;
    conceptsToTest: string[];
    misconceptionsToExplore: string[];
  } {
    switch (classification.classification) {
      case 'LE': {
        // Lacuna Estrutural: student lacks foundational knowledge
        // Strategy: Test basic concepts at lower difficulty
        return {
          targetArea: classification.details?.area || 'Clínica Médica',
          targetTopic: classification.details?.topic || '',
          difficulty: 2,  // Lower difficulty to build up
          bloomLevel: BloomLevel.COMPREHENSION,
          questionType: QuestionType.CONCEPTUAL,
          conceptsToTest: classification.details?.missingConcepts || [],
          misconceptionsToExplore: classification.details?.misconceptions || [],
        };
      }
      
      case 'LEm': {
        // Lacuna Emergente: student has partial knowledge
        // Strategy: Test application with moderate difficulty
        return {
          targetArea: classification.details?.area || 'Clínica Médica',
          targetTopic: classification.details?.topic || '',
          difficulty: 3,  // Moderate
          bloomLevel: BloomLevel.APPLICATION,
          questionType: QuestionType.CLINICAL_CASE,
          conceptsToTest: classification.details?.partialConcepts || [],
          misconceptionsToExplore: classification.details?.emergingMisconceptions || [],
        };
      }
      
      case 'LIE': {
        // Lacuna de Integração: student knows concepts but can't integrate
        // Strategy: Test integration and analysis at higher difficulty
        return {
          targetArea: classification.details?.area || 'Clínica Médica',
          targetTopic: classification.details?.topic || '',
          difficulty: 4,  // Higher difficulty requiring integration
          bloomLevel: BloomLevel.ANALYSIS,
          questionType: QuestionType.CLINICAL_CASE,
          conceptsToTest: classification.details?.disconnectedConcepts || [],
          misconceptionsToExplore: classification.details?.integrationErrors || [],
        };
      }
      
      default:
        return {
          targetArea: 'Clínica Médica',
          targetTopic: '',
          difficulty: 3,
          bloomLevel: BloomLevel.APPLICATION,
          questionType: QuestionType.CLINICAL_CASE,
          conceptsToTest: [],
          misconceptionsToExplore: [],
        };
    }
  }

  // ============================================================
  // INTERNAL METHODS
  // ============================================================

  private async enrichConfig(config: GenerationConfig): Promise<GenerationConfig & {
    corpusExamples?: string[];
    vignetteTemplate?: string;
    additionalContext?: string;
  }> {
    // Fetch misconceptions for the topic
    if (!config.misconceptionsToExplore || config.misconceptionsToExplore.length === 0) {
      const { data: misconceptions } = await this.supabase
        .from('qgen_misconceptions')
        .select('incorrect_belief, correct_understanding')
        .or(`area_id.eq.${config.area},topic_id.eq.${config.topic}`)
        .limit(5);
      
      if (misconceptions) {
        config.misconceptionsToExplore = misconceptions.map(
          m => `${m.incorrect_belief} (Correto: ${m.correct_understanding})`
        );
      }
    }
    
    // Fetch relevant corpus examples
    const { data: examples } = await this.supabase
      .from('qgen_corpus_questions')
      .select('stem, alternatives, correct_answer')
      .eq('primary_area', config.area)
      .limit(3);
    
    const corpusExamples = examples?.map(e => 
      `${e.stem}\n${Object.entries(e.alternatives as Record<string, string>)
        .map(([k, v]) => `${k}) ${v}`)
        .join('\n')}\nGabarito: ${e.correct_answer}`
    );
    
    // Fetch vignette template
    const { data: templates } = await this.supabase
      .from('qgen_vignette_templates')
      .select('template_text')
      .contains('applicable_areas', [config.area])
      .limit(1);
    
    return {
      ...config,
      corpusExamples,
      vignetteTemplate: templates?.[0]?.template_text,
    };
  }

  private buildPrompt(config: GenerationConfig & {
    corpusExamples?: string[];
    vignetteTemplate?: string;
  }): string {
    return buildCompleteGenerationPrompt({
      area: config.area,
      topic: config.topic,
      subtopic: config.subtopic,
      difficulty: config.difficulty,
      bloomLevel: config.bloomLevel,
      questionType: config.questionType,
      keyConcepts: config.keyConcepts,
      misconceptions: config.misconceptionsToExplore || [],
      vignetteTemplate: config.vignetteTemplate,
      corpusExamples: config.corpusExamples,
      additionalInstructions: config.ddlContext 
        ? this.buildDDLInstructions(config.ddlContext)
        : undefined,
    });
  }

  private buildDDLInstructions(ddlContext: GenerationConfig['ddlContext']): string {
    if (!ddlContext) return '';
    
    const gapDescriptions: Record<string, string> = {
      LE: 'O estudante apresenta Lacuna Estrutural — falta de conhecimento conceitual básico. Gere questão que teste diretamente os conceitos ausentes.',
      LEm: 'O estudante apresenta Lacuna Emergente — conhecimento parcial em construção. Gere questão que teste aplicação dos conceitos parciais para consolidar aprendizagem.',
      LIE: 'O estudante apresenta Lacuna de Integração Estrutural — conhece conceitos isolados mas não os integra. Gere questão que EXIJA integração entre os conceitos listados.',
    };
    
    return `
### CONTEXTO DDL (Diagnóstico Diferencial de Lacunas)

${gapDescriptions[ddlContext.targetGap]}

**Conceitos específicos a testar:**
${ddlContext.specificConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**IMPORTANTE:** A questão deve ser calibrada para o tipo de lacuna identificada:
- LE → foco em reconhecimento e recall
- LEm → foco em aplicação e transferência
- LIE → foco em conexões entre conceitos e raciocínio integrado
`;
  }

  private async callLLM(prompt: string, config: GenerationConfig): Promise<string> {
    const model = config.llmModel || QGenGenerationService.DEFAULT_MODEL;
    const temperature = config.temperature || QGenGenerationService.DEFAULT_TEMPERATURE;
    
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 4000,
      temperature,
      system: QGEN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }
    
    return content.text;
  }

  private parseResponse(raw: string): any | null {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // Try to find JSON object in text
      const objectMatch = raw.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      
      // Try direct parse
      return JSON.parse(raw.trim());
    } catch {
      return null;
    }
  }

  private async refineDistractors(
    question: any,
    config: GenerationConfig
  ): Promise<{ alternativas: Record<string, string> } | null> {
    try {
      const gabarito = question.questao?.gabarito;
      const alternatives = question.questao?.alternativas || {};
      const distractors: Record<string, string> = {};
      
      for (const [key, text] of Object.entries(alternatives)) {
        if (key !== gabarito) {
          distractors[key] = text as string;
        }
      }
      
      const prompt = buildDistractorRefinementPrompt({
        stem: question.questao?.enunciado || '',
        correctAnswer: alternatives[gabarito] || '',
        currentDistractors: distractors,
        area: config.area,
        topic: config.topic,
        availableMisconceptions: config.misconceptionsToExplore || [],
      });
      
      const response = await this.anthropic.messages.create({
        model: QGenGenerationService.DEFAULT_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });
      
      const content = response.content[0];
      if (content.type !== 'text') return null;
      
      const result = this.parseResponse(content.text);
      if (!result?.distratores) return null;
      
      // Rebuild alternatives
      const newAlternatives: Record<string, string> = {};
      for (const [key, text] of Object.entries(alternatives)) {
        if (key === gabarito) {
          newAlternatives[key] = text as string;
        } else {
          newAlternatives[key] = result.distratores[key]?.texto || text as string;
        }
      }
      
      return { alternativas: newAlternatives };
    } catch {
      return null;
    }
  }

  private buildGeneratedQuestion(
    parsed: any,
    config: GenerationConfig
  ): GeneratedQuestion {
    const questao = parsed.questao || {};
    const metadados = parsed.metadados || {};
    const autoValidacao = parsed.auto_validacao || {};
    
    return {
      id: crypto.randomUUID(),
      stem: questao.enunciado || '',
      alternatives: questao.alternativas || {},
      correctAnswer: questao.gabarito || 'A',
      explanation: questao.comentario || '',
      area: config.area,
      topic: config.topic,
      subtopic: metadados.subtema || config.subtopic || '',
      questionType: config.questionType,
      bloomLevel: config.bloomLevel,
      estimatedDifficulty: metadados.dificuldade_estimada_irt || 0,
      estimatedDiscrimination: metadados.discriminacao_estimada || 1.0,
      targetDifficulty: config.difficulty,
      distractorTypes: metadados.tipo_distratores || {},
      misconceptionsExploited: metadados.misconceptions_exploradas || [],
      qualityScores: {
        medicalAccuracy: autoValidacao.acuracia_medica ? 0.9 : 0.7,
        linguisticQuality: autoValidacao.sem_pistas_linguisticas ? 0.9 : 0.7,
        distractorQuality: autoValidacao.distratores_plausiveis ? 0.85 : 0.6,
        originality: 0.9,
        overall: autoValidacao.confianca_geral || 0.8,
      },
      llmModel: config.llmModel || QGenGenerationService.DEFAULT_MODEL,
      promptVersion: QGenGenerationService.PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
    };
  }

  private async saveGeneratedQuestion(
    question: GeneratedQuestion,
    validation: any | null,
    log: GenerationLog
  ): Promise<void> {
    // Save to generated questions table
    await this.supabase.from('qgen_generated_questions').insert({
      id: question.id,
      stem: question.stem,
      alternatives: question.alternatives,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      target_area: question.area,
      target_topic: question.topic,
      target_difficulty: question.targetDifficulty,
      target_bloom_level: question.bloomLevel,
      estimated_difficulty: question.estimatedDifficulty,
      estimated_discrimination: question.estimatedDiscrimination,
      quality_scores: question.qualityScores,
      validation_status: validation?.decision === 'AUTO_APPROVE' 
        ? 'AUTO_VALIDATED' 
        : validation?.decision || 'DRAFT',
      llm_model: question.llmModel,
      llm_prompt_version: question.promptVersion,
      llm_raw_response: log.parsedResponse,
      generated_features: {
        distractorTypes: question.distractorTypes,
        misconceptionsExploited: question.misconceptionsExploited,
      },
    });
    
    // Save generation log
    await this.supabase.from('qgen_generation_log').insert({
      question_id: question.id,
      request_params: log.configUsed,
      prompt_used: log.promptSent,
      llm_response: log.rawResponse,
      response_time_ms: log.responseTimeMs,
      tokens_used: log.tokensUsed,
      success: true,
    });
  }

  private async getUserDDLHistory(userId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('ddl_classifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    return data || [];
  }

  private selectBloomLevel(distribution?: { level: BloomLevel; percentage: number }[]): BloomLevel {
    if (!distribution || distribution.length === 0) {
      // Default ENAMED-like distribution
      distribution = [
        { level: BloomLevel.KNOWLEDGE, percentage: 10 },
        { level: BloomLevel.COMPREHENSION, percentage: 10 },
        { level: BloomLevel.APPLICATION, percentage: 35 },
        { level: BloomLevel.ANALYSIS, percentage: 25 },
        { level: BloomLevel.SYNTHESIS, percentage: 10 },
        { level: BloomLevel.EVALUATION, percentage: 10 },
      ];
    }
    
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const item of distribution) {
      cumulative += item.percentage;
      if (rand <= cumulative) return item.level;
    }
    
    return BloomLevel.APPLICATION;
  }

  private selectQuestionType(distribution?: { type: QuestionType; percentage: number }[]): QuestionType {
    if (!distribution || distribution.length === 0) {
      distribution = [
        { type: QuestionType.CLINICAL_CASE, percentage: 70 },
        { type: QuestionType.CONCEPTUAL, percentage: 15 },
        { type: QuestionType.INTERPRETATION, percentage: 10 },
        { type: QuestionType.ETHICAL_LEGAL, percentage: 5 },
      ];
    }
    
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const item of distribution) {
      cumulative += item.percentage;
      if (rand <= cumulative) return item.type;
    }
    
    return QuestionType.CLINICAL_CASE;
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
```

---

## 2. Misconceptions Database Seed

```sql
-- ============================================================
-- MISCONCEPTIONS SEED DATA
-- Migration: 003_qgen_misconceptions_seed.sql
-- ============================================================

-- ============================================================
-- CLÍNICA MÉDICA
-- ============================================================

INSERT INTO qgen_misconceptions (code, name, incorrect_belief, correct_understanding, why_common, concepts_involved, prevalence_estimate) VALUES

-- Cardiologia
('CM-CARD-001', 'ICC FE preservada = sem IC',
 'Insuficiência cardíaca requer fração de ejeção reduzida (FE < 40%)',
 'ICC com FE preservada (ICFEp, FE ≥ 50%) é igualmente prevalente e pode ser grave. Diagnóstico baseia-se em sintomas, BNP e achados ecocardiográficos (disfunção diastólica)',
 'Ensino tradicional enfatizou historicamente a IC sistólica. Critérios diagnósticos de ICFEp são mais recentes',
 '["fração de ejeção", "insuficiência cardíaca", "disfunção diastólica", "BNP"]',
 0.45),

('CM-CARD-002', 'IECA = BRA (mecanismo idêntico)',
 'IECA e BRA têm mecanismo de ação idêntico sobre o SRAA',
 'IECA bloqueia ECA (reduz angiotensina II e acúmulo de bradicinina → tosse). BRA bloqueia receptor AT1 diretamente, sem acúmulo de bradicinina. Efeitos clínicos similares mas mecanismos distintos',
 'Ambos atuam no SRAA com indicações sobrepostas, levando à confusão mecanística',
 '["IECA", "BRA", "SRAA", "ECA", "bradicinina", "receptor AT1"]',
 0.55),

('CM-CARD-003', 'Troponina elevada = IAM',
 'Troponina elevada sempre indica infarto agudo do miocárdio',
 'Troponina pode elevar-se em múltiplas condições: miocardite, embolia pulmonar, sepse, insuficiência renal, taquiarritmias, IC descompensada. IAM requer curva de troponina + contexto clínico + alterações eletrocardiográficas ou de imagem',
 'Troponina é o marcador mais específico de lesão miocárdica mas não é sinônimo de IAM',
 '["troponina", "IAM", "diagnóstico diferencial", "curva enzimática"]',
 0.60),

-- Pneumologia
('CM-PNEU-001', 'Asma = DPOC em jovem',
 'Asma e DPOC são variantes da mesma doença, diferenciadas apenas pela idade',
 'São doenças distintas: Asma é inflamação eosinofílica, reversível, episódica, com hiperresponsividade brônquica. DPOC é obstrutiva fixa, progressiva, ligada a tabagismo. Pode haver overlap (ACO)',
 'Ambas causam obstrução e dispneia, e a resposta parcial ao broncodilatador em DPOC confunde',
 '["asma", "DPOC", "espirometria", "reversibilidade", "eosinófilos"]',
 0.50),

('CM-PNEU-002', 'Tuberculose = febre + tosse + emagrecimento',
 'TB pulmonar sempre se apresenta com a tríade clássica febre + tosse crônica + emagrecimento',
 'Até 50% dos casos podem ser paucissintomáticos. Rastreamento ativo em populações de risco (contatos, imunossuprimidos) é essencial. A clínica pode incluir apenas tosse >3 semanas',
 'Ensino enfatiza apresentação florida que corresponde a casos avançados',
 '["tuberculose", "rastreamento", "tosse crônica", "baciloscopia", "BAAR"]',
 0.40),

-- Endocrinologia
('CM-ENDO-001', 'DM2 = sem insulina',
 'Diabetes tipo 2 nunca requer insulina; insulina é apenas para DM1',
 'DM2 frequentemente requer insulina na progressão: quando há falência de célula beta, em descompensações agudas, ou quando controle é inadequado com antidiabéticos orais. Até 30-40% dos DM2 usam insulina',
 'Classificação tipo 1/tipo 2 confunde estudantes sobre a necessidade terapêutica',
 '["DM2", "insulina", "falência beta", "HbA1c", "insulinização"]',
 0.50),

('CM-ENDO-002', 'Hipotireoidismo = TSH baixo',
 'TSH baixo indica hipotireoidismo',
 'TSH é ELEVADO no hipotireoidismo primário (>90% dos casos) por feedback negativo. TSH baixo indica hipertireoidismo (exceto hipotireoidismo central, que é raro)',
 'Confusão entre eixo hormonal e feedback negativo hipófise-tireoide',
 '["TSH", "T4L", "hipotireoidismo", "feedback negativo", "eixo hipotálamo-hipófise"]',
 0.35),

-- Nefrologia
('CM-NEF-001', 'Creatinina normal = função renal normal',
 'Se a creatinina sérica está normal, a função renal está preservada',
 'Creatinina pode permanecer normal até perda de 50% da TFG (fase compensatória). Idosos, sarcopênicos e desnutridos podem ter creatinina normal com TFG reduzida. Sempre calcular TFGe',
 'Creatinina é o exame mais pedido mas tem baixa sensibilidade para DRC inicial',
 '["creatinina", "TFG", "DRC", "equação CKD-EPI", "cistatina C"]',
 0.55),

-- Infectologia
('CM-INF-001', 'Resfriado = antibiótico',
 'Infecções de vias aéreas superiores requerem antibioticoterapia',
 'IVAS são virais em >90% dos casos. Não há benefício de antibióticos e há risco de resistência bacteriana. Indicações: suspeita de sinusite bacteriana (>10 dias), amigdalite estreptocócica (critérios de Centor)',
 'Pressão cultural por prescrição rápida e confusão viral/bacteriana',
 '["IVAS", "resfriado", "antibiótico", "resistência bacteriana", "Centor"]',
 0.65),

-- Emergência
('CM-EMERG-001', 'TC antes de estabilização',
 'Em paciente grave, a prioridade é solicitar exames diagnósticos (TC, labs)',
 'ABCDE é SEMPRE prioritário. Estabilização clínica precede qualquer exame complementar. Paciente instável nunca deve sair da sala de emergência para TC',
 'Ansiedade diagnóstica em cenário de emergência',
 '["ABCDE", "estabilização", "via aérea", "acesso vascular", "prioridades"]',
 0.30);

-- ============================================================
-- PEDIATRIA
-- ============================================================

INSERT INTO qgen_misconceptions (code, name, incorrect_belief, correct_understanding, why_common, concepts_involved, prevalence_estimate) VALUES

('PED-001', 'AME até 1 ano',
 'Aleitamento materno exclusivo deve ser mantido até 1 ano de idade',
 'AME até 6 MESES. Alimentação complementar inicia aos 6 meses, mantendo AM até 2 anos ou mais (OMS)',
 'Confusão entre duração de AME e duração total do AM',
 '["aleitamento materno exclusivo", "alimentação complementar", "6 meses", "OMS"]',
 0.45),

('PED-002', 'Febre alta = infecção bacteriana',
 'Febre alta (>39°C) indica obrigatoriamente infecção bacteriana e necessidade de antibiótico',
 'Altura da febre não diferencia etiologia. Viroses podem causar febre alta (ex: roséola). Avaliação clínica completa, não temperatura isolada, guia conduta',
 'Associação popular febre-gravidade influencia raciocínio clínico',
 '["febre", "infecção viral", "infecção bacteriana", "PCR", "avaliação clínica"]',
 0.55),

('PED-003', 'Dose pediátrica = dose adulto proporcional',
 'Dose pediátrica é simplesmente proporcional ao peso: dose_adulto × (peso_criança/70)',
 'Farmacocinética pediátrica difere: metabolismo hepático, função renal, composição corporal e volume de distribuição são diferentes. Doses devem seguir referências pediátricas específicas por faixa etária',
 'Simplificação do cálculo em situações de pressa',
 '["dose pediátrica", "farmacocinética", "metabolismo", "peso", "faixa etária"]',
 0.40);

-- ============================================================
-- GINECOLOGIA E OBSTETRÍCIA
-- ============================================================

INSERT INTO qgen_misconceptions (code, name, incorrect_belief, correct_understanding, why_common, concepts_involved, prevalence_estimate) VALUES

('GO-001', 'DPP = sangramento indolor',
 'Descolamento prematuro de placenta apresenta-se com sangramento vaginal indolor',
 'DPP tipicamente cursa com DOR, hipertonia uterina e sangramento escuro. Sangramento INDOLOR é típico de placenta prévia. Em até 20% dos DPP o sangramento pode ser oculto',
 'Confusão clássica entre DPP e PP em provas',
 '["DPP", "placenta prévia", "sangramento", "hipertonia", "dor"]',
 0.50),

('GO-002', 'IG pela DUM = IG real',
 'A idade gestacional pela DUM é sempre a idade gestacional correta',
 'DUM é estimativa que pode ser imprecisa (ciclos irregulares, uso de ACO, sangramento de implantação). USG de 1º trimestre (6-12 sem) é padrão-ouro para datação. Discordância >7 dias: prevalece USG',
 'DUM é o primeiro dado disponível e facilmente calculável',
 '["idade gestacional", "DUM", "USG obstétrico", "datação", "primeiro trimestre"]',
 0.45),

('GO-003', 'Eclâmpsia = pré-eclâmpsia grave',
 'Eclâmpsia é simplesmente uma forma mais grave de pré-eclâmpsia',
 'Eclâmpsia é definida especificamente por CONVULSÃO em gestante com pré-eclâmpsia. Pré-eclâmpsia grave (PA ≥160x110, proteinúria maciça, HELLP) pode NÃO evoluir para eclâmpsia. São entidades relacionadas mas distintas',
 'Nomenclatura sugere continuum direto de gravidade',
 '["eclâmpsia", "pré-eclâmpsia", "convulsão", "sulfato de magnésio", "HELLP"]',
 0.35);

-- ============================================================
-- CIRURGIA
-- ============================================================

INSERT INTO qgen_misconceptions (code, name, incorrect_belief, correct_understanding, why_common, concepts_involved, prevalence_estimate) VALUES

('CIR-001', 'Apendicite = McBurney positivo',
 'Apendicite aguda sempre apresenta dor no ponto de McBurney',
 'Dor no ponto de McBurney é específica mas não sensível. Apêndice retrocecal pode causar dor lombar ou em flanco. Em gestantes, a dor migra superiormente. Crianças e idosos podem ter apresentações atípicas',
 'McBurney é o sinal mais ensinado e memorizado para apendicite',
 '["apendicite", "McBurney", "apêndice retrocecal", "dor atípica"]',
 0.40),

('CIR-002', 'Abdome agudo = cirurgia imediata',
 'Todo abdome agudo é cirúrgico e requer laparotomia de urgência',
 'Existem 5 tipos de abdome agudo: inflamatório, obstrutivo, perfurativo, hemorrágico e vascular. Causas clínicas (pancreatite, gastroenterite) podem mimetizar abdome cirúrgico. Investigação adequada é essencial',
 'Urgência do cenário leva a decisões precipitadas',
 '["abdome agudo", "tipos", "peritonite", "laparotomia", "diagnóstico diferencial"]',
 0.35);

-- ============================================================
-- SAÚDE COLETIVA / MEDICINA PREVENTIVA
-- ============================================================

INSERT INTO qgen_misconceptions (code, name, incorrect_belief, correct_understanding, why_common, concepts_involved, prevalence_estimate) VALUES

('SC-001', 'Sensibilidade = especificidade',
 'Testes com alta sensibilidade também têm alta especificidade',
 'Sensibilidade e especificidade são propriedades independentes e frequentemente inversamente proporcionadas. Sensibilidade alta = bom para rastreamento (poucos falso-negativos). Especificidade alta = bom para confirmação (poucos falso-positivos)',
 'Ambos são "boas características" do teste, levando à confusão',
 '["sensibilidade", "especificidade", "VPP", "VPN", "rastreamento", "diagnóstico"]',
 0.55),

('SC-002', 'Prevalência = incidência',
 'Prevalência e incidência são sinônimos ou intercambiáveis',
 'Prevalência = proporção de casos existentes em um ponto no tempo (foto). Incidência = taxa de casos NOVOS em um período (filme). Doenças crônicas têm alta prevalência relativa; doenças agudas podem ter alta incidência mas baixa prevalência',
 'Ambos medem "frequência de doença" com nomes similares',
 '["prevalência", "incidência", "medidas de frequência", "epidemiologia"]',
 0.50),

-- Ética
('ET-001', 'Sigilo absoluto sempre',
 'O sigilo médico é absoluto e nunca pode ser quebrado',
 'O sigilo pode ser quebrado em situações previstas em lei: notificação compulsória, risco iminente para paciente ou terceiros, ordem judicial, comunicação ao responsável legal de menor',
 'Ênfase no sigilo durante formação sem discussão adequada das exceções',
 '["sigilo médico", "notificação compulsória", "dever de comunicação", "código de ética"]',
 0.40);

-- ============================================================
-- PSIQUIATRIA / SAÚDE MENTAL
-- ============================================================

INSERT INTO qgen_misconceptions (code, name, incorrect_belief, correct_understanding, why_common, concepts_involved, prevalence_estimate) VALUES

('PSI-001', 'Depressão = tristeza',
 'Depressão maior é simplesmente tristeza prolongada',
 'TDM requer ≥5 sintomas por ≥2 semanas (DSM-5): humor deprimido OU anedonia + alterações sono, apetite, energia, concentração, psicomotricidade, culpa, ideação suicida. Tristeza é emoção normal',
 'Uso coloquial de "depressão" como sinônimo de tristeza',
 '["depressão maior", "DSM-5", "anedonia", "critérios diagnósticos"]',
 0.60),

('PSI-002', 'Esquizofrenia = personalidade múltipla',
 'Esquizofrenia é o mesmo que transtorno dissociativo de identidade (personalidade múltipla)',
 'Esquizofrenia é transtorno psicótico (delírios, alucinações, desorganização). TDI é transtorno dissociativo (alteração de identidade/consciência). São categorias diagnósticas completamente diferentes',
 'Confusão etimológica: "esquizo" (dividido) + cultura popular',
 '["esquizofrenia", "transtorno dissociativo", "psicose", "alucinação", "delírio"]',
 0.45);
```

---

## 3. API Routes

```typescript
// ============================================================
// QGEN API ROUTES
// src/app/api/qgen/generate/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { QGenGenerationService, GenerationConfig } from '@/lib/qgen/services/generation-service';

const generationService = new QGenGenerationService();

// POST /api/qgen/generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { area, topic, difficulty, bloomLevel, questionType } = body;
    
    if (!area || !topic || !difficulty || !bloomLevel || !questionType) {
      return NextResponse.json({
        error: 'Missing required fields: area, topic, difficulty, bloomLevel, questionType',
      }, { status: 400 });
    }
    
    const config: GenerationConfig = {
      area,
      topic,
      subtopic: body.subtopic,
      difficulty: Math.max(1, Math.min(5, difficulty)),
      bloomLevel,
      questionType,
      keyConcepts: body.keyConcepts || [],
      misconceptionsToExplore: body.misconceptions || [],
      clinicalScenario: body.clinicalScenario,
      numAlternatives: body.numAlternatives || 4,
      includeExplanation: body.includeExplanation ?? true,
      llmModel: body.llmModel,
      temperature: body.temperature,
      maxRetries: body.maxRetries || 3,
      autoValidate: body.autoValidate ?? true,
      minQualityScore: body.minQualityScore || 0.70,
    };
    
    const result = await generationService.generateQuestion(config);
    
    return NextResponse.json({
      success: result.success,
      question: result.question,
      validation: result.validation ? {
        decision: result.validation.decision,
        scores: result.validation.scores,
        issues: result.validation.issues,
      } : null,
      retryCount: result.retryCount,
    });
    
  } catch (error) {
    console.error('QGen generation error:', error);
    return NextResponse.json({
      error: 'Generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================================
// BATCH GENERATION
// src/app/api/qgen/generate/batch/route.ts
// ============================================================

// POST /api/qgen/generate/batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configs } = body;
    
    if (!configs || !Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json({
        error: 'Missing or empty configs array',
      }, { status: 400 });
    }
    
    if (configs.length > 50) {
      return NextResponse.json({
        error: 'Maximum 50 questions per batch',
      }, { status: 400 });
    }
    
    const result = await generationService.generateBatch(configs);
    
    return NextResponse.json({
      summary: result.summary,
      questions: result.results
        .filter(r => r.success)
        .map(r => r.question),
      errors: result.results
        .filter(r => !r.success)
        .map((r, i) => ({
          index: i,
          errors: r.generationLog.errors,
        })),
    });
    
  } catch (error) {
    console.error('QGen batch generation error:', error);
    return NextResponse.json({
      error: 'Batch generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================================
// EXAM GENERATION
// src/app/api/qgen/exam/route.ts
// ============================================================

// POST /api/qgen/exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, totalQuestions, distribution } = body;
    
    if (!name || !totalQuestions || !distribution) {
      return NextResponse.json({
        error: 'Missing required fields: name, totalQuestions, distribution',
      }, { status: 400 });
    }
    
    if (totalQuestions > 120) {
      return NextResponse.json({
        error: 'Maximum 120 questions per exam',
      }, { status: 400 });
    }
    
    const result = await generationService.generateExam({
      name,
      totalQuestions,
      distribution,
      bloomDistribution: body.bloomDistribution,
      questionTypes: body.questionTypes,
    });
    
    return NextResponse.json({
      exam: {
        name: result.exam.name,
        totalQuestions: result.exam.questions.length,
        metadata: result.exam.metadata,
        questions: result.exam.questions,
      },
    });
    
  } catch (error) {
    console.error('QGen exam generation error:', error);
    return NextResponse.json({
      error: 'Exam generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================================
// ADAPTIVE GENERATION (DDL-INTEGRATED)
// src/app/api/qgen/adaptive/route.ts
// ============================================================

// POST /api/qgen/adaptive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { userId, classificationResult } = body;
    
    if (!userId || !classificationResult) {
      return NextResponse.json({
        error: 'Missing required fields: userId, classificationResult',
      }, { status: 400 });
    }
    
    const result = await generationService.generateAdaptiveQuestion({
      userId,
      classificationResult,
      previousQuestionId: body.previousQuestionId,
      previousScore: body.previousScore,
    });
    
    return NextResponse.json({
      success: result.success,
      question: result.question,
      adaptiveContext: {
        targetGap: classificationResult.classification,
        difficultyUsed: result.question?.targetDifficulty,
        bloomLevelUsed: result.question?.bloomLevel,
        conceptsTested: result.question?.misconceptionsExploited,
      },
    });
    
  } catch (error) {
    console.error('QGen adaptive generation error:', error);
    return NextResponse.json({
      error: 'Adaptive generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================================
// MISCONCEPTIONS ENDPOINT
// src/app/api/qgen/misconceptions/route.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';

// GET /api/qgen/misconceptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const topic = searchParams.get('topic');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    let query = supabase
      .from('qgen_misconceptions')
      .select('*')
      .order('prevalence_estimate', { ascending: false });
    
    if (area) {
      query = query.eq('area_id', area);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ misconceptions: data });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch misconceptions',
    }, { status: 500 });
  }
}

// ============================================================
// CORPUS STATS ENDPOINT
// src/app/api/qgen/stats/route.ts
// ============================================================

// GET /api/qgen/stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || undefined;
    const area = searchParams.get('area') || undefined;
    
    const corpusAnalyzer = new CorpusAnalysisService();
    
    const stats = await corpusAnalyzer.getCorpusStatistics({
      source,
      area,
    });
    
    return NextResponse.json({ stats });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch stats',
    }, { status: 500 });
  }
}
```

---

## 4. Fluxo DDL → QGen Integrado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DDL → QGEN ADAPTIVE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐                                                   │
│  │  Estudante Responde   │                                                   │
│  │  Questão DDL           │                                                   │
│  └──────────┬─────────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────┐                                                   │
│  │  DDL Pipeline          │                                                   │
│  │  • Análise Semântica    │                                                   │
│  │  • Análise Comportamental│                                                  │
│  │  • Classificação Fusion │                                                   │
│  └──────────┬─────────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────────────────────────────────┐                        │
│  │  CLASSIFICAÇÃO DDL                                │                        │
│  │                                                   │                        │
│  │  ┌─────┐  ┌──────┐  ┌─────┐                      │                        │
│  │  │ LE  │  │ LEm  │  │ LIE │                      │                        │
│  │  │     │  │      │  │     │                      │                        │
│  │  └──┬──┘  └──┬───┘  └──┬──┘                      │                        │
│  │     │        │         │                          │                        │
│  └─────┼────────┼─────────┼──────────────────────────┘                        │
│        │        │         │                                                   │
│        ▼        ▼         ▼                                                   │
│  ┌──────────────────────────────────────────────────┐                        │
│  │  ADAPTIVE STRATEGY SELECTOR                       │                        │
│  │                                                   │                        │
│  │  LE → {                                           │                        │
│  │    difficulty: 2,                                 │                        │
│  │    bloom: COMPREHENSION,                          │                        │
│  │    type: CONCEPTUAL,                              │                        │
│  │    focus: "conceitos ausentes"                    │                        │
│  │  }                                                │                        │
│  │                                                   │                        │
│  │  LEm → {                                          │                        │
│  │    difficulty: 3,                                 │                        │
│  │    bloom: APPLICATION,                            │                        │
│  │    type: CLINICAL_CASE,                           │                        │
│  │    focus: "aplicação de conceitos parciais"       │                        │
│  │  }                                                │                        │
│  │                                                   │                        │
│  │  LIE → {                                          │                        │
│  │    difficulty: 4,                                 │                        │
│  │    bloom: ANALYSIS,                               │                        │
│  │    type: CLINICAL_CASE,                           │                        │
│  │    focus: "integração entre conceitos"            │                        │
│  │  }                                                │                        │
│  └──────────────────────┬───────────────────────────┘                        │
│                         │                                                     │
│                         ▼                                                     │
│  ┌──────────────────────────────────────────────────┐                        │
│  │  QGEN GENERATION SERVICE                          │                        │
│  │                                                   │                        │
│  │  1. Enrichment (misconceptions, templates)        │                        │
│  │  2. Prompt Build (+ DDL context injection)        │                        │
│  │  3. LLM Generation (Claude Sonnet)                │                        │
│  │  4. Validation Pipeline (6 stages)                │                        │
│  │  5. Distractor Refinement (if needed)             │                        │
│  └──────────────────────┬───────────────────────────┘                        │
│                         │                                                     │
│                         ▼                                                     │
│  ┌──────────────────────────────────────────────────┐                        │
│  │  QUESTÃO ADAPTATIVA GERADA                        │                        │
│  │                                                   │                        │
│  │  • Calibrada para o tipo de lacuna                │                        │
│  │  • Testa conceitos específicos identificados      │                        │
│  │  • Distratores exploram misconceptions reais      │                        │
│  │  • Difficulty matched ao nível do estudante        │                        │
│  └──────────────────────┬───────────────────────────┘                        │
│                         │                                                     │
│                         ▼                                                     │
│  ┌──────────────────────────────────────────────────┐                        │
│  │  FEEDBACK LOOP                                    │                        │
│  │                                                   │                        │
│  │  Estudante responde nova questão → DDL reclassifica│                       │
│  │  → Atualiza perfil → Gera próxima questão          │                       │
│  │                                                    │                       │
│  │  Métricas:                                         │                       │
│  │  • Taxa de acerto por tipo de lacuna               │                       │
│  │  • Progressão temporal                              │                       │
│  │  • Convergência de misconceptions                  │                       │
│  └──────────────────────────────────────────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Exemplo de Chamada da API

```typescript
// ============================================================
// EXAMPLE: Generate Single Question
// ============================================================

const response = await fetch('/api/qgen/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    area: 'Clínica Médica',
    topic: 'Cardiologia',
    subtopic: 'Insuficiência Cardíaca',
    difficulty: 3,
    bloomLevel: 'APPLICATION',
    questionType: 'CLINICAL_CASE',
    keyConcepts: ['ICC', 'FE preservada', 'BNP', 'diuréticos'],
    misconceptions: ['ICC FE preservada = sem IC'],
    numAlternatives: 5,
    includeExplanation: true,
    autoValidate: true,
    minQualityScore: 0.75,
  }),
});

const result = await response.json();
// result.question: GeneratedQuestion
// result.validation: { decision, scores, issues }

// ============================================================
// EXAMPLE: Generate Exam (ENAMED-style)
// ============================================================

const examResponse = await fetch('/api/qgen/exam', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Simulado ENAMED 2026',
    totalQuestions: 100,
    distribution: [
      { area: 'Clínica Médica', percentage: 27, difficultyRange: [2, 5] },
      { area: 'Cirurgia', percentage: 18, difficultyRange: [2, 4] },
      { area: 'Pediatria', percentage: 17, difficultyRange: [2, 4] },
      { area: 'Ginecologia e Obstetrícia', percentage: 17, difficultyRange: [2, 4] },
      { area: 'Medicina Preventiva', percentage: 12, difficultyRange: [2, 3] },
      { area: 'Psiquiatria', percentage: 6, difficultyRange: [2, 3] },
      { area: 'Ética', percentage: 3, difficultyRange: [2, 3] },
    ],
    bloomDistribution: [
      { level: 'KNOWLEDGE', percentage: 10 },
      { level: 'COMPREHENSION', percentage: 10 },
      { level: 'APPLICATION', percentage: 35 },
      { level: 'ANALYSIS', percentage: 25 },
      { level: 'SYNTHESIS', percentage: 10 },
      { level: 'EVALUATION', percentage: 10 },
    ],
  }),
});

// ============================================================
// EXAMPLE: Adaptive Question (DDL-integrated)
// ============================================================

const adaptiveResponse = await fetch('/api/qgen/adaptive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'student-123',
    classificationResult: {
      classification: 'LIE',
      confidence: 0.82,
      details: {
        area: 'Clínica Médica',
        topic: 'Cardiologia',
        disconnectedConcepts: ['IECA', 'bradicinina', 'tosse'],
        integrationErrors: ['IECA = BRA em mecanismo'],
      },
    },
    previousQuestionId: 'q-456',
    previousScore: 0, // errou
  }),
});
```

---

## 6. Estrutura de Diretórios Final

```
apps/web/src/
├── app/
│   └── api/
│       └── qgen/
│           ├── generate/
│           │   ├── route.ts            # POST: Single question
│           │   └── batch/
│           │       └── route.ts        # POST: Batch generation
│           ├── exam/
│           │   └── route.ts            # POST: Exam generation
│           ├── adaptive/
│           │   └── route.ts            # POST: DDL-adaptive
│           ├── misconceptions/
│           │   └── route.ts            # GET: Misconceptions DB
│           ├── stats/
│           │   └── route.ts            # GET: Corpus statistics
│           └── validate/
│               └── route.ts            # POST: Validate question
├── lib/
│   └── qgen/
│       ├── types/
│       │   └── features.ts            # All TypeScript interfaces
│       ├── prompts/
│       │   ├── system-prompt.ts       # Main system prompt
│       │   ├── clinical-case.ts       # Clinical case generator
│       │   ├── conceptual.ts          # Conceptual question generator
│       │   ├── image-based.ts         # Image/exam interpretation
│       │   ├── distractor-generator.ts # Distractor refinement
│       │   ├── quality-validator.ts    # Quality validation prompt
│       │   ├── complete-template.ts    # Full generation template
│       │   └── few-shot-examples.ts   # Examples by specialty
│       └── services/
│           ├── generation-service.ts   # Main generation service
│           ├── validation-service.ts   # 6-stage validation pipeline
│           └── corpus-analysis-service.ts # Feature extraction
```

Este é o Parte 4 completo. Deseja que eu continue com a Parte 5 (Frontend Dashboard, Analytics e Roadmap de Implementação)?
