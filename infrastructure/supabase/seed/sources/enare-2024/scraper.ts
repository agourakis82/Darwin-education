/**
 * ENARE FGV Portal Scraper
 * Downloads question PDFs and related materials from FGV knowledge portal
 */

import { CacheManager } from '../../etl-core/utils/cache';
import { downloadFile, urlAccessible } from '../../etl-core/utils/http';
import { ENARE_CONFIG } from './config';
import { mkdir } from 'fs/promises';
import { join } from 'path';

export class ENAREScraper {
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
   * Scrape ENARE exams from FGV portal for multiple years
   * Returns map of year -> { pdf: Buffer, gabarito: string }
   */
  async scrapeAllYears(): Promise<
    Map<
      number,
      {
        pdf: Buffer | null;
        gabarito: string | null;
        metadata: { year: number; fetched: Date; cached: boolean };
      }
    >
  > {
    const results = new Map();

    for (const [yearStr, url] of Object.entries(ENARE_CONFIG.urls)) {
      const year = parseInt(yearStr);
      console.log(`  📥 ENARE ${year}: Checking FGV portal...`);

      try {
        // Check if portal is accessible
        const accessible = await urlAccessible(url);
        if (!accessible) {
          console.log(`  ⚠️  ENARE ${year}: Portal not accessible (may require login)`);
          results.set(year, {
            pdf: null,
            gabarito: null,
            metadata: { year, fetched: new Date(), cached: false },
          });
          continue;
        }

        // Attempt to download PDF
        const pdfFilename = `enare_${year}.pdf`;
        let pdf: Buffer | null = null;
        let cached = false;

        if (this.cacheManager.isCached(pdfFilename)) {
          console.log(`  ✓ ENARE ${year}: Using cached PDF`);
          try {
            pdf = this.cacheManager.readFromCache(pdfFilename);
            cached = true;
          } catch (err) {
            console.log(`  ⚠️  Failed to read cache: ${err}`);
          }
        }

        if (!pdf) {
          // Try to download from common FGV PDF URLs
          const pdfUrl = this.constructPDFUrl(year);
          try {
            console.log(`  📥 Downloading PDF from ${pdfUrl}`);
            pdf = await downloadFile(pdfUrl, {
              timeout: 30000,
              retries: 2,
              validatePDF: true,
            });
            if (pdf) {
              this.cacheManager.saveToCache(pdfFilename, pdf);
              console.log(`  ✓ ENARE ${year}: PDF downloaded and cached`);
            }
          } catch (err) {
            console.log(`  ⚠️  ENARE ${year}: Could not download PDF (${err})`);
          }
        }

        // Attempt to fetch gabarito (answer key)
        const gabaritoUrl = this.constructGabaritoUrl(year);
        let gabarito: string | null = null;
        try {
          const gabBuffer = await downloadFile(gabaritoUrl, {
            timeout: 15000,
            retries: 1,
          });
          gabarito = gabBuffer.toString('utf-8');
          console.log(`  ✓ ENARE ${year}: Answer key fetched`);
        } catch (err) {
          console.log(`  ℹ️  ENARE ${year}: Could not fetch answer key`);
        }

        results.set(year, {
          pdf,
          gabarito,
          metadata: { year, fetched: new Date(), cached },
        });
      } catch (err) {
        console.error(`  ✗ ENARE ${year}: Scraping failed: ${err}`);
        results.set(year, {
          pdf: null,
          gabarito: null,
          metadata: { year, fetched: new Date(), cached: false },
        });
      }
    }

    return results;
  }

  /**
   * Construct PDF download URL for ENARE exam by year
   * FGV stores PDFs in predictable locations
   */
  private constructPDFUrl(year: number): string {
    const yy = year.toString().slice(-2);
    // Common FGV PDF patterns
    return `https://download.fgv.br/concursos/enare${yy}/prova_enare_${year}.pdf`;
  }

  /**
   * Construct gabarito (answer key) URL
   */
  private constructGabaritoUrl(year: number): string {
    const yy = year.toString().slice(-2);
    return `https://download.fgv.br/concursos/enare${yy}/gabarito_enare_${year}.txt`;
  }
}
