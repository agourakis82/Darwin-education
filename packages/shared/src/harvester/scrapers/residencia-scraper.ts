/**
 * Scraper para Provas de Residência Médica
 *
 * Coleta provas das principais instituições brasileiras:
 * - USP (FMUSP)
 * - UNIFESP
 * - UNICAMP
 * - UFMG
 * - ENARE
 * - SUS-SP
 */

import type { QuestionSource, RawDocument, DocumentFormat } from '../types';

// ============================================
// Fontes Conhecidas
// ============================================

export const RESIDENCIA_SOURCES: QuestionSource[] = [
  {
    id: 'fmusp',
    name: 'FMUSP - Faculdade de Medicina da USP',
    type: 'residencia',
    url: 'https://www.fm.usp.br/residencia',
    institution: 'USP',
    crawlable: true,
  },
  {
    id: 'unifesp',
    name: 'UNIFESP - Universidade Federal de São Paulo',
    type: 'residencia',
    url: 'https://www.unifesp.br/campus/sao/residencia-medica',
    institution: 'UNIFESP',
    crawlable: true,
  },
  {
    id: 'unicamp',
    name: 'UNICAMP - Universidade Estadual de Campinas',
    type: 'residencia',
    url: 'https://www.fcm.unicamp.br/fcm/residencia-medica',
    institution: 'UNICAMP',
    crawlable: true,
  },
  {
    id: 'ufmg',
    name: 'UFMG - Universidade Federal de Minas Gerais',
    type: 'residencia',
    url: 'https://www.medicina.ufmg.br/residencia',
    institution: 'UFMG',
    crawlable: true,
  },
  {
    id: 'enare',
    name: 'ENARE - Exame Nacional de Residência',
    type: 'residencia',
    url: 'https://www.gov.br/ebserh/pt-br/enare',
    institution: 'EBSERH',
    crawlable: true,
  },
  {
    id: 'sus-sp',
    name: 'SUS-SP - Sistema de Residência do Estado de São Paulo',
    type: 'residencia',
    url: 'https://www.vunesp.com.br/sus-sp',
    institution: 'SES-SP',
    crawlable: true,
  },
  {
    id: 'amrigs',
    name: 'AMRIGS - RS',
    type: 'residencia',
    url: 'https://www.amrigs.org.br/residencia',
    institution: 'AMRIGS',
    crawlable: true,
  },
  {
    id: 'uerj',
    name: 'UERJ - Universidade do Estado do Rio de Janeiro',
    type: 'residencia',
    url: 'https://www.uerj.br/residencia-medica',
    institution: 'UERJ',
    crawlable: true,
  },
];

// ============================================
// Scraper Interface
// ============================================

export interface ScraperResult {
  success: boolean;
  documents: RawDocument[];
  errors: string[];
  nextCrawlUrls?: string[];
}

export interface ScraperOptions {
  yearFrom?: number;
  yearTo?: number;
  maxDocuments?: number;
  userAgent?: string;
  delayMs?: number;
}

// ============================================
// Base Scraper Class
// ============================================

export abstract class BaseScraper {
  protected source: QuestionSource;
  protected options: Required<ScraperOptions>;

  constructor(source: QuestionSource, options: ScraperOptions = {}) {
    this.source = source;
    this.options = {
      yearFrom: options.yearFrom || 2015,
      yearTo: options.yearTo || new Date().getFullYear(),
      maxDocuments: options.maxDocuments || 100,
      userAgent:
        options.userAgent ||
        'Mozilla/5.0 (compatible; DarwinEducation/1.0; +https://darwin.education)',
      delayMs: options.delayMs || 1000,
    };
  }

  abstract scrape(): Promise<ScraperResult>;

