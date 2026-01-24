/**
 * USP/UNIFESP FUVEST Plugin
 * Residency exams from USP (via FUVEST portal) and UNIFESP
 */

import type {
  ETLPlugin,
  ScrapedData,
  ParsedQuestions,
  CompleteQuestions,
  ValidationResult,
} from '../../etl-core/types/plugin';
import { USPScraper, type USPScrapedExam } from './scraper';
import { USPParser } from './parser';
import { USPTransformer } from './transformer';
import { sqlValue, sqlComment } from '../../etl-core/utils/sql';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class USPFUVESTPlugin implements ETLPlugin {
  readonly id = 'usp-fuvest';
  readonly name = 'USP/UNIFESP FUVEST';
  readonly description =
    'USP (FUVEST) and UNIFESP residency exams with 100+ questions per year from 2020-2024';
  readonly version = '1.0.0';

  private outputDir: string;
  private cacheDir: string;
  private scraper: USPScraper;
  private parser: USPParser;
  private transformer: USPTransformer;
  private scrapedExams: USPScrapedExam[] = [];
  private parsedExams: Array<{
    year: number;
    title: string;
    questions: Array<{
      number: number;
      stem: string;
      options: Array<{ letter: string; text: string }>;
      correctAnswer?: string;
      metadata?: { source?: string; year?: number; area?: string };
    }>;
  }> = [];

  constructor() {
    this.outputDir = join(__dirname, 'outputs');
    this.cacheDir = join(__dirname, 'cache');
    this.scraper = new USPScraper(this.cacheDir, this.outputDir);
    this.parser = new USPParser();
    this.transformer = new USPTransformer();
  }

  async initialize(): Promise<void> {
    console.log('🔧 USP/UNIFESP: Initializing...');
    await this.scraper.initialize();
    mkdirSync(this.outputDir, { recursive: true });
  }

  async scrape(): Promise<ScrapedData> {
    console.log('📥 USP/UNIFESP: Scraping FUVEST portal for 2020-2024 exams...');

    this.scrapedExams = await this.scraper.scrapeAllYears();

    // Count valid PDFs
    const pdfsWithContent = this.scrapedExams.filter((exam) => exam.pdf !== null).length;

    return {
      pdfs: new Map(
        this.scrapedExams
          .filter((exam) => exam.pdf !== null)
          .map((exam) => [`usp_fuvest_${exam.year}`, exam.pdf!])
      ),
      metadata: {
        source: 'usp-fuvest-portal',
        year: 2024,
        itemCount: 500, // 100 × 5 years
        validItems: pdfsWithContent * 100,
        message: `Scraped ${pdfsWithContent} years of USP/FUVEST exams (2020-2024)`,
      },
      timestamp: new Date(),
    };
  }

  async parse(data: ScrapedData): Promise<ParsedQuestions> {
    console.log('📖 USP/UNIFESP: Parsing scraped PDFs...');

    const allParsedQuestions: Array<{
      number: number;
      stem: string;
      options: Array<{ letter: string; text: string }>;
      correctAnswer?: string;
      metadata?: { source: string; year: number; area?: string };
    }> = [];

    for (const exam of this.scrapedExams) {
      if (!exam.pdf) {
        console.log(`  ℹ️  USP/UNIFESP ${exam.year}: No PDF available (skipping)`);
        continue;
      }

      try {
        const parsedExam = await this.parser.parsePDF(exam.pdf, exam.year, exam.title);

        // Store parsed exam for transformer
        this.parsedExams.push({
          year: parsedExam.year,
          title: parsedExam.title,
          questions: parsedExam.questions as any,
        });

        // Add to overall question list
        for (const q of parsedExam.questions) {
          allParsedQuestions.push({
            number: q.number,
            stem: q.stem,
            options: q.options,
            correctAnswer: q.correctAnswer,
            metadata: {
              source: 'usp-fuvest',
              year: exam.year,
              area: q.metadata?.area,
            },
          });
        }

        console.log(
          `  ✓ USP/UNIFESP ${exam.year}: ${parsedExam.questions.length} questions parsed (format: ${parsedExam.formatDetected})`
        );
      } catch (err) {
        console.error(`  ✗ USP/UNIFESP ${exam.year}: Parsing failed: ${err}`);
      }
    }

    return {
      questions: allParsedQuestions,
      metadata: {
        source: 'usp-fuvest-portal',
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
    console.log('🔄 USP/UNIFESP: Transforming questions with IRT estimation...');

    const result = this.transformer.transformQuestions(this.parsedExams);

    console.log(`  ✓ USP/UNIFESP: ${result.questions.length} questions transformed with IRT parameters`);

    return result;
  }

  async validate(questions: CompleteQuestions): Promise<ValidationResult> {
    console.log('✓ USP/UNIFESP: Validating questions...');

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

      validCount++;
    }

    console.log(`  ✓ USP/UNIFESP: ${validCount}/${questions.questions.length} questions valid`);

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
    console.log('💾 USP/UNIFESP: Generating SQL...');

    const timestamp = new Date().toISOString();
    const sql: string[] = [
      sqlComment('============================================================================'),
      sqlComment('USP/UNIFESP FUVEST Residency Questions with Metadata-Based IRT Parameters'),
      sqlComment(`Generated: ${timestamp}`),
      sqlComment('Source: FUVEST Portal (https://www.fuvest.br/residencia-medica/)'),
      sqlComment(`Items: ${questions.questions.length} questions across 2020-2024`),
      sqlComment('============================================================================'),
      '',
      sqlComment('Create question banks for each year'),
    ];

    // Create banks for each year
    const yearSet = new Set(questions.questions.map((q) => q.year));
    for (const year of Array.from(yearSet).sort()) {
      sql.push(`INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)`);
      sql.push(`VALUES (`);
      sql.push(`  'usp-fuvest-${year}',`);
      sql.push(`  'USP/UNIFESP ${year}',`);
      sql.push(
        `  'USP (FUVEST) and UNIFESP residency exam ${year} with metadata-based IRT parameters',`
      );
      sql.push(`  'usp_fuvest',`);
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
      sql.push(`    '${JSON.stringify(options).replace(/'/g, "''")}'::jsonb,`);
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
      sql.push(`  SELECT COUNT(*) FROM questions WHERE bank_id = 'usp-fuvest-${year}'`);
      sql.push(`)`);
      sql.push(`WHERE id = 'usp-fuvest-${year}';`);
    }
    sql.push('');

    const content = sql.join('\n');

    // Write SQL file
    const sqlPath = join(this.outputDir, '07_usp_fuvest_questions.sql');
    writeFileSync(sqlPath, content, 'utf-8');

    console.log(`  ✓ USP/UNIFESP: SQL file written to ${sqlPath}`);

    return sqlPath;
  }

  estimatedQuestionCount(): number {
    return 500; // 100 × 5 years
  }

  supportedYears(): number[] {
    return [2020, 2021, 2022, 2023, 2024];
  }

  requiresManualSetup(): boolean {
    return true; // FUVEST portal may require manual PDF downloads
  }
}
