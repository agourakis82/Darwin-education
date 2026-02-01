/**
 * Batch Downloader para Download Massivo de PDFs
 *
 * Features:
 * - Download paralelo com controle de concorrência
 * - Retry automático com backoff exponencial
 * - Progress tracking em tempo real
 * - Resume de downloads interrompidos
 * - Validação de PDF
 * - Rate limiting por domínio
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAllKnownUrls, getKnownUrlsCount, KNOWN_EXAM_URLS } from './scrapers/residencia-scraper';

// ============================================
// Types
// ============================================

export interface DownloadResult {
  url: string;
  source: string;
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
  retries: number;
  durationMs: number;
}

export interface BatchDownloadOptions {
  outputDir: string;
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  skipExisting?: boolean;
  sources?: string[];
  onProgress?: (progress: BatchProgress) => void;
}

export interface BatchProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  skipped: number;
  currentUrl?: string;
  bytesDownloaded: number;
  elapsedMs: number;
  estimatedRemainingMs?: number;
}

export interface BatchDownloadSummary {
  totalUrls: number;
  successful: number;
  failed: number;
  skipped: number;
  totalBytes: number;
  durationMs: number;
  results: DownloadResult[];
}

// ============================================
// Rate Limiter por Domínio
// ============================================

class DomainRateLimiter {
  private lastRequestByDomain: Map<string, number> = new Map();
  private minDelayMs: number;

  constructor(minDelayMs = 1000) {
    this.minDelayMs = minDelayMs;
  }

  async waitForDomain(url: string): Promise<void> {
    const domain = new URL(url).hostname;
    const lastRequest = this.lastRequestByDomain.get(domain) || 0;
    const elapsed = Date.now() - lastRequest;

    if (elapsed < this.minDelayMs) {
      await this.delay(this.minDelayMs - elapsed);
    }

    this.lastRequestByDomain.set(domain, Date.now());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// Batch Downloader Class
// ============================================

export class BatchDownloader {
  private options: Required<BatchDownloadOptions>;
  private rateLimiter: DomainRateLimiter;
  private abortController: AbortController | null = null;

  constructor(options: BatchDownloadOptions) {
    this.options = {
      outputDir: options.outputDir,
      concurrency: options.concurrency || 5,
      maxRetries: options.maxRetries || 3,
      retryDelayMs: options.retryDelayMs || 2000,
      timeoutMs: options.timeoutMs || 60000,
      skipExisting: options.skipExisting ?? true,
      sources: options.sources || [],
      onProgress: options.onProgress || (() => {}),
    };

    this.rateLimiter = new DomainRateLimiter(1500);
  }

  /**
   * Baixa todos os PDFs conhecidos
   */
  async downloadAll(): Promise<BatchDownloadSummary> {
    const startTime = Date.now();
    this.abortController = new AbortController();

    // Criar diretório de saída
    fs.mkdirSync(this.options.outputDir, { recursive: true });

    // Obter URLs a baixar
    let urlsToDownload = getAllKnownUrls();

    // Filtrar por fontes se especificado
    if (this.options.sources.length > 0) {
      urlsToDownload = urlsToDownload.filter((item) =>
        this.options.sources.some(
          (s) =>
            item.source.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(item.source.toLowerCase())
        )
      );
    }

    console.log(`\n📥 Iniciando download de ${urlsToDownload.length} arquivos...`);
    console.log(`   Concorrência: ${this.options.concurrency}`);
    console.log(`   Diretório: ${this.options.outputDir}\n`);

    const results: DownloadResult[] = [];
    const progress: BatchProgress = {
      total: urlsToDownload.length,
      completed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      bytesDownloaded: 0,
      elapsedMs: 0,
    };

    // Processar em chunks de concorrência
    const chunks = this.chunkArray(urlsToDownload, this.options.concurrency);

    for (const chunk of chunks) {
      if (this.abortController?.signal.aborted) break;

      const chunkResults = await Promise.all(
        chunk.map((item) => this.downloadWithRetry(item.url, item.source))
      );

      for (const result of chunkResults) {
        results.push(result);
        progress.completed++;

        if (result.error === 'SKIPPED') {
          progress.skipped++;
        } else if (result.success) {
          progress.successful++;
          progress.bytesDownloaded += result.fileSize || 0;
        } else {
          progress.failed++;
        }

        progress.elapsedMs = Date.now() - startTime;
        progress.currentUrl = result.url;

        // Estimar tempo restante
        if (progress.successful > 0) {
          const avgTimePerFile = progress.elapsedMs / progress.completed;
          progress.estimatedRemainingMs = avgTimePerFile * (progress.total - progress.completed);
        }

        this.options.onProgress(progress);
      }
    }

    return {
      totalUrls: urlsToDownload.length,
      successful: progress.successful,
      failed: progress.failed,
      skipped: progress.skipped,
      totalBytes: progress.bytesDownloaded,
      durationMs: Date.now() - startTime,
      results,
    };
  }

  /**
   * Download com retry automático
   */
  private async downloadWithRetry(
    url: string,
    source: string
  ): Promise<DownloadResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    // Verificar se já existe
    const filename = this.getFilename(url, source);
    const filePath = path.join(this.options.outputDir, filename);

    if (this.options.skipExisting && fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 1000) {
        // Arquivo válido (>1KB)
        return {
          url,
          source,
          success: true,
          filePath,
          fileSize: stats.size,
          error: 'SKIPPED',
          retries: 0,
          durationMs: 0,
        };
      }
    }

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        // Rate limiting por domínio
        await this.rateLimiter.waitForDomain(url);

        const result = await this.downloadFile(url, source, filePath);
        return {
          ...result,
          retries: attempt,
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        // Não retry para erros 404
        if (lastError.includes('404') || lastError.includes('Not Found')) {
          break;
        }

        if (attempt < this.options.maxRetries) {
          const delay = this.options.retryDelayMs * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    return {
      url,
      source,
      success: false,
      error: lastError,
      retries: this.options.maxRetries,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Download de um arquivo
   */
  private async downloadFile(
    url: string,
    source: string,
    filePath: string
  ): Promise<Pick<DownloadResult, 'url' | 'source' | 'success' | 'filePath' | 'fileSize' | 'error'>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/pdf,*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Validar PDF
      if (!buffer.toString('utf8', 0, 4).startsWith('%PDF')) {
        throw new Error('Downloaded file is not a valid PDF');
      }

      // Salvar arquivo
      fs.writeFileSync(filePath, buffer);

      return {
        url,
        source,
        success: true,
        filePath,
        fileSize: buffer.length,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Gera nome do arquivo baseado na URL e fonte
   */
  private getFilename(url: string, source: string): string {
    // Extrair nome do arquivo da URL
    const urlParts = url.split('/');
    let filename = urlParts[urlParts.length - 1];

    // Decodificar URL encoding
    filename = decodeURIComponent(filename);

    // Limpar caracteres inválidos
    filename = filename.replace(/[<>:"/\\|?*]/g, '_');

    // Adicionar prefixo da fonte se não presente
    if (!filename.toLowerCase().includes(source.toLowerCase())) {
      filename = `${source}-${filename}`;
    }

    // Garantir extensão .pdf
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }

    return filename;
  }

  /**
   * Divide array em chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancela downloads em andamento
   */
  cancel(): void {
    this.abortController?.abort();
  }
}

// ============================================
// CLI Progress Display
// ============================================

export function createProgressDisplay(): (progress: BatchProgress) => void {
  let lastLine = '';

  return (progress: BatchProgress) => {
    const percent = ((progress.completed / progress.total) * 100).toFixed(1);
    const mbDownloaded = (progress.bytesDownloaded / 1024 / 1024).toFixed(1);
    const eta = progress.estimatedRemainingMs
      ? formatDuration(progress.estimatedRemainingMs)
      : '...';

    const filename = progress.currentUrl
      ? progress.currentUrl.split('/').pop()?.substring(0, 30) || ''
      : '';

    const line = `[${percent}%] ${progress.completed}/${progress.total} | ` +
      `✅ ${progress.successful} ❌ ${progress.failed} ⏭️ ${progress.skipped} | ` +
      `${mbDownloaded}MB | ETA: ${eta} | ${filename}`;

    // Limpar linha anterior e escrever nova
    if (lastLine) {
      process.stdout.write('\r' + ' '.repeat(lastLine.length) + '\r');
    }
    process.stdout.write(line);
    lastLine = line;

    // Nova linha quando completo
    if (progress.completed === progress.total) {
      console.log();
    }
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ============================================
// Quick Start Functions
// ============================================

/**
 * Download rápido de todas as provas conhecidas
 */
export async function downloadAllExams(
  outputDir: string,
  options?: Partial<BatchDownloadOptions>
): Promise<BatchDownloadSummary> {
  const downloader = new BatchDownloader({
    outputDir,
    ...options,
    onProgress: options?.onProgress || createProgressDisplay(),
  });

  return downloader.downloadAll();
}

/**
 * Download de provas de uma fonte específica
 */
export async function downloadFromSource(
  source: string,
  outputDir: string,
  options?: Partial<BatchDownloadOptions>
): Promise<BatchDownloadSummary> {
  const downloader = new BatchDownloader({
    outputDir,
    sources: [source],
    ...options,
    onProgress: options?.onProgress || createProgressDisplay(),
  });

  return downloader.downloadAll();
}

/**
 * Lista provas disponíveis por fonte
 */
export function listAvailableExams(): void {
  console.log('\n📚 Provas disponíveis para download:\n');

  for (const [source, urls] of Object.entries(KNOWN_EXAM_URLS)) {
    console.log(`  ${source.toUpperCase().padEnd(15)} ${urls.length} provas`);
  }

  console.log(`\n  Total: ${getKnownUrlsCount()} PDFs`);
}

// ============================================
// Export
// ============================================

export { KNOWN_EXAM_URLS, getAllKnownUrls, getKnownUrlsCount };