  protected async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.options.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
  }

  protected async fetchPDF(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.options.userAgent,
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Validar que é um PDF
    if (!buffer.toString('utf8', 0, 4).startsWith('%PDF')) {
      throw new Error('Downloaded file is not a valid PDF');
    }

    return buffer;
  }

  protected async delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
  }

  protected extractPDFLinks(html: string): string[] {
    const pdfPattern = /href=["']([^"']+\.pdf)["']/gi;
    const links: string[] = [];
    let match;

    while ((match = pdfPattern.exec(html)) !== null) {
      let url = match[1];

      // Converter para URL absoluta se necessário
      if (url.startsWith('/')) {
        const baseUrl = new URL(this.source.url);
        url = `${baseUrl.protocol}//${baseUrl.host}${url}`;
      } else if (!url.startsWith('http')) {
        url = new URL(url, this.source.url).href;
      }

      links.push(url);
    }

    return [...new Set(links)]; // Remove duplicatas
  }

  protected inferYearFromUrl(url: string): number | undefined {
    // Procura por ano no URL (ex: prova_2024.pdf, 2023/prova.pdf)
    const yearMatch = url.match(/20[12][0-9]/);
    return yearMatch ? parseInt(yearMatch[0], 10) : undefined;
  }

  protected inferDocumentType(
    url: string
  ): 'prova' | 'gabarito' | 'comentario' | 'unknown' {
    const lowerUrl = url.toLowerCase();

    if (
      lowerUrl.includes('gabarito') ||
      lowerUrl.includes('resposta') ||
      lowerUrl.includes('answer')
    ) {
      return 'gabarito';
    }

    if (lowerUrl.includes('comentario') || lowerUrl.includes('resolucao')) {
      return 'comentario';
    }

    if (
      lowerUrl.includes('prova') ||
      lowerUrl.includes('caderno') ||
      lowerUrl.includes('exam')
    ) {
      return 'prova';
    }

    return 'unknown';
  }
}

// ============================================
// Generic PDF Scraper
// ============================================

