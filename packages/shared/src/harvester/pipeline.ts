/**
 * Question Harvester Pipeline
 *
 * Pipeline completo de coleta e processamento de questões médicas:
 * 1. Discovery - Encontrar fontes de provas
 * 2. Download - Baixar PDFs/páginas
 * 3. Extract - Extrair texto (OCR se necessário)
 * 4. Parse - Estruturar questões com LLM
 * 5. Validate - Verificar qualidade
 * 6. Store - Salvar no banco de dados
 */

import type {
  HarvestJob,
  HarvestJobStatus,
  HarvestError,
  HarvesterConfig,
  RawDocument,
  ParsedQuestion,
  OCRResult,
} from './types';
import {
  LLMQuestionParser,
  createQuestionParser,
} from './parsers/llm-question-parser';
import {
  BaseScraper,
  GenericPDFScraper,
  createSearchScraper,
  RESIDENCIA_SOURCES,
} from './scrapers/residencia-scraper';
import { TesseractOCR, needsOCR } from './ocr/tesseract-ocr';

// ============================================
// Pipeline Configuration
// ============================================

const DEFAULT_CONFIG: HarvesterConfig = {
  llmProvider: 'grok',
  ocrProvider: 'tesseract',
  maxConcurrentJobs: 2,
  maxDocumentsPerJob: 50,
  maxQuestionsPerDocument: 100,
  requestDelayMs: 1000,
  maxRequestsPerMinute: 30,
  minConfidenceThreshold: 0.7,
  requireManualReview: true,
};

// ============================================
// Pipeline Class
// ============================================

export class QuestionHarvesterPipeline {
  private config: HarvesterConfig;
  private parser: LLMQuestionParser | null = null;
  private ocr: TesseractOCR | null = null;
  private activeJobs: Map<string, HarvestJob> = new Map();

  constructor(config: Partial<HarvesterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Inicializa o parser LLM
   */
  initialize(apiKey: string, groupId?: string): void {
    this.parser = createQuestionParser(
      this.config.llmProvider,
      apiKey,
      groupId
    );
  }

  /**
   * Cria um novo job de harvesting
   */
  createJob(sourceId: string): HarvestJob {
    const job: HarvestJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceId,
      status: 'pending',
      documentsFound: 0,
      documentsProcessed: 0,
      questionsExtracted: 0,
      questionsValid: 0,
      errors: [],
      createdAt: new Date(),
    };

    this.activeJobs.set(job.id, job);
    return job;
  }

  /**
   * Executa um job completo de harvesting
   */
  async runJob(jobId: string): Promise<HarvestJob> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (!this.parser) {
      throw new Error('Parser not initialized. Call initialize() first.');
    }

