/**
 * Question Harvester Module
 *
 * Sistema de coleta automatizada de questões médicas brasileiras.
 *
 * Uso:
 * ```typescript
 * import { createHarvesterPipeline, harvestQuestions } from '@darwin-education/shared/harvester';
 *
 * // Opção 1: Quick start
 * const { job, questions } = await harvestQuestions('fmusp', process.env.GROK_API_KEY!);
 *
 * // Opção 2: Pipeline customizado
 * const pipeline = createHarvesterPipeline({ llmProvider: 'minimax' });
 * pipeline.initialize(apiKey, groupId);
 * const job = pipeline.createJob('unifesp');
 * await pipeline.runJob(job.id);
 * ```
 */

// Types
export * from './types';

// Parsers
export {
  LLMQuestionParser,
  createQuestionParser,
  classifyArea,
} from './parsers/llm-question-parser';

// Vision Parser (SOTA++)
export {
  VisionQuestionParser,
  createVisionParser,
  fetchGabaritoFromURL,
} from './parsers/vision-question-parser';

export type {
  VisionParserConfig,
  PageImage,
  GabaritoEntry,
} from './parsers/vision-question-parser';

// Scrapers
export {
  BaseScraper,
  GenericPDFScraper,
  SearchBasedScraper,
  createResidenciaScraper,
  createSearchScraper,
  createBraveSearchScraper,
  createGoogleSearchScraper,
  scrapeAllSources,
  RESIDENCIA_SOURCES,
  KNOWN_EXAM_URLS,
} from './scrapers/residencia-scraper';

export type { SearchConfig, SearchResult } from './scrapers/residencia-scraper';

// OCR
export { TesseractOCR, createOCR, needsOCR } from './ocr/tesseract-ocr';
export type { OCRConfig } from './ocr/tesseract-ocr';

// Pipeline
export {
  QuestionHarvesterPipeline,
  createHarvesterPipeline,
  harvestQuestions,
} from './pipeline';