export class GenericPDFScraper extends BaseScraper {
  async scrape(): Promise<ScraperResult> {
    const documents: RawDocument[] = [];
    const errors: string[] = [];

    try {
      console.log(`Scraping ${this.source.name}...`);

      // Buscar página principal
      const html = await this.fetchPage(this.source.url);

      // Extrair links de PDF
      const pdfLinks = this.extractPDFLinks(html);
      console.log(`Found ${pdfLinks.length} PDF links`);

      // Filtrar por ano
      const filteredLinks = pdfLinks.filter((url) => {
        const year = this.inferYearFromUrl(url);
        if (!year) return true; // Incluir se não conseguir determinar ano
        return year >= this.options.yearFrom && year <= this.options.yearTo;
      });

      // Baixar PDFs (com limite)
      const linksToProcess = filteredLinks.slice(0, this.options.maxDocuments);

      for (const url of linksToProcess) {
        try {
          await this.delay();

          const content = await this.fetchPDF(url);
          const year = this.inferYearFromUrl(url);
          const docType = this.inferDocumentType(url);

          documents.push({
            id: `${this.source.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceId: this.source.id,
            url,
            format: 'pdf' as DocumentFormat,
            filename: url.split('/').pop() || 'document.pdf',
            content,
            ocrRequired: false, // Será determinado depois
            downloadedAt: new Date(),
            metadata: {
              year,
              documentType: docType,
              institution: this.source.institution,
            },
          });

          console.log(`Downloaded: ${url}`);
        } catch (e) {
          errors.push(`Failed to download ${url}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      errors.push(`Scraper error: ${e instanceof Error ? e.message : String(e)}`);
    }

    return {
      success: documents.length > 0,
      documents,
      errors,
    };
  }
}

// ============================================
// URLs Conhecidas de Provas (fontes diretas)
// Atualizado com URLs verificadas de múltiplas fontes
// ============================================

export const KNOWN_EXAM_URLS: Record<string, string[]> = {
  // =========================================
  // ENARE - Provas VERIFICADAS
  // =========================================
  enare: [
    // Medway archives
    'https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2023/10/30124003/Prova-Enare-R1.pdf',
    'https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/10/22182013/ENARE-2025.pdf',
  ],

  // =========================================
  // FMUSP/USP - FUVEST (2025-2026)
  // =========================================
  fmusp: [
    // 2026 - Acesso Direto
    'https://www.fuvest.br/wp-content/uploads/rm2026-prova-AD1-areasbasicas-acessodireto.pdf',
    'https://www.fuvest.br/wp-content/uploads/rm2026-prova-AD2-areasbasicas-acessodireto.pdf',
    'https://www.fuvest.br/wp-content/uploads/rm2026-prova-AD3-areasbasicas-acessodireto.pdf',
    'https://www.fuvest.br/wp-content/uploads/rm2026-prova-ECM-especialidades-clinicas.pdf',
    'https://www.fuvest.br/wp-content/uploads/rm2026-prova-EPD-especialidades-pediatricas-v2.pdf',
    // 2025 - Acesso Direto
    'https://www.fuvest.br/wp-content/uploads/2024-12-01_rm2025_prova-areasbasicasedeacessodireto_grupo-a1.pdf',
    'https://www.fuvest.br/wp-content/uploads/2024-12-01_rm2025_prova-especialidadesclinicas_grupo-b.pdf',
    // Medway USP 2025
    'https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/12/03102906/USP-SP-2025-Objetiva.pdf',
  ],

  // =========================================
  // UNIFESP (2024-2025)
  // =========================================
  unifesp: [
    'https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2023/12/22111319/UNIFESP-2024-Objetiva-R1.pdf',
    'https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/12/12111955/UNIFESP-2025-Objetiva-1.pdf',
  ],

  // =========================================
  // Santa Casa SP (ISCMSP)
  // =========================================
  santacasa: [
    'https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/12/04124630/SCMSP-2025-Objetiva.pdf',
  ],

  // =========================================
  // SUS-SP - Estratégia MED
  // =========================================
  sussp: [
    'https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2024/01/1_SES-SP_RM_2024_gabarito_definitivo.pdf',
  ],

  // =========================================
  // CERMAM - Centro de Residência Médica AM
  // =========================================
  cermam: [
    'https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2024/12/PROVAO-CERMAM-2025_1_impressao-OK.pdf',
  ],

  // =========================================
  // UFRJ - Site Oficial
  // =========================================
  ufrj: [
    'https://www.residencia.ufrj.br/images/2024/PROVAS/QUADROI/PROVA_DE_CONHECIMENTOS_GERAIS_2024_-_FINAL_compressed.pdf',
  ],

  // =========================================
  // Simulados Estratégia MED
  // =========================================
  simulados: [
    'https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2024/07/12_07_2024_100_DIAS_PARA_O_ENARE_-_SIMULADO_INEDITO_FGV_Caderno_de_Questoes_Atualizado.pdf',
    'https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2024/12/06_12_2024_Simulado_Final_SUS-SP_Caderno_de_Questoes.pdf',
  ],
};

/**
 * Retorna todas as URLs conhecidas de todas as fontes
 */
export function getAllKnownUrls(): { source: string; url: string }[] {
  const allUrls: { source: string; url: string }[] = [];

  for (const [source, urls] of Object.entries(KNOWN_EXAM_URLS)) {
    for (const url of urls) {
      allUrls.push({ source, url });
    }
  }

  return allUrls;
}

/**
 * Conta total de URLs conhecidas
 */
export function getKnownUrlsCount(): number {
  return Object.values(KNOWN_EXAM_URLS).reduce((acc, urls) => acc + urls.length, 0);
}

// ============================================
// Search-Based Scraper (usando busca web)
// ============================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchConfig {
  provider: 'brave' | 'google' | 'bing' | 'direct';
  apiKey?: string;
  customSearchId?: string; // Para Google CSE
}

export class SearchBasedScraper extends BaseScraper {
  private searchQueries: string[];
  private searchConfig: SearchConfig;

  constructor(
    source: QuestionSource,
    searchQueries: string[],
    options: ScraperOptions = {},
    searchConfig: SearchConfig = { provider: 'direct' }
  ) {
    super(source, options);
    this.searchQueries = searchQueries;
    this.searchConfig = searchConfig;
  }

  async scrape(): Promise<ScraperResult> {
    const documents: RawDocument[] = [];
    const errors: string[] = [];
    const processedUrls = new Set<string>();

    // 1. Primeiro, tentar URLs conhecidas
    const knownUrls = this.getKnownUrls();
    console.log(`Tentando ${knownUrls.length} URLs conhecidas...`);

    for (const url of knownUrls) {
      if (documents.length >= this.options.maxDocuments) break;
      if (processedUrls.has(url)) continue;
      processedUrls.add(url);

      try {
        await this.delay();
        const content = await this.fetchPDF(url);
        const year = this.inferYearFromUrl(url);

        documents.push({
          id: `known-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sourceId: this.source.id,
          url,
          format: 'pdf',
          filename: url.split('/').pop() || 'document.pdf',
          content,
          ocrRequired: false,
          downloadedAt: new Date(),
          metadata: {
            source: 'known_url',
            year,
          },
        });

        console.log(`✅ Downloaded: ${url}`);
      } catch (e) {
        // URLs conhecidas podem estar desatualizadas
        errors.push(`Known URL failed: ${url} - ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 2. Se não atingiu o limite, buscar via API
    if (documents.length < this.options.maxDocuments) {
      for (const query of this.searchQueries) {
        if (documents.length >= this.options.maxDocuments) break;

        try {
          let searchResults: SearchResult[] = [];

          switch (this.searchConfig.provider) {
            case 'brave':
              searchResults = await this.searchBrave(query);
              break;
            case 'google':
              searchResults = await this.searchGoogle(query);
              break;
            case 'bing':
              searchResults = await this.searchBing(query);
              break;
            default:
              // Fallback: scrape direto de páginas institucionais
              searchResults = await this.scrapeInstitutionalPages(query);
          }

          for (const result of searchResults) {
            if (processedUrls.has(result.url)) continue;
            if (!result.url.toLowerCase().endsWith('.pdf')) continue;

            processedUrls.add(result.url);

            try {
              await this.delay();
              const content = await this.fetchPDF(result.url);
              const year = this.inferYearFromUrl(result.url);

              documents.push({
                id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                sourceId: this.source.id,
                url: result.url,
                format: 'pdf',
                filename: result.url.split('/').pop() || 'document.pdf',
                content,
                ocrRequired: false,
                downloadedAt: new Date(),
                metadata: {
                  searchQuery: query,
                  title: result.title,
                  year,
                  provider: this.searchConfig.provider,
                },
              });

              console.log(`✅ Downloaded: ${result.url}`);
              if (documents.length >= this.options.maxDocuments) break;
            } catch (e) {
              errors.push(`Download failed ${result.url}: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        } catch (e) {
          errors.push(`Search error "${query}": ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    return {
      success: documents.length > 0,
      documents,
      errors,
    };
  }

  /**
   * Retorna URLs conhecidas baseado na instituição
   */
  private getKnownUrls(): string[] {
    const urls: string[] = [];
    const institution = this.source.institution?.toLowerCase() || '';
    const sourceId = this.source.id.toLowerCase();

    // ENARE
    if (institution.includes('ebserh') || sourceId.includes('enare')) {
      urls.push(...(KNOWN_EXAM_URLS.enare || []));
    }

    // FMUSP/USP
    if (institution.includes('usp') || sourceId.includes('fmusp') || sourceId.includes('usp')) {
      urls.push(...(KNOWN_EXAM_URLS.fmusp || []));
    }

    // UNIFESP
    if (institution.includes('unifesp') || sourceId.includes('unifesp')) {
      urls.push(...(KNOWN_EXAM_URLS.unifesp || []));
    }

    // SUS-SP
    if (sourceId.includes('sus') || institution.includes('ses-sp')) {
      urls.push(...(KNOWN_EXAM_URLS.sussp || []));
    }

    // Se não encontrou nenhuma fonte específica, adicionar simulados
    if (urls.length === 0) {
      urls.push(...(KNOWN_EXAM_URLS.simulados || []));
    }

    return urls;
  }

  /**
   * Brave Search API (free tier: 2000 queries/month)
   */
  private async searchBrave(query: string): Promise<SearchResult[]> {
    if (!this.searchConfig.apiKey) {
      throw new Error('Brave API key required');
    }

    const encodedQuery = encodeURIComponent(`${query} filetype:pdf`);
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodedQuery}&count=20`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': this.searchConfig.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    for (const result of data.web?.results || []) {
      if (result.url?.toLowerCase().includes('.pdf')) {
        results.push({
          url: result.url,
          title: result.title || '',
          snippet: result.description || '',
        });
      }
    }

    return results;
  }

  /**
   * Google Custom Search API
   */
  private async searchGoogle(query: string): Promise<SearchResult[]> {
    if (!this.searchConfig.apiKey || !this.searchConfig.customSearchId) {
      throw new Error('Google API key and Custom Search ID required');
    }

    const encodedQuery = encodeURIComponent(`${query} filetype:pdf`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.searchConfig.apiKey}&cx=${this.searchConfig.customSearchId}&q=${encodedQuery}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    for (const item of data.items || []) {
      if (item.link?.toLowerCase().includes('.pdf')) {
        results.push({
          url: item.link,
          title: item.title || '',
          snippet: item.snippet || '',
        });
      }
    }

    return results;
  }

  /**
   * Bing Web Search API
   */
  private async searchBing(query: string): Promise<SearchResult[]> {
    if (!this.searchConfig.apiKey) {
      throw new Error('Bing API key required');
    }

    const encodedQuery = encodeURIComponent(`${query} filetype:pdf`);
    const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodedQuery}&count=20`;

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.searchConfig.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    for (const result of data.webPages?.value || []) {
      if (result.url?.toLowerCase().includes('.pdf')) {
        results.push({
          url: result.url,
          title: result.name || '',
          snippet: result.snippet || '',
        });
      }
    }

    return results;
  }

  /**
   * Scrape direto de páginas institucionais conhecidas
   */
  private async scrapeInstitutionalPages(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Lista de páginas para tentar scrape direto
    const institutionalPages = [
      // FMUSP
      'https://www.fm.usp.br/fmusp/conteudo/RES_provas.htm',
      'https://www.fm.usp.br/fmusp/conteudo/RES_provas_anteriores.htm',
      // UNIFESP
      'https://www.unifesp.br/campus/sao/provas-anteriores',
      // UNICAMP
      'https://www.fcm.unicamp.br/fcm/residencia-medica/provas',
      // UFMG
      'https://www.medicina.ufmg.br/residencia/provas-anteriores/',
      // ENARE
      'https://www.gov.br/ebserh/pt-br/acesso-a-informacao/enare',
    ];

    for (const pageUrl of institutionalPages) {
      try {
        const html = await this.fetchPage(pageUrl);
        const pdfLinks = this.extractPDFLinksWithContext(html, pageUrl);

        for (const link of pdfLinks) {
          // Filtrar por termo de busca
          const lowerQuery = query.toLowerCase();
          const lowerUrl = link.url.toLowerCase();
          const lowerTitle = link.title.toLowerCase();

          if (
            lowerUrl.includes('prova') ||
            lowerUrl.includes('residencia') ||
            lowerTitle.includes('prova') ||
            lowerUrl.includes(lowerQuery.split(' ')[0])
          ) {
            results.push(link);
          }
        }
      } catch {
        // Página pode não existir ou estar bloqueada
        continue;
      }
    }

    return results;
  }

  /**
   * Extrai links PDF com contexto (título)
   */
  private extractPDFLinksWithContext(
    html: string,
    baseUrl: string
  ): SearchResult[] {
    const results: SearchResult[] = [];

    // Padrão mais completo para extrair links com texto
    const linkPattern = /<a[^>]+href=["']([^"']+\.pdf)["'][^>]*>([^<]*)<\/a>/gi;

    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      let url = match[1];
      const title = match[2].trim() || url.split('/').pop() || '';

      // Resolver URL relativa
      if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        url = `${base.protocol}//${base.host}${url}`;
      } else if (!url.startsWith('http')) {
        url = new URL(url, baseUrl).href;
      }

      results.push({
        url,
        title,
        snippet: '',
      });
    }

    return results;
  }
}

// ============================================
// Factory Functions
// ============================================

export function createResidenciaScraper(
  sourceId: string,
  options?: ScraperOptions
): BaseScraper | null {
  const source = RESIDENCIA_SOURCES.find((s) => s.id === sourceId);
  if (!source) return null;

  return new GenericPDFScraper(source, options);
}

export function createSearchScraper(
  institution: string,
  years: number[],
  options?: ScraperOptions,
  searchConfig?: SearchConfig
): SearchBasedScraper {
  const queries = years.flatMap((year) => [
    `prova residência médica ${institution} ${year} pdf`,
    `gabarito residência ${institution} ${year} pdf`,
    `prova ${institution} medicina ${year} pdf`,
  ]);

  const source: QuestionSource = {
    id: `search-${institution.toLowerCase().replace(/\s+/g, '-')}`,
    name: `Busca: ${institution}`,
    type: 'residencia',
    url: 'https://search.brave.com',
    institution,
    crawlable: true,
  };

  return new SearchBasedScraper(
    source,
    queries,
    options,
    searchConfig || { provider: 'direct' }
  );
}

/**
 * Cria scraper com Brave Search API
 */
export function createBraveSearchScraper(
  institution: string,
  years: number[],
  apiKey: string,
  options?: ScraperOptions
): SearchBasedScraper {
  return createSearchScraper(institution, years, options, {
    provider: 'brave',
    apiKey,
  });
}

/**
 * Cria scraper com Google Custom Search API
 */
export function createGoogleSearchScraper(
  institution: string,
  years: number[],
  apiKey: string,
  customSearchId: string,
  options?: ScraperOptions
): SearchBasedScraper {
  return createSearchScraper(institution, years, options, {
    provider: 'google',
    apiKey,
    customSearchId,
  });
}

// ============================================
// Batch Scraper
// ============================================

export async function scrapeAllSources(
  options?: ScraperOptions
): Promise<Map<string, ScraperResult>> {
  const results = new Map<string, ScraperResult>();

  for (const source of RESIDENCIA_SOURCES) {
    console.log(`\n=== Scraping ${source.name} ===`);

    const scraper = new GenericPDFScraper(source, options);
    const result = await scraper.scrape();

    results.set(source.id, result);

    console.log(
      `Result: ${result.documents.length} documents, ${result.errors.length} errors`
    );

    // Delay entre fontes
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return results;
}
