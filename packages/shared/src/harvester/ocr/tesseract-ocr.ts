/**
 * OCR com Tesseract.js
 *
 * Extrai texto de PDFs escaneados e imagens.
 * Usa Tesseract.js para processamento client-side ou Node.js.
 */

import type { OCRResult, OCRPage, OCRBlock } from '../types';

// ============================================
// Tipos internos
// ============================================

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractLine {
  text: string;
  confidence: number;
  words: TesseractWord[];
}

interface TesseractBlock {
  text: string;
  confidence: number;
  lines: TesseractLine[];
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractPage {
  text: string;
  confidence: number;
  blocks: TesseractBlock[];
}

interface TesseractRecognizeResult {
  data: TesseractPage;
}

interface TesseractWorker {
  loadLanguage(lang: string): Promise<void>;
  initialize(lang: string): Promise<void>;
  recognize(image: Buffer | string): Promise<TesseractRecognizeResult>;
  terminate(): Promise<void>;
}

// ============================================
// Configuração
// ============================================

export interface OCRConfig {
  language?: string; // 'por' para português
  oem?: number; // OCR Engine Mode (0-3)
  psm?: number; // Page Segmentation Mode (0-13)
  preserveInterwordSpaces?: boolean;
}

const DEFAULT_CONFIG: OCRConfig = {
  language: 'por', // Português
  oem: 1, // LSTM only (mais preciso)
  psm: 3, // Fully automatic page segmentation
  preserveInterwordSpaces: true,
};

// ============================================
// OCR Engine
// ============================================

export class TesseractOCR {
  private config: OCRConfig;
  private worker: TesseractWorker | null = null;
  private initialized = false;

