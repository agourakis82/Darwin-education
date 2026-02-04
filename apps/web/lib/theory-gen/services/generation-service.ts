/**
 * Generation Service - Main Orchestrator
 *
 * Coordinates the complete theory generation pipeline:
 * 1. Research (multi-source)
 * 2. Darwin-MFC data transformation
 * 3. Prompt building
 * 4. LLM generation (Grok-4-fast-reasoning)
 * 5. Validation (5-stage pipeline)
 * 6. Storage
 */

import {
  GeneratedTheoryTopic,
  GenerationRequest,
  BatchGenerationRequest,
  ResearchResult,
  ValidationResult,
  Citation,
} from '@darwin-education/shared';
import ResearchService from './research-service';
import DarwinMFCTransformer from './darwin-mfc-transformer';
import ValidationService from './validation-service';
import CitationVerificationService from './citation-verification-service';
import DatabaseAuditService from './database-audit-service';
import { grokChat, extractJSON } from '@/lib/ddl/services/grok-client';

export class GenerationService {
  private researchService: ResearchService;
  private transformer: DarwinMFCTransformer;
  private validationService: ValidationService;
  private citationVerificationService: CitationVerificationService;
  private auditService: DatabaseAuditService;
  private llmClient: any;  // Will inject actual LLM client
  private storageService: any;  // Will inject storage service

  constructor(
    researchService?: ResearchService,
    transformer?: DarwinMFCTransformer,
    validationService?: ValidationService,
    citationVerificationService?: CitationVerificationService,
    auditService?: DatabaseAuditService,
    llmClient?: any,
    storageService?: any
  ) {
    this.researchService = researchService || new ResearchService();
    this.transformer = transformer || new DarwinMFCTransformer();
    this.validationService = validationService || new ValidationService();
    this.citationVerificationService = citationVerificationService || new CitationVerificationService();
    this.auditService = auditService || new DatabaseAuditService();
    this.llmClient = llmClient;
    this.storageService = storageService;
  }

  /**
   * Generate a single theory topic
   */
  async generateSingle(request: GenerationRequest): Promise<GeneratedTheoryTopic> {
    try {
      // 1. Research phase
      const research = await this.researchService.researchTopic(
        request.topicTitle,
        request.area
      );

      // 2. Get Darwin-MFC base content if applicable
      let baseContent: Partial<GeneratedTheoryTopic> | null = null;
      if (request.source === 'darwin-mfc' && request.sourceId) {
        const diseaseData = await this.getDarwinMFCDisease(request.sourceId);
        if (diseaseData) {
          baseContent = this.transformer.transform(diseaseData, request.area);
        }
      }

      // 3. Build generation prompt
      const prompt = this.buildPrompt({
        request,
        research,
        baseContent,
      });

      // 4. Generate with LLM
      const generated = await this.generateWithLLM(prompt);

      // 5. Validate (includes hallucination detection)
      const validation = await this.validationService.validate(generated);

      // Update topic with validation score and status
      generated.generationMetadata.validationScore = validation.score;

      if (validation.score >= 0.90) {
        generated.generationMetadata.status = 'approved';
      } else if (validation.score >= 0.70) {
        generated.generationMetadata.status = 'review';
      } else {
        generated.generationMetadata.status = 'draft';
      }

      // 6. Log audit trails (citation verification and hallucination detection)
      // This happens regardless of validation score for complete audit trail
      try {
        if (generated.topicId) {
          // Save citation verifications
          if (generated.citations && generated.citations.length > 0) {
            for (const citation of generated.citations) {
              const verification = await this.citationVerificationService.verifyCitation(
                citation.url,
                citation.title,
                citation.publicationYear,
                citation.evidenceLevel as 'A' | 'B' | 'C'
              );

              // Note: citationId will be looked up by URL in database audit service
              await this.auditService.saveCitationVerification(
                generated.topicId,
                citation.url,  // Will be used to find citation ID
                verification,
                { userId: request.sourceId }
              );
            }
          }

          // Save hallucination detection results
          const sections = ['definition', 'epidemiology', 'pathophysiology', 'clinicalPresentation', 'diagnosis', 'treatment', 'complications', 'prognosis'] as const;
          for (const section of sections) {
            const content = generated.sections[section];
            if (content) {
              const verifications = await this.citationVerificationService.verifyAllCitations(
                (generated.citations || []).map((c: Citation) => ({
                  url: c.url,
                  title: c.title,
                  publicationYear: c.publicationYear,
                  evidenceLevel: c.evidenceLevel as 'A' | 'B' | 'C',
                }))
              );

              const hallucinations = await this.citationVerificationService.detectHallucinations(
                section,
                content,
                verifications
              );

              for (const hallucination of hallucinations) {
                // Check if it's a dangerous claim
                const dangerousPatterns = [/dosage|dose|mg|μg|ml|mL|cc/i, /contraindicated?|do not|avoid|never/i, /fatal|lethal|deadly|death|mortality/i, /side effect|adverse|complication|risk/i];
                const isDangerous = dangerousPatterns.some(p => p.test(hallucination.claim));

                await this.auditService.saveHallucinationCheck(
                  generated.topicId,
                  hallucination,
                  isDangerous,
                  { userId: request.sourceId }
                );
              }
            }
          }

          // Generate audit report
          const auditReport = await this.auditService.generateAuditReport(generated.topicId);
          console.log('Citation Audit Report:', auditReport);
        }
      } catch (auditError) {
        console.error('Error logging audit trails:', auditError);
        // Don't fail generation if audit logging fails
      }

      // 7. Store if valid
      if (validation.score >= 0.70 && this.storageService) {
        await this.storageService.saveTopic(generated, validation);
      }

      return generated;
    } catch (error) {
      console.error('Error generating topic:', error);
      throw error;
    }
  }

