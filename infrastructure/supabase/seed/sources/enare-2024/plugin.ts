/**
 * ENARE 2024 Plugin
 * Unified National Residency Exam (Exame Nacional de Avaliação da Residência)
 * via FGV portal
 */

import type {
  ETLPlugin,
  ScrapedData,
  ParsedQuestions,
  CompleteQuestions,
  ValidationResult,
} from '../../etl-core/types/plugin';
import { ENAREScraper } from './scraper';
import { ENAREParser, type ParsedENAREExam } from './parser';
import { ENARETransformer } from './transformer';
import { sqlValue, generateUpsert, sqlComment } from '../../etl-core/utils/sql';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ENAREPlugin implements ETLPlugin {
  readonly id = 'enare-2024';
  readonly name = 'ENARE 2024';
  readonly description =
    'ENARE unified national residency exam with 100+ questions per year from FGV portal';
  readonly version = '1.0.0';

  private outputDir: string;
  private cacheDir: string;
  private scraper: ENAREScraper;
  private parser: ENAREParser;
  private transformer: ENARETransformer;
  private scrapedData: Map<number, { pdf: Buffer | null; gabarito: string | null }> = new Map();
  private parsedData: Map<number, ParsedENAREExam> = new Map();

  constructor() {
    this.outputDir = join(__dirname, 'outputs');
    this.cacheDir = join(__dirname, 'cache');
    this.scraper = new ENAREScraper(this.cacheDir, this.outputDir);
    this.parser = new ENAREParser();
    this.transformer = new ENARETransformer();
  }

  async initialize(): Promise<void> {
    console.log('🔧 ENARE: Initializing...');
    await this.scraper.initialize();
    mkdirSync(this.outputDir, { recursive: true });
  }

  async scrape(): Promise<ScrapedData> {
    console.log('📥 ENARE: Scraping FGV portal for 2021-2024 exams...');

    const scrapedDataMap = await this.scraper.scrapeAllYears();

    // Store for later use in parse step
    this.scrapedData = new Map(
      Array.from(scrapedDataMap.entries()).map(([year, data]) => [
        year,
        { pdf: data.pdf, gabarito: data.gabarito },
      ])
    );

    // Count valid PDFs
    const pdfsWithContent = Array.from(this.scrapedData.values()).filter((d) => d.pdf !== null)
      .length;

    return {
      pdfs: new Map(
        Array.from(this.scrapedData.entries())
          .filter(([_, data]) => data.pdf !== null)
          .map(([year, data]) => [`enare_${year}`, data.pdf!])
      ),
      metadata: {
        source: 'enare-fgv-portal',
        year: 2024,
        itemCount: 400, // 100 × 4 years
        validItems: pdfsWithContent * 100,
        message: `Scraped ${pdfsWithContent} years of ENARE exams from FGV portal`,
      },
      timestamp: new Date(),
    };
  }

  async parse(data: ScrapedData): Promise<ParsedQuestions> {
    console.log('📖 ENARE: Parsing scraped PDFs...');

    const allParsedQuestions: Array<{
      number: number;
      stem: string;
      options: Array<{ letter: string; text: string }>;
      correctAnswer?: string;
      metadata?: {
        source: string;
        year: number;
        difficulty?: number;
        area?: string;
      };
    }> = [];

    for (const [year, scrapedItem] of this.scrapedData) {
      if (!scrapedItem.pdf) {
        console.log(`  ℹ️  ENARE ${year}: No PDF available (skipping)`);
        continue;
      }

      try {
        const parsedExam = await this.parser.parsePDF(scrapedItem.pdf, year);
        this.parsedData.set(year, parsedExam);

        // Add parsed questions to overall list
        for (const q of parsedExam.questions) {
          allParsedQuestions.push({
            number: q.number,
            stem: q.stem,
            options: q.options,
            correctAnswer: q.correctAnswer,
            metadata: {
              source: 'enare-fgv',
              year,
              area: q.metadata?.area,
            },
          });
        }

        console.log(`  ✓ ENARE ${year}: ${parsedExam.questions.length} questions parsed`);
      } catch (err) {
        console.error(`  ✗ ENARE ${year}: Parsing failed: ${err}`);
      }
    }

    return {
      questions: allParsedQuestions,
      metadata: {
        source: 'enare-fgv-portal',
        year: 2024,
        itemsRead: allParsedQuestions.length,
        itemsValid: allParsedQuestions.length,
      },
      parseStats: {
        totalExtracted: allParsedQuestions.length,
        successCount: allParsedQuestions.length,
        failureCount: 0,
        warnings: [],
      },
    };
  }

  async transform(questions: ParsedQuestions): Promise<CompleteQuestions> {
    console.log('🔄 ENARE: Transforming questions with IRT estimation...');

    // Reorganize questions by year for transformer
    const questionsByYear = new Map<number, Array<any>>();
    for (const q of questions.questions) {
      const year = q.metadata?.year || 2024;
      if (!questionsByYear.has(year)) {
        questionsByYear.set(year, []);
      }
      questionsByYear.get(year)!.push(q);
    }

    const result = this.transformer.transformQuestions(questionsByYear);

    console.log(`  ✓ ENARE: ${result.questions.length} questions transformed with IRT parameters`);

    return result;
  }

  async validate(questions: CompleteQuestions): Promise<ValidationResult> {
    console.log('✓ ENARE: Validating questions...');

    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    for (const q of questions.questions) {
      if (!q.id || !q.bankId || !q.stem) {
        errors.push(`Question ${q.id} missing required fields`);
        continue;
      }

      // Check IRT bounds
      if (
        q.irt.difficulty < -4 ||
        q.irt.difficulty > 4 ||
        q.irt.discrimination < 0.3 ||
        q.irt.discrimination > 2.5 ||
        q.irt.guessing < 0 ||
        q.irt.guessing > 0.5
      ) {
        warnings.push(`Question ${q.id} has IRT parameters outside normal bounds`);
      }

      // Check confidence
      if (q.irt.confidence < 0.6) {
        warnings.push(`Question ${q.id} has low confidence (${q.irt.confidence})`);
      }

      validCount++;
    }

    console.log(`  ✓ ENARE: ${validCount}/${questions.questions.length} questions valid`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalQuestions: questions.questions.length,
        validQuestions: validCount,
        invalidQuestions: questions.questions.length - validCount,
      },
    };
  }

  async load(questions: CompleteQuestions): Promise<string> {
    console.log('💾 ENARE: Generating SQL...');

    const timestamp = new Date().toISOString();
    const sql: string[] = [
      sqlComment('============================================================================'),
      sqlComment('ENARE Official Questions with Metadata-Based IRT Parameters'),
      sqlComment(`Generated: ${timestamp}`),
      sqlComment(
        'Source: FGV Portal (https://conhecimento.fgv.br/concursos/enare)'
      ),
      sqlComment(`Items: ${questions.questions.length} questions across multiple years`),
      sqlComment('============================================================================'),
      '',
      sqlComment('Create question banks for each ENARE year'),
    ];

    // Create banks for each year
    const yearSet = new Set(questions.questions.map((q) => q.year));
    for (const year of Array.from(yearSet).sort()) {
      sql.push(`INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)`);
      sql.push(`VALUES (`);
      sql.push(`  'enare-${year}',`);
      sql.push(`  'ENARE ${year}',`);
      sql.push(
        `  'ENARE unified national residency exam ${year} with metadata-based IRT parameters',`
      );
      sql.push(`  'enare_fgv',`);
      sql.push(`  ${year},`);
      sql.push(`  ${year},`);
      sql.push(`  FALSE`);
      sql.push(`)`);
      sql.push(`ON CONFLICT (id) DO UPDATE SET updated_at = NOW();`);
      sql.push('');
    }

    sql.push(sqlComment(`Insert ${questions.questions.length} questions with IRT parameters`));
    sql.push(`INSERT INTO questions (`);
    sql.push(`  id,`);
    sql.push(`  bank_id,`);
    sql.push(`  stem,`);
    sql.push(`  options,`);
    sql.push(`  correct_index,`);
    sql.push(`  area,`);
    sql.push(`  irt_difficulty,`);
    sql.push(`  irt_discrimination,`);
    sql.push(`  irt_guessing,`);
    sql.push(`  year,`);
    sql.push(`  validated_by`);
    sql.push(`)`);
    sql.push(`VALUES`);

    // Add question rows
    questions.questions.forEach((q, index) => {
      const options = q.options.map((opt) => ({
        letter: opt.letter,
        text: opt.text,
        feedback: opt.feedback || '',
      }));

      const comma = index < questions.questions.length - 1 ? ',' : '';

      sql.push(`  (`);
      sql.push(`    ${sqlValue(q.id)},`);
      sql.push(`    ${sqlValue(q.bankId)},`);
      sql.push(`    ${sqlValue(q.stem)},`);
      sql.push(
        `    '${JSON.stringify(options).replace(/'/g, "''")}'::jsonb,`
      );
      sql.push(`    ${q.correctIndex},`);
      sql.push(`    ${sqlValue(q.area)},`);
      sql.push(`    ${q.irt.difficulty},`);
      sql.push(`    ${q.irt.discrimination},`);
      sql.push(`    ${q.irt.guessing},`);
      sql.push(`    ${q.year},`);
      sql.push(`    'metadata-estimation'`);
      sql.push(`  )${comma}`);
    });

    sql.push(`ON CONFLICT (id) DO UPDATE SET`);
    sql.push(`  irt_difficulty = EXCLUDED.irt_difficulty,`);
    sql.push(`  irt_discrimination = EXCLUDED.irt_discrimination,`);
    sql.push(`  irt_guessing = EXCLUDED.irt_guessing,`);
    sql.push(`  updated_at = NOW();`);
    sql.push('');

    sqlComment('Update question counts');
    for (const year of Array.from(yearSet).sort()) {
      sql.push(`UPDATE question_banks`);
      sql.push(`SET question_count = (`);
      sql.push(`  SELECT COUNT(*) FROM questions WHERE bank_id = 'enare-${year}'`);
      sql.push(`)`);
      sql.push(`WHERE id = 'enare-${year}';`);
    }
    sql.push('');

    const content = sql.join('\n');

    // Write SQL file
    const sqlPath = join(this.outputDir, '06_enare_2024_questions.sql');
    writeFileSync(sqlPath, content, 'utf-8');

    console.log(`  ✓ ENARE: SQL file written to ${sqlPath}`);

    return sqlPath;
  }

  estimatedQuestionCount(): number {
    return 300; // 100 × 3 years minimum
  }

  supportedYears(): number[] {
    return [2021, 2022, 2023, 2024];
  }

  requiresManualSetup(): boolean {
    return true; // FGV portal may require manual login or direct PDF download
  }
}