    try {
      job.startedAt = new Date();

      // 1. CRAWLING - Descobrir documentos
      await this.updateJobStatus(job, 'crawling');
      const documents = await this.crawlSource(job);
      job.documentsFound = documents.length;

      if (documents.length === 0) {
        job.status = 'completed';
        job.completedAt = new Date();
        return job;
      }

      // 2. DOWNLOADING já feito no crawl

      // 3. EXTRACTING - Extrair texto
      await this.updateJobStatus(job, 'extracting');
      const extractedDocs = await this.extractText(job, documents);

      // 4. PARSING - Estruturar questões com LLM
      await this.updateJobStatus(job, 'parsing');
      const questions = await this.parseQuestions(job, extractedDocs);
      job.questionsExtracted = questions.length;

      // 5. VALIDATING - Verificar qualidade
      await this.updateJobStatus(job, 'validating');
      const validQuestions = await this.validateQuestions(job, questions);
      job.questionsValid = validQuestions.length;

      // 6. Marcar como completo
      job.status = 'completed';
      job.completedAt = new Date();

      return job;
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      this.addError(job, job.status, error);
      return job;
    }
  }

  /**
   * Etapa 1: Crawl source para encontrar documentos
   */
  private async crawlSource(job: HarvestJob): Promise<RawDocument[]> {
    const source = RESIDENCIA_SOURCES.find((s) => s.id === job.sourceId);

    let scraper: BaseScraper;

    if (source) {
      scraper = new GenericPDFScraper(source, {
        maxDocuments: this.config.maxDocumentsPerJob,
        delayMs: this.config.requestDelayMs,
      });
    } else {
      // Usar search scraper para fontes desconhecidas
      scraper = createSearchScraper(
        job.sourceId,
        [2023, 2024, 2025],
        {
          maxDocuments: this.config.maxDocumentsPerJob,
          delayMs: this.config.requestDelayMs,
        }
      );
    }

    const result = await scraper.scrape();

    for (const error of result.errors) {
      this.addError(job, 'crawling', new Error(error));
    }

    return result.documents;
  }

  /**
   * Etapa 3: Extrair texto dos documentos
   */
  private async extractText(
    job: HarvestJob,
    documents: RawDocument[]
  ): Promise<RawDocument[]> {
    const extractedDocs: RawDocument[] = [];

    for (const doc of documents) {
      try {
        if (doc.format === 'pdf') {
          const pdfBuffer = doc.content as Buffer;

          // Verificar se precisa OCR
          const requiresOCR = await needsOCR(pdfBuffer);

          if (!requiresOCR) {
            // Usar pdf-parse para PDFs de texto
            const text = await this.extractPDFText(pdfBuffer);
            doc.extractedText = text;
            doc.ocrRequired = false;
          } else {
            // PDF escaneado, precisa OCR
            doc.ocrRequired = true;
            console.log(`📷 OCR necessário para ${doc.filename || doc.url}`);

            const ocrResult = await this.runOCR(pdfBuffer);
            if (ocrResult.success) {
              doc.extractedText = ocrResult.text;
              console.log(`   ✅ OCR: ${ocrResult.pages.length} páginas, ${(ocrResult.confidence * 100).toFixed(0)}% confiança`);
            } else {
              doc.extractedText = '';
              console.log(`   ❌ OCR falhou`);
            }
          }

          extractedDocs.push(doc);
        } else if (doc.format === 'html') {
          // HTML já tem texto
          doc.extractedText = this.stripHTML(doc.content as string);
          extractedDocs.push(doc);
        }

        job.documentsProcessed++;
      } catch (error) {
        this.addError(job, 'extracting', error, doc.id);
      }
    }

    return extractedDocs;
  }

  /**
   * Etapa 4: Parsear questões com LLM
   */
  private async parseQuestions(
    job: HarvestJob,
    documents: RawDocument[]
  ): Promise<ParsedQuestion[]> {
    const allQuestions: ParsedQuestion[] = [];

    for (const doc of documents) {
      if (!doc.extractedText) continue;

      try {
        // Dividir texto em chunks se muito grande
        const chunks = this.splitIntoChunks(doc.extractedText, 8000);

        for (const chunk of chunks) {
          const result = await this.parser!.parseText(chunk, doc.sourceId);

          if (result.success) {
            // Enriquecer com metadata do documento
            const enrichedQuestions = result.questions.map((q) => ({
              ...q,
              documentId: doc.id,
              sourceId: doc.sourceId,
            }));

            allQuestions.push(...enrichedQuestions);
          }

          if (result.errors) {
            for (const error of result.errors) {
              this.addError(job, 'parsing', new Error(error), doc.id);
            }
          }

          // Rate limiting
          await this.delay(this.config.requestDelayMs);
        }
      } catch (error) {
        this.addError(job, 'parsing', error, doc.id);
      }
    }

    return allQuestions;
  }

  /**
   * Etapa 5: Validar questões
   */
  private async validateQuestions(
    job: HarvestJob,
    questions: ParsedQuestion[]
  ): Promise<ParsedQuestion[]> {
    return questions.filter((q) => {
      // Verificar campos obrigatórios
      if (!q.stem || q.stem.length < 20) return false;
      if (!q.options || q.options.length < 4) return false;

      // Verificar confiança mínima
      if (q.confidence < this.config.minConfidenceThreshold) {
        q.needsReview = true;
      }

      // Verificar duplicatas (simplificado - por stem similar)
      // TODO: Implementar deduplicação com embeddings

      return true;
    });
  }

  /**
   * Extrair texto de PDF usando pdf-parse
   */
  private async extractPDFText(buffer: Buffer): Promise<string> {
    try {
      // Dynamic import with type assertion to avoid TS module resolution
      // pdf-parse should be installed: pnpm add pdf-parse
      const pdfParseModule = await (Function(
        'return import("pdf-parse")'
      )() as Promise<{ default: (buf: Buffer) => Promise<{ text: string }> }>);
      const pdfParse = pdfParseModule.default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch {
      // pdf-parse not installed or parsing failed
      return '';
    }
  }

  /**
   * OCR com Tesseract.js
   */
  private async runOCR(buffer: Buffer): Promise<OCRResult> {
    try {
      // Inicializar OCR se necessário
      if (!this.ocr) {
        this.ocr = new TesseractOCR({ language: 'por' });
        await this.ocr.initialize();
      }

      return await this.ocr.processPDF(buffer);
    } catch (error) {
      console.warn(`OCR falhou: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        text: '',
        confidence: 0,
        pages: [],
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Strip HTML tags
   */
  private stripHTML(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Dividir texto em chunks
   */
  private splitIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    // Dividir por questões se possível
    const questionPattern = /(?=QUEST[ÃA]O\s+\d+|^\d+[\.\)]\s)/gim;
    const parts = text.split(questionPattern);

    for (const part of parts) {
      if (currentChunk.length + part.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = part;
      } else {
        currentChunk += part;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Helpers
   */
  private async updateJobStatus(
    job: HarvestJob,
    status: HarvestJobStatus
  ): Promise<void> {
    job.status = status;
    console.log(`[${job.id}] Status: ${status}`);
  }

  private addError(
    job: HarvestJob,
    stage: HarvestJobStatus,
    error: unknown,
    documentId?: string
  ): void {
    const harvestError: HarvestError = {
      stage,
      documentId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
    };
    job.errors.push(harvestError);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Getters
   */
  getJob(jobId: string): HarvestJob | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllJobs(): HarvestJob[] {
    return Array.from(this.activeJobs.values());
  }
}

// ============================================
// Export Factory
// ============================================

export function createHarvesterPipeline(
  config?: Partial<HarvesterConfig>
): QuestionHarvesterPipeline {
  return new QuestionHarvesterPipeline(config);
}

// ============================================
// Quick Start Function
// ============================================

export async function harvestQuestions(
  sourceId: string,
  apiKey: string,
  provider: 'grok' | 'minimax' = 'grok',
  groupId?: string
): Promise<{
  job: HarvestJob;
  questions: ParsedQuestion[];
}> {
  const pipeline = createHarvesterPipeline({
    llmProvider: provider,
  });

  pipeline.initialize(apiKey, groupId);

  const job = pipeline.createJob(sourceId);
  await pipeline.runJob(job.id);

  // TODO: Retornar questões do storage
  return {
    job,
    questions: [], // Questões seriam retornadas do banco
  };
}
