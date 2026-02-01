/**
 * Types for the Question Harvester System
 *
 * Sistema de coleta automatizada de questões médicas
 */

// ============================================
// Fonte de Questões
// ============================================

export type QuestionSourceType =
  | 'residencia'      // Provas de residência médica
  | 'enamed'          // ENAMED/ENADE Medicina
  | 'revalida'        // Revalida INEP
  | 'concurso_sus'    // Concursos do SUS
  | 'banco_publico'   // Bancos de questões públicos
  | 'simulado'        // Simulados de cursinhos (com permissão)
  | 'outro';

export interface QuestionSource {
  id: string;
  name: string;
  type: QuestionSourceType;
  url: string;
  institution?: string;
  year?: number;
  crawlable: boolean;
  lastCrawled?: Date;
  questionCount?: number;
}

// ============================================
// Documento Bruto
// ============================================

export type DocumentFormat = 'pdf' | 'html' | 'image' | 'docx';

export interface RawDocument {
  id: string;
  sourceId: string;
  url: string;
  format: DocumentFormat;
  filename?: string;
  content: Buffer | string;
  extractedText?: string;
  ocrRequired: boolean;
  downloadedAt: Date;
  metadata: Record<string, unknown>;
}

// ============================================
// Questão Extraída (antes do parsing LLM)
// ============================================

export interface RawQuestionBlock {
  documentId: string;
  pageNumber?: number;
  rawText: string;
  imageData?: string; // base64 se tiver figura
  position: {
    start: number;
    end: number;
  };
}

// ============================================
// Questão Parseada (depois do LLM)
// ============================================

export interface ParsedQuestion {
  id: string;
  sourceId: string;
  documentId: string;

  // Conteúdo
  stem: string;                    // Enunciado
  options: ParsedOption[];         // Alternativas
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  explanation?: string;            // Comentário/explicação se disponível

  // Metadados extraídos
  area?: string;                   // Área médica
  subspecialty?: string;           // Subespecialidade
  topics?: string[];               // Tópicos/temas
  difficulty?: 'easy' | 'medium' | 'hard';

  // Referências médicas
  icd10Codes?: string[];           // Códigos CID-10 relacionados
  atcCodes?: string[];             // Códigos ATC de medicamentos
  procedures?: string[];           // Procedimentos mencionados

  // Controle de qualidade
  confidence: number;              // 0-1, confiança do parsing
  needsReview: boolean;
  parseErrors?: string[];

  // Timestamps
  parsedAt: Date;
  validatedAt?: Date;
}

export interface ParsedOption {
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  isCorrect?: boolean;
}

// ============================================
// Job de Harvesting
// ============================================

export type HarvestJobStatus =
  | 'pending'
  | 'crawling'
  | 'downloading'
  | 'extracting'
  | 'parsing'
  | 'validating'
  | 'completed'
  | 'failed';

export interface HarvestJob {
  id: string;
  sourceId: string;
  status: HarvestJobStatus;

  // Progresso
  documentsFound: number;
  documentsProcessed: number;
  questionsExtracted: number;
  questionsValid: number;

  // Erros
  errors: HarvestError[];

  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface HarvestError {
  stage: HarvestJobStatus;
  documentId?: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

// ============================================
// Configuração do Harvester
// ============================================

export interface HarvesterConfig {
  // LLM para parsing
  llmProvider: 'grok' | 'minimax';
  llmApiKey?: string;

  // OCR
  ocrProvider: 'tesseract' | 'google_vision' | 'aws_textract';
  ocrApiKey?: string;

  // Limites
  maxConcurrentJobs: number;
  maxDocumentsPerJob: number;
  maxQuestionsPerDocument: number;

  // Rate limiting
  requestDelayMs: number;
  maxRequestsPerMinute: number;

  // Qualidade
  minConfidenceThreshold: number;
  requireManualReview: boolean;
}

// ============================================
// Resultados de Parsing
// ============================================

export interface LLMParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  rawResponse: string;
  tokensUsed: number;
  processingTimeMs: number;
  errors?: string[];
}

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  pages: OCRPage[];
  processingTimeMs: number;
}

export interface OCRPage {
  pageNumber: number;
  text: string;
  confidence: number;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}
