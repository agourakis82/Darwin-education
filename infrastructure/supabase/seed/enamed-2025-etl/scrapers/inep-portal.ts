/**
 * INEP Portal Scraper
 * Downloads exam PDFs and gabarito from the INEP portal
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { INEP_PROVAS_URL, OUTPUT_DIR } from '../config';

// Cache directory for downloaded PDFs
const CACHE_DIR = path.join(OUTPUT_DIR, 'pdfs');

/**
 * Known ENAMED 2025 PDF URLs
 * These may change if INEP restructures their portal
 */
const ENAMED_2025_URLS = {
  // Caderno de Prova (exam booklets)
  caderno1:
    'https://download.inep.gov.br/enamed/provas/2025/ENAMED_2025_CADERNO_1.pdf',
  caderno2:
    'https://download.inep.gov.br/enamed/provas/2025/ENAMED_2025_CADERNO_2.pdf',
  // Gabarito oficial
  gabarito:
    'https://download.inep.gov.br/enamed/gabaritos/2025/ENAMED_2025_GABARITO.pdf',
};

/**
 * Alternative URLs (backup locations)
 */
const ALTERNATIVE_URLS = {
  caderno1:
    'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos/caderno1-2025.pdf',
  caderno2:
    'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos/caderno2-2025.pdf',
  gabarito:
    'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos/gabarito-2025.pdf',
};

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get cache path for a file
 */
function getCachePath(filename: string): string {
  return path.join(CACHE_DIR, filename);
}

/**
 * Check if file is cached
 */
function isCached(filename: string): boolean {
  return existsSync(getCachePath(filename));
}

/**
 * Read cached file
 */
function readCached(filename: string): Buffer {
  return readFileSync(getCachePath(filename));
}

/**
 * Save file to cache
 */
function saveToCache(filename: string, data: Buffer): void {
  ensureCacheDir();
  writeFileSync(getCachePath(filename), data);
}

/**
 * Download a PDF from URL with retry logic
 */
async function downloadPDF(
  url: string,
  filename: string,
  useCache: boolean = true
): Promise<Buffer> {
  // Check cache first
  if (useCache && isCached(filename)) {
    console.log(`Using cached: ${filename}`);
    return readCached(filename);
  }

  console.log(`Downloading: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; DarwinEducation/1.0; +https://darwin.education)',
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Validate it's a PDF
    if (!buffer.toString('utf8', 0, 4).startsWith('%PDF')) {
      throw new Error('Downloaded file is not a valid PDF');
    }

    // Cache the file
    saveToCache(filename, buffer);
    console.log(`Cached: ${filename} (${buffer.length} bytes)`);

    return buffer;
  } catch (error) {
    throw new Error(`Failed to download ${url}: ${error}`);
  }
}

/**
 * Fetch exam PDFs from INEP portal
 */
export async function downloadExamPDFs(useCache: boolean = true): Promise<{
  caderno1: Buffer;
  caderno2: Buffer;
  gabarito: Buffer;
}> {
  console.log('Downloading ENAMED 2025 exam PDFs...');

  const results = {
    caderno1: null as Buffer | null,
    caderno2: null as Buffer | null,
    gabarito: null as Buffer | null,
  };

  // Try primary URLs first, then alternatives
  for (const [key, urls] of Object.entries({
    caderno1: [ENAMED_2025_URLS.caderno1, ALTERNATIVE_URLS.caderno1],
    caderno2: [ENAMED_2025_URLS.caderno2, ALTERNATIVE_URLS.caderno2],
    gabarito: [ENAMED_2025_URLS.gabarito, ALTERNATIVE_URLS.gabarito],
  })) {
    const filename = `enamed_2025_${key}.pdf`;

    for (const url of urls) {
      try {
        results[key as keyof typeof results] = await downloadPDF(
          url,
          filename,
          useCache
        );
        break; // Success, move to next file
      } catch (error) {
        console.warn(`Failed with ${url}, trying alternative...`);
      }
    }

    if (!results[key as keyof typeof results]) {
      throw new Error(`Failed to download ${key} from all sources`);
    }
  }

  return results as {
    caderno1: Buffer;
    caderno2: Buffer;
    gabarito: Buffer;
  };
}

/**
 * Scrape INEP portal to find current PDF URLs
 * Use this if hardcoded URLs are outdated
 */
export async function scrapePortalForURLs(): Promise<{
  caderno1?: string;
  caderno2?: string;
  gabarito?: string;
}> {
  console.log(`Scraping INEP portal: ${INEP_PROVAS_URL}`);

  try {
    const response = await fetch(INEP_PROVAS_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; DarwinEducation/1.0; +https://darwin.education)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Simple regex to find PDF links (for basic scraping without cheerio)
    const pdfPattern = /href=["'](https?:\/\/[^"']+\.pdf)["']/gi;
    const matches = html.matchAll(pdfPattern);

    const urls: Record<string, string> = {};

    for (const match of matches) {
      const url = match[1].toLowerCase();

      if (url.includes('2025')) {
        if (url.includes('caderno') && url.includes('1')) {
          urls.caderno1 = match[1];
        } else if (url.includes('caderno') && url.includes('2')) {
          urls.caderno2 = match[1];
        } else if (url.includes('gabarito')) {
          urls.gabarito = match[1];
        }
      }
    }

    console.log('Found URLs:', urls);
    return urls;
  } catch (error) {
    console.error('Failed to scrape portal:', error);
    return {};
  }
}

/**
 * Get cached PDFs or download if not available
 */
export async function getExamPDFs(): Promise<{
  caderno1: Buffer;
  caderno2: Buffer;
  gabarito: Buffer;
  fromCache: boolean;
}> {
  // Check if all PDFs are cached
  const allCached =
    isCached('enamed_2025_caderno1.pdf') &&
    isCached('enamed_2025_caderno2.pdf') &&
    isCached('enamed_2025_gabarito.pdf');

  if (allCached) {
    return {
      caderno1: readCached('enamed_2025_caderno1.pdf'),
      caderno2: readCached('enamed_2025_caderno2.pdf'),
      gabarito: readCached('enamed_2025_gabarito.pdf'),
      fromCache: true,
    };
  }

  const pdfs = await downloadExamPDFs(true);
  return { ...pdfs, fromCache: false };
}
