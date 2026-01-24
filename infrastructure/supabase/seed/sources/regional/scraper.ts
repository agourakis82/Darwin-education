/**
 * Regional Exams Scraper
 * Downloads PDFs from AMRIGS, SURCE, and SUS-SP Quadrix portals
 */

import { CacheManager } from '../../etl-core/utils/cache';
import { downloadFile, urlAccessible } from '../../etl-core/utils/http';
import { REGIONAL_CONFIG, getSourceConfig } from './config';
import { mkdir } from 'fs/promises';

export interface RegionalScrapedExam {
  sourceId: 'amrigs' | 'surce' | 'susSp';
  year: number;
  pdf: Buffer | null;
  metadata: {
    year: number;
    fetched: Date;
    cached: boolean;
    source: string;
  };
}

export class RegionalScraper {
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
   * Scrape all regional exams from 3 sources
   */
  async scrapeAllSources(): Promise<RegionalScrapedExam[]> {
    const results: RegionalScrapedExam[] = [];

    // Scrape each source
    for (const sourceId of ['amrigs', 'surce', 'susSp'] as const) {
      const sourceResults = await this.scrapeSource(sourceId);
      results.push(...sourceResults);
    }

    return results;
  }

  /**
   * Scrape single source for all years
   */
  private async scrapeSource(
    sourceId: 'amrigs' | 'surce' | 'susSp'
  ): Promise<RegionalScrapedExam[]> {
    const results: RegionalScrapedExam[] = [];
    const sourceConfig = getSourceConfig(sourceId);

    console.log(`  📥 ${sourceConfig.name}: Scraping ${sourceConfig.region}...`);

    for (const year of sourceConfig.years) {
      console.log(`    📥 ${sourceConfig.name} ${year}...`);

      try {
        const pdfFilename = `${sourceId}_${year}.pdf`;
        let pdf: Buffer | null = null;
        let cached = false;

        // Check cache first
        if (this.cacheManager.isCached(pdfFilename)) {
          console.log(`      ✓ Using cached PDF`);
          try {
            pdf = this.cacheManager.readFromCache(pdfFilename);
            cached = true;
          } catch (err) {
            console.log(`      ⚠️  Failed to read cache`);
          }
        }

        // Try to download if not cached
        if (!pdf) {
          const urls = this.constructPDFUrls(sourceId, year);

          for (const url of urls) {
            try {
              console.log(`      📥 Trying: ${url.substring(0, 50)}...`);
              pdf = await downloadFile(url, {
                timeout: 30000,
                retries: 2,
                validatePDF: true,
              });

              if (pdf) {
                this.cacheManager.saveToCache(pdfFilename, pdf);
                console.log(`      ✓ Downloaded and cached`);
                break;
              }
            } catch (err) {
              continue;
            }
          }

          if (!pdf) {
            console.log(`      ⚠️  Could not download from any URL`);
          }
        }

        results.push({
          sourceId,
          year,
          pdf,
          metadata: {
            year,
            fetched: new Date(),
            cached,
            source: sourceConfig.name,
          },
        });
      } catch (err) {
        console.error(`      ✗ Error: ${err}`);
        results.push({
          sourceId,
          year,
          pdf: null,
          metadata: {
            year,
            fetched: new Date(),
            cached: false,
            source: sourceConfig.name,
          },
        });
      }
    }

    return results;
  }

  /**
   * Construct PDF URLs for a given source and year
   * Returns array of URL patterns to try
   */
  private constructPDFUrls(
    sourceId: 'amrigs' | 'surce' | 'susSp',
    year: number
  ): string[] {
    const urls: string[] = [];
    const yy = year.toString().slice(-2);

    if (sourceId === 'amrigs') {
      // AMRIGS patterns
      urls.push(`https://residenciamedica.amrigs.org.br/provas/prova_amrigs_${year}.pdf`);
      urls.push(`https://www.amrigs.org.br/provas/${year}/prova.pdf`);
      urls.push(`https://download.amrigs.org.br/provas_residencia_${year}.pdf`);
    } else if (sourceId === 'surce') {
      // SURCE patterns
      urls.push(`http://www.surce.ufc.br/provas/prova_surce_${year}.pdf`);
      urls.push(`https://www.surce.ufc.br/provas/${year}/prova.pdf`);
      urls.push(`http://download.surce.ufc.br/provas_${year}.pdf`);
    } else if (sourceId === 'susSp') {
      // SUS-SP Quadrix patterns
      urls.push(`https://download.quadrix.org.br/sus-sp/residencia/prova_${year}.pdf`);
      urls.push(`https://www.quadrix.org.br/download/sus-sp/${year}.pdf`);
      urls.push(`https://cdn.quadrix.org.br/concursos/sus-sp/prova_${year}.pdf`);
    }

    return urls;
  }
}