  constructor(config: Partial<OCRConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Inicializa o worker do Tesseract
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import para Tesseract.js
      const Tesseract = await this.importTesseract();

      this.worker = await Tesseract.createWorker();
      await this.worker.loadLanguage(this.config.language || 'por');
      await this.worker.initialize(this.config.language || 'por');

      this.initialized = true;
      console.log('✅ Tesseract OCR inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Tesseract:', error);
      throw new Error(
        `Falha ao inicializar OCR: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Importa Tesseract.js dinamicamente
   */
  private async importTesseract(): Promise<{
    createWorker: () => Promise<TesseractWorker>;
  }> {
    try {
      // Dynamic import para evitar erros de bundling
      const module = await (Function('return import("tesseract.js")')() as Promise<{
        createWorker: () => Promise<TesseractWorker>;
      }>);
      return module;
    } catch {
      throw new Error(
        'tesseract.js não instalado. Execute: pnpm add tesseract.js'
      );
    }
  }

  /**
   * Processa uma imagem e retorna o texto extraído
   */
  async processImage(imageBuffer: Buffer): Promise<OCRResult> {
    const startTime = Date.now();

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.worker) {
      return {
        success: false,
        text: '',
        confidence: 0,
        pages: [],
        processingTimeMs: Date.now() - startTime,
      };
    }

    try {
      const result = await this.worker.recognize(imageBuffer);
      const page = result.data;

      const ocrPage: OCRPage = {
        pageNumber: 1,
        text: page.text,
        confidence: page.confidence / 100,
        blocks: this.convertBlocks(page.blocks),
      };

      return {
        success: true,
        text: page.text,
        confidence: page.confidence / 100,
        pages: [ocrPage],
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        confidence: 0,
        pages: [],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Processa um PDF convertendo páginas para imagens primeiro
   */
  async processPDF(pdfBuffer: Buffer): Promise<OCRResult> {
    const startTime = Date.now();

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Converter PDF para imagens usando pdf-to-img ou pdf2pic
      const images = await this.pdfToImages(pdfBuffer);

      if (images.length === 0) {
        return {
          success: false,
          text: '',
          confidence: 0,
          pages: [],
          processingTimeMs: Date.now() - startTime,
        };
      }

      const pages: OCRPage[] = [];
      let fullText = '';
      let totalConfidence = 0;

      for (let i = 0; i < images.length; i++) {
        console.log(`📄 Processando página ${i + 1}/${images.length}...`);

        const result = await this.processImage(images[i]);

        if (result.success && result.pages.length > 0) {
          const page = result.pages[0];
          pages.push({
            ...page,
            pageNumber: i + 1,
          });
          fullText += `\n--- Página ${i + 1} ---\n${page.text}`;
          totalConfidence += result.confidence;
        }
      }

      return {
        success: pages.length > 0,
        text: fullText.trim(),
        confidence: pages.length > 0 ? totalConfidence / pages.length : 0,
        pages,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        confidence: 0,
        pages: [],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Converte PDF para array de imagens PNG
   */
  private async pdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
    try {
      // Tentar pdf-to-img primeiro
      const pdfToImg = await this.importPdfToImg();

      if (pdfToImg) {
        const document = await pdfToImg.pdf(pdfBuffer, { scale: 2.0 });
        const images: Buffer[] = [];

        for await (const page of document) {
          images.push(page);
        }

        return images;
      }
    } catch {
      // pdf-to-img não disponível
    }

    try {
      // Fallback: usar pdf2pic
      const pdf2pic = await this.importPdf2Pic();

      if (pdf2pic) {
        const converter = pdf2pic.fromBuffer(pdfBuffer, {
          density: 200,
          format: 'png',
          width: 2000,
          height: 2800,
        });

        // Obter número de páginas
        const pdfParse = await this.importPdfParse();
        const pdfData = await pdfParse(pdfBuffer);
        const numPages = pdfData.numpages || 1;

        const images: Buffer[] = [];
        for (let i = 1; i <= numPages; i++) {
          const result = await converter(i, { responseType: 'buffer' });
          if (result.buffer) {
            images.push(result.buffer);
          }
        }

        return images;
      }
    } catch {
      // pdf2pic não disponível
    }

    console.warn(
      '⚠️ Nenhuma biblioteca de conversão PDF disponível. Instale: pnpm add pdf-to-img ou pnpm add pdf2pic'
    );
    return [];
  }

  /**
   * Importa pdf-to-img dinamicamente
   */
  private async importPdfToImg(): Promise<{
    pdf: (
      buffer: Buffer,
      options?: { scale?: number }
    ) => AsyncIterable<Buffer>;
  } | null> {
    try {
      return await (Function('return import("pdf-to-img")')() as Promise<{
        pdf: (
          buffer: Buffer,
          options?: { scale?: number }
        ) => AsyncIterable<Buffer>;
      }>);
    } catch {
      return null;
    }
  }

  /**
   * Importa pdf2pic dinamicamente
   */
  private async importPdf2Pic(): Promise<{
    fromBuffer: (
      buffer: Buffer,
      options: Record<string, unknown>
    ) => (
      page: number,
      opts?: { responseType?: string }
    ) => Promise<{ buffer?: Buffer }>;
  } | null> {
    try {
      return await (Function('return import("pdf2pic")')() as Promise<{
        fromBuffer: (
          buffer: Buffer,
          options: Record<string, unknown>
        ) => (
          page: number,
          opts?: { responseType?: string }
        ) => Promise<{ buffer?: Buffer }>;
      }>);
    } catch {
      return null;
    }
  }

  /**
   * Importa pdf-parse dinamicamente
   */
  private async importPdfParse(): Promise<
    (buffer: Buffer) => Promise<{ numpages: number }>
  > {
    try {
      const module = await (Function('return import("pdf-parse")')() as Promise<{
        default: (buffer: Buffer) => Promise<{ numpages: number }>;
      }>);
      return module.default;
    } catch {
      // Fallback: assumir 1 página
      return async () => ({ numpages: 1 });
    }
  }

  /**
   * Converte blocos do Tesseract para formato interno
   */
  private convertBlocks(blocks: TesseractBlock[]): OCRBlock[] {
    return blocks.map((block) => ({
      text: block.text,
      confidence: block.confidence / 100,
      boundingBox: {
        x: block.bbox.x0,
        y: block.bbox.y0,
        width: block.bbox.x1 - block.bbox.x0,
        height: block.bbox.y1 - block.bbox.y0,
      },
    }));
  }

  /**
   * Fecha o worker do Tesseract
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

// ============================================
// Factory Function
// ============================================

export function createOCR(config?: Partial<OCRConfig>): TesseractOCR {
  return new TesseractOCR(config);
}

// ============================================
// Utility: Detectar se PDF precisa de OCR
// ============================================

export async function needsOCR(pdfBuffer: Buffer): Promise<boolean> {
  try {
    // Tentar extrair texto com pdf-parse
    const pdfParseModule = await (Function(
      'return import("pdf-parse")'
    )() as Promise<{
      default: (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    }>);
    const pdfParse = pdfParseModule.default;
    const data = await pdfParse(pdfBuffer);

    // Se tiver menos de 100 caracteres por página, provavelmente é escaneado
    const charsPerPage = data.text.length / (data.numpages || 1);
    return charsPerPage < 100;
  } catch {
    // Se não conseguir parsear, assumir que precisa OCR
    return true;
  }
}