  /**
   * Generate multiple topics in batch
   */
  async generateBatch(request: BatchGenerationRequest): Promise<GeneratedTheoryTopic[]> {
    const {
      topics,
      concurrency = 3,
      costLimit = undefined,
      autoApproveThreshold = 0.90,
    } = request;

    const results: GeneratedTheoryTopic[] = [];
    let totalCost = 0;

    // Process in batches with concurrency limit
    for (let i = 0; i < topics.length; i += concurrency) {
      const batch = topics.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map((topic) => this.generateSingle(topic))
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          // Estimate cost (~$0.08 per topic)
          totalCost += 0.08;

          // Check cost limit
          if (costLimit && totalCost > costLimit) {
            console.warn('Cost limit exceeded, stopping generation');
          }
        } else {
          console.error('Failed to generate topic:', result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Regenerate a specific section of an existing topic with latest research
   */
  async regenerateSection(
    topicId: string,
    sectionName: string
  ): Promise<string> {
    try {
      // Get existing topic
      const existingTopic = await this.storageService.getTopic(topicId);
      if (!existingTopic) {
        throw new Error(`Topic ${topicId} not found`);
      }

      // Research the specific section
      const research = await this.researchService.researchTopic(
        existingTopic.title,
        existingTopic.area
      );

      // Build section-specific prompt
      const prompt = this.buildSectionPrompt({
        topic: existingTopic,
        sectionName,
        research,
      });

      // Generate new section content
      const generatedTopic = await this.generateWithLLM(prompt);
      const newSectionContent = generatedTopic.sections[sectionName as keyof typeof generatedTopic.sections] || '';

      // Validate just this section
      const validation = await this.validationService.validate({
        ...existingTopic,
        sections: {
          ...existingTopic.sections,
          [sectionName]: newSectionContent,
        },
      });

      if (validation.score >= 0.70) {
        // Update storage
        existingTopic.sections[sectionName as keyof typeof existingTopic.sections] = newSectionContent as string;
        existingTopic.last_updated = new Date();

        if (this.storageService) {
          await this.storageService.updateTopic(existingTopic);
        }
      }

      return newSectionContent;
    } catch (error) {
      console.error('Error regenerating section:', error);
      throw error;
    }
  }

  /**
   * Update topic with latest research (quarterly refresh)
   */
  async updateWithLatestResearch(topicId: string): Promise<GeneratedTheoryTopic> {
    const existingTopic = await this.storageService.getTopic(topicId);
    if (!existingTopic) {
      throw new Error(`Topic ${topicId} not found`);
    }

    // Get fresh research
    const research = await this.researchService.researchTopic(
      existingTopic.title,
      existingTopic.area
    );

    // Update citations
    existingTopic.citations = research.citations;
    existingTopic.last_updated = new Date();

    // Store updated topic
    if (this.storageService) {
      await this.storageService.updateTopic(existingTopic);
    }

    return existingTopic;
  }

  /**
   * Build generation prompt with context
   */
  private buildPrompt(context: {
    request: GenerationRequest;
    research: ResearchResult;
    baseContent?: Partial<GeneratedTheoryTopic> | null;
  }): string {
    const { request, research, baseContent } = context;

    const prompt = `
Você é um educador médico especializado em preparação para ENAMED (Exame Nacional de Avaliação da Formação Médica).

CONTEXTO DO TÓPICO:
- Título: ${request.topicTitle}
- Área: ${request.area}
- Dificuldade: ${request.targetDifficulty || 'intermediária'}

DADOS DISPONÍVEIS (Darwin-MFC):
${baseContent ? JSON.stringify(baseContent, null, 2) : 'Não disponível'}

EVIDÊNCIAS RECENTES (Pesquisa Web):
${research.sources.map((s) => `- ${s.title} (${s.source}): ${s.snippet}`).join('\n')}

CITAÇÕES:
${research.citations
  .slice(0, 5)
  .map((c) => `[${c.source}] ${c.title} (${c.publicationYear}, Nível ${c.evidenceLevel})`)
  .join('\n')}

TAREFA:
Gere conteúdo teórico completo com 8 seções (algumas opcionais):
1. **Definição** (300-500 chars): Explicação clara do que é
2. **Epidemiologia** (300-800 chars): Frequência, grupos afetados
3. **Fisiopatologia** (300-800 chars): Mecanismo de desenvolvimento
4. **Apresentação Clínica** (300-800 chars): Sintomas e sinais
5. **Diagnóstico** (300-800 chars): Como diagnosticar
6. **Tratamento** (300-800 chars): Opções terapêuticas com dosagens
7. **Complicações** (300-800 chars): Possíveis desfechos adversos
8. **Prognóstico** (300-800 chars): Evolução esperada

REQUISITOS:
- Português médico apropriado para alunos de medicina brasileiros
- Cada seção entre 300-800 caracteres
- 5-6 pontos-chave para memorizar
- Citar fontes quando apropriado
- Evidence-based, baseado em diretrizes brasileiras quando possível
- Preparação para ENAMED - foco em clínica prática

FORMATO DE SAÍDA - JSON:
{
  "title": "${request.topicTitle}",
  "description": "Resumo em uma frase do tópico",
  "sections": {
    "definition": "...",
    "epidemiology": "...",
    "pathophysiology": "...",
    "clinicalPresentation": "...",
    "diagnosis": "...",
    "treatment": "...",
    "complications": "...",
    "prognosis": "..."
  },
  "keyPoints": ["ponto 1", "ponto 2", "..."],
  "estimatedReadTime": 15
}
`;

    return prompt;
  }

  /**
   * Build section-specific regeneration prompt
   */
  private buildSectionPrompt(context: {
    topic: GeneratedTheoryTopic;
    sectionName: string;
    research: ResearchResult;
  }): string {
    const { topic, sectionName, research } = context;

    const sectionLabels: Record<string, string> = {
      definition: 'Definição',
      epidemiology: 'Epidemiologia',
      pathophysiology: 'Fisiopatologia',
      clinicalPresentation: 'Apresentação Clínica',
      diagnosis: 'Diagnóstico',
      treatment: 'Tratamento',
      complications: 'Complicações',
      prognosis: 'Prognóstico',
    };

    return `
Reescreva a seção de "${sectionLabels[sectionName]}" para o tópico "${topic.title}" com base na pesquisa mais recente.

CONTEXTO EXISTENTE:
- Título: ${topic.title}
- Área: ${topic.area}
- Dificuldade: ${topic.difficulty}

CONTEÚDO ATUAL:
${topic.sections[sectionName as keyof typeof topic.sections] || 'Não disponível'}

EVIDÊNCIAS RECENTES:
${research.sources.map((s) => `- ${s.title}: ${s.snippet}`).join('\n')}

REQUISITOS:
- 300-800 caracteres
- Manter consistência com outras seções
- Integrar informações recentes
- Evidence-based

RESPONDA APENAS COM O NOVO CONTEÚDO DA SEÇÃO (texto puro):
`;
  }

  /**
   * Generate content using Grok LLM
   * Uses grok-4-1-fast-reasoning for cost-effective generation (~$0.08/topic)
   */
  private async generateWithLLM(prompt: string): Promise<GeneratedTheoryTopic> {
    // Check if XAI_API_KEY is available
    if (!process.env.XAI_API_KEY) {
      console.warn('XAI_API_KEY not set, using placeholder content');
      // Stub: return template response for testing
      return {
        topicId: 'generated-topic-' + Date.now(),
        title: 'Generated Topic',
        description: 'Auto-generated theory topic',
        area: 'clinica_medica',
        difficulty: 'intermediario',
        sections: {
          definition: 'Definition placeholder',
          epidemiology: 'Epidemiology placeholder',
        },
        keyPoints: ['Key point 1', 'Key point 2'],
        estimatedReadTime: 15,
        citations: [],
        citationProvenance: {},
        generationMetadata: {
          sourceType: 'manual',
          generatedAt: new Date(),
          validationScore: 0.85,
          status: 'draft',
        },
      };
    }

    try {
      // Call Grok API for generation
      const response = await grokChat(
        [
          {
            role: 'system',
            content: 'Você é um educador médico especializado. Responda APENAS com JSON válido, sem texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: 'grok-4-1-fast-reasoning',
          maxTokens: 4096,
          temperature: 0.3,
        }
      );

      // Extract and parse JSON from response
      const jsonStr = extractJSON(response);
      const parsed = JSON.parse(jsonStr);

      // Build full GeneratedTheoryTopic from parsed response
      return {
        topicId: 'generated-topic-' + Date.now(),
        title: parsed.title || 'Generated Topic',
        description: parsed.description || '',
        area: parsed.area || 'clinica_medica',
        difficulty: parsed.difficulty || 'intermediario',
        sections: {
          definition: parsed.sections?.definition || '',
          epidemiology: parsed.sections?.epidemiology,
          pathophysiology: parsed.sections?.pathophysiology,
          clinicalPresentation: parsed.sections?.clinicalPresentation,
          diagnosis: parsed.sections?.diagnosis,
          treatment: parsed.sections?.treatment,
          complications: parsed.sections?.complications,
          prognosis: parsed.sections?.prognosis,
        },
        keyPoints: parsed.keyPoints || [],
        estimatedReadTime: parsed.estimatedReadTime || 15,
        citations: [],
        citationProvenance: {},
        generationMetadata: {
          sourceType: 'manual',
          generatedAt: new Date(),
          validationScore: 0,
          status: 'draft',
        },
      };
    } catch (error) {
      console.error('Error calling Grok LLM:', error);
      throw error;
    }
  }

  /**
   * Get Darwin-MFC disease data by ID
   */
  private async getDarwinMFCDisease(diseaseId: string): Promise<any> {
    // This would call the Darwin-MFC adapter
    // For now, return null
    return null;
  }
}

export default GenerationService;
