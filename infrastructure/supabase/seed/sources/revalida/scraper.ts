/**
 * REVALIDA INEP Portal Scraper
 * Downloads question PDFs from INEP direct download URLs
 */

import { CacheManager } from '../../etl-core/utils/cache';
import { downloadFile, urlAccessible } from '../../etl-core/utils/http';
import { REVALIDA_CONFIG } from './config';
import { mkdir } from 'fs/promises';

export interface REVALIDAScrapedExam {
  year: number;
  pdf: Buffer | null;
  metadata: {
    year: number;
    fetched: Date;
    cached: boolean;
    source: string;
  };
}

export class REVALIDAScraper {
  private cacheManager: CacheManager;
  private outputDir: string;

  constructor(cacheDir: string, outputDir: string) {
    this.cacheManager = new CacheManager(cacheDir);
    this.outputDir = outputDir;
  }

  async initialize(): Promise<void> {
    this.cacheManager.ensureCacheDir();
    await mkdir(this.outputDir, { recursive: true });
  }

  /**
   * Scrape REVALIDA exams from INEP for 2023-2025
   */
  async scrapeAllYears(): Promise<REVALIDAScrapedExam[]> {
    const results: REVALIDAScrapedExam[] = [];

    for (const [yearStr, url] of Object.entries(REVALIDA_CONFIG.urls)) {
      const year = parseInt(yearStr);
      console.log(`  📥 REVALIDA ${year}: Checking INEP portal...`);

      try {
        // Check if URL is accessible
        const accessible = await urlAccessible(url);
        if (!accessible) {
          console.log(`  ⚠️  REVALIDA ${year}: PDF not accessible at ${url}`);
          results.push({
            year,
            pdf: null,
            metadata: { year, fetched: new Date(), cached: false, source: 'inep' },
          });
          continue;
        }

        // Try to download PDF
        const pdfFilename = `revalida_${year}.pdf`;
        let pdf: Buffer | null = null;
        let cached = false;

        // Check cache first
        if (this.cacheManager.isCached(pdfFilename)) {
          console.log(`  ✓ REVALIDA ${year}: Using cached PDF`);
          try {
            pdf = this.cacheManager.readFromCache(pdfFilename);
            cached = true;
          } catch (err) {
            console.log(`  ⚠️  Failed to read cache: ${err}`);
          }
        }

        // Try to download if not cached
        if (!pdf) {
          try {
            console.log(`  📥 Downloading PDF from INEP...`);
            pdf = await downloadFile(url, {
              timeout: 30000,
              retries: 2,
              validatePDF: true,
            });

            if (pdf) {
              this.cacheManager.saveToCache(pdfFilename, pdf);
              console.log(`  ✓ REVALIDA ${year}: PDF downloaded and cached`);
            }
          } catch (err) {
            console.log(`  ⚠️  REVALIDA ${year}: Could not download PDF: ${err}`);
          }
        }

        results.push({
          year,
          pdf,
          metadata: { year, fetched: new Date(), cached, source: 'inep' },
        });
      } catch (err) {
        console.error(`  ✗ REVALIDA ${year}: Scraping failed: ${err}`);
        results.push({
          year,
          pdf: null,
          metadata: { year, fetched: new Date(), cached: false, source: 'inep' },
        });
      }
    }

    return results;
  }
}
