/**
 * USP/UNIFESP FUVEST Portal Scraper
 * Downloads residency exam PDFs from FUVEST portal
 */

import { CacheManager } from '../../etl-core/utils/cache';
import { downloadFile, urlAccessible } from '../../etl-core/utils/http';
import { USP_CONFIG } from './config';
import { mkdir } from 'fs/promises';

export interface USPScrapedExam {
  year: number;
  title: string; // E.g., "Prova de Residência USP 2024" or "Cirurgia Geral 2024"
  pdf: Buffer | null;
  metadata: {
    year: number;
    fetched: Date;
    cached: boolean;
    source: string;
  };
}

export class USPScraper {
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
   * Scrape USP FUVEST residency exams for 2020-2024
   */
  async scrapeAllYears(): Promise<USPScrapedExam[]> {
    const results: USPScrapedExam[] = [];

    for (const year of USP_CONFIG.years) {
      console.log(`  📥 USP/FUVEST ${year}: Checking portal...`);

      try {
        // Check if portal is accessible
        const portalUrl = USP_CONFIG.fuvest.baseUrl + USP_CONFIG.fuvest.provasAnterioresPath;
        const accessible = await urlAccessible(portalUrl);

        if (!accessible) {
          console.log(`  ⚠️  USP/FUVEST ${year}: Portal not accessible`);
          results.push({
            year,
            title: `USP/FUVEST ${year}`,
            pdf: null,
            metadata: { year, fetched: new Date(), cached: false, source: 'fuvest-portal' },
          });
          continue;
        }

        // Attempt to download PDF
        const pdfFilename = `usp_fuvest_${year}.pdf`;
        let pdf: Buffer | null = null;
        let cached = false;

        // Check cache first
        if (this.cacheManager.isCached(pdfFilename)) {
          console.log(`  ✓ USP/FUVEST ${year}: Using cached PDF`);
          try {
            pdf = this.cacheManager.readFromCache(pdfFilename);
            cached = true;
          } catch (err) {
            console.log(`  ⚠️  Failed to read cache: ${err}`);
          }
        }

        // Try to download if not cached
        if (!pdf) {
          const pdfUrl = this.constructPDFUrl(year);
          try {
            console.log(`  📥 Attempting download from FUVEST...`);
            pdf = await downloadFile(pdfUrl, {
              timeout: 30000,
              retries: 2,
              validatePDF: true,
            });

            if (pdf) {
              this.cacheManager.saveToCache(pdfFilename, pdf);
              console.log(`  ✓ USP/FUVEST ${year}: PDF downloaded and cached`);
            }
          } catch (err) {
            console.log(`  ⚠️  Could not download from ${pdfUrl}`);
            // Try alternative URLs
            const altUrls = this.getAlternativePDFUrls(year);
            for (const altUrl of altUrls) {
              try {
                console.log(`  📥 Trying alternative: ${altUrl}`);
                pdf = await downloadFile(altUrl, {
                  timeout: 15000,
                  retries: 1,
                  validatePDF: true,
                });
                if (pdf) {
                  this.cacheManager.saveToCache(pdfFilename, pdf);
                  console.log(`  ✓ USP/FUVEST ${year}: PDF downloaded from alternative source`);
                  break;
                }
              } catch {
                continue;
              }
            }

            if (!pdf) {
              console.log(`  ⚠️  Could not download USP/FUVEST ${year} PDF from any source`);
            }
          }
        }

        results.push({
          year,
          title: `USP/FUVEST ${year}`,
          pdf,
          metadata: { year, fetched: new Date(), cached, source: 'fuvest-portal' },
        });
      } catch (err) {
        console.error(`  ✗ USP/FUVEST ${year}: Scraping failed: ${err}`);
        results.push({
          year,
          title: `USP/FUVEST ${year}`,
          pdf: null,
          metadata: { year, fetched: new Date(), cached: false, source: 'fuvest-portal' },
        });
      }
    }

    return results;
  }

  /**
   * Construct primary PDF URL for USP exam
   */
  private constructPDFUrl(year: number): string {
    // Common FUVEST URL patterns
    return `${USP_CONFIG.fuvest.baseUrl}wp-content/uploads/prova_residencia_${year}.pdf`;
  }

  /**
   * Get alternative PDF URLs to try
   */
  private getAlternativePDFUrls(year: number): string[] {
    return [
      // Pattern 1: Direct FUVEST download
      `https://download.fuvest.br/residencia/prova_${year}.pdf`,
      // Pattern 2: Archive pattern
      `${USP_CONFIG.fuvest.baseUrl}prova-${year}.pdf`,
      // Pattern 3: Year-based archive
      `https://www.fuvest.br/wp-content/uploads/${year}/residencia-prova.pdf`,
      // Pattern 4: UNIFESP FAPUNIFESP
      `https://www.fapunifesp.edu.br/residencia/prova-${year}.pdf`,
    ];
  }
}
