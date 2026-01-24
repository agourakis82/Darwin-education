/**
 * REVALIDA Plugin
 * Revalidação de Diplomas Médicos (foreign medical graduates exam)
 * Objective questions only (Phase 1: skips discursive portion)
 */

import type {
  ETLPlugin,
  ScrapedData,
  ParsedQuestions,
  CompleteQuestions,
  ValidationResult,
} from '../../etl-core/types/plugin';
import { REVALIDAScraper, type REVALIDAScrapedExam } from './scraper';
import { REVALIDAParser, type ParsedREVALIDAExam } from './parser';
import { REVALIDATransformer } from './transformer';
import { sqlValue, sqlComment } from '../../etl-core/utils/sql';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class REVALIDAPlugin implements ETLPlugin {
  readonly id = 'revalida';
  readonly name = 'REVALIDA';
  readonly description =
    'REVALIDA (foreign medical graduates exam) with 80+ objective questions per year from 2023-2025';
  readonly version = '1.0.0';

  private outputDir: string;
  private cacheDir: string;
  private scraper: REVALIDAScraper;
  private parser: REVALIDAParser;
  private transformer: REVALIDATransformer;
  private scrapedData: REVALIDAScrapedExam[] = [];
  private parsedData: Map<number, ParsedREVALIDAExam> = new Map();

  constructor() {
    this.outputDir = join(__dirname, 'outputs');
    this.cacheDir = join(__dirname, 'cache');
    this.scraper = new REVALIDAScraper(this.cacheDir, this.outputDir);
    this.parser = new REVALIDAParser();
    this.transformer = new REVALIDATransformer();
  }

  async initialize(): Promise<void> {
    console.log('🔧 REVALIDA: Initializing...');
    await this.scraper.initialize();
    mkdirSync(this.outputDir, { recursive: true });
  }

  async scrape(): Promise<ScrapedData> {
    console.log('📥 REVALIDA: Scraping INEP portal for 2023-2025 exams...');

    this.scrapedData = await this.scraper.scrapeAllYears();

    // Count valid PDFs
    const pdfsWithContent = this.scrapedData.filter((exam) => exam.pdf !== null).length;

    return {
      pdfs: new Map(
        this.scrapedData
          .filter((exam) => exam.pdf !== null)
          .map((exam) => [`revalida_${exam.year}`, exam.pdf!])
      ),
      metadata: {
        source: 'revalida-inep',
        year: 2025,
        itemCount: 240, // 80 × 3 years (objective only)
        validItems: pdfsWithContent * 80,
        message: `Scraped ${pdfsWithContent} years of REVALIDA exams (objective portion only)`,
      },
      timestamp: new Date(),
    };
  }

  async parse(data: ScrapedData): Promise<ParsedQuestions> {
    console.log('📖 REVALIDA: Parsing scraped PDFs (objective portion)...');

    const allParsedQuestions: Array<{
      number: number;
      stem: string;
      options: Array<{ letter: string; text: string }>;
      correctAnswer?: string;
      metadata?: { source: string; year: number; area?: string };
    }> = [];

    for (const exam of this.scrapedData) {
      if (!exam.pdf) {
        console.log(`  ℹ️  REVALIDA ${exam.year}: No PDF available (skipping)`);
        continue;
      }

      try {
        const parsedExam = await this.parser.parsePDF(exam.pdf, exam.year);
        this.parsedData.set(exam.year, parsedExam);

        // Add parsed questions to overall list
        for (const q of parsedExam.questions) {
          allParsedQuestions.push({
            number: q.number,
            stem: q.stem,
            options: q.options,
            correctAnswer: q.correctAnswer,
            metadata: {
              source: 'revalida-inep',
              year: exam.year,
              area: q.metadata?.area,
            },
          });
        }

        console.log(`  ✓ REVALIDA ${exam.year}: ${parsedExam.questions.length} objective questions parsed`);

        if (parsedExam.parseStats.warnings.length > 0) {
          parsedExam.parseStats.warnings.forEach((w) => console.log(`    ⚠️  ${w}`));
        }
      } catch (err) {
        console.error(`  ✗ REVALIDA ${exam.year}: Parsing failed: ${err}`);
      }
    }

    return {
      questions: allParsedQuestions,
      metadata: {
        source: 'revalida-inep',
        year: 2025,
        itemsRead: allParsedQuestions.length,
        itemsValid: allParsedQuestions.length,
      },
      parseStats: {
        totalExtracted: allParsedQuestions.length,
        successCount: allParsedQuestions.length,
        failureCount: 0,
        warnings: [
          'REVALIDA area classification is estimated. Manual review recommended before using in production.',
        ],
      },
    };
  }

  async transform(questions: ParsedQuestions): Promise<CompleteQuestions> {
    console.log('🔄 REVALIDA: Transforming questions with IRT estimation...');

    // Reorganize questions by year for transformer
    const questionsByYear = new Map<number, Array<any>>();
    for (const q of questions.questions) {
      const year = q.metadata?.year || 2025;
      if (!questionsByYear.has(year)) {
        questionsByYear.set(year, []);
      }
      questionsByYear.get(year)!.push(q);
    }

    const result = this.transformer.transformQuestions(questionsByYear);

    console.log(
      `  ✓ REVALIDA: ${result.questions.length} questions transformed with IRT parameters (LOWER CONFIDENCE)`
    );

    return result;
  }

  async validate(questions: CompleteQuestions): Promise<ValidationResult> {
    console.log('✓ REVALIDA: Validating questions...');

    const errors: string[] = [];
    const warnings: string[] = [
      'REVALIDA area classification is uncertain - marked for manual review',
      'All REVALIDA questions should be reviewed by subject matter expert',
    ];
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

      // Flag low confidence
      if (q.irt.confidence < 0.5) {
        warnings.push(`Question ${q.id} has very low confidence (${q.irt.confidence})`);
      }

      validCount++;
    }

    console.log(`  ✓ REVALIDA: ${validCount}/${questions.questions.length} questions valid`);
    console.log(`  ⚠️  ${warnings.length} warnings (area classification uncertainty)`);

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
    console.log('💾 REVALIDA: Generating SQL...');

    const timestamp = new Date().toISOString();
    const sql: string[] = [
      sqlComment('============================================================================'),
      sqlComment('REVALIDA Objective Questions with Metadata-Based IRT Parameters'),
      sqlComment(`Generated: ${timestamp}`),
      sqlComment('Source: INEP Portal (https://www.gov.br/inep/revalida)'),
      sqlComment(`Items: ${questions.questions.length} objective questions across 2023-2025`),
      sqlComment('Note: Area classification is estimated and requires manual review'),
      sqlComment('============================================================================'),
      '',
      sqlComment('Create question banks for each REVALIDA year'),
    ];

    // Create banks for each year
    const yearSet = new Set(questions.questions.map((q) => q.year));
    for (const year of Array.from(yearSet).sort()) {
      sql.push(`INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)`);
      sql.push(`VALUES (`);
      sql.push(`  'revalida-${year}',`);
      sql.push(`  'REVALIDA ${year}',`);
      sql.push(
        `  'REVALIDA ${year} objective questions with metadata-based IRT (area classification requires review)',`
      );
      sql.push(`  'revalida_inep',`);
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
      sql.push(`    'metadata-estimation-low-confidence'`);
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
      sql.push(`  SELECT COUNT(*) FROM questions WHERE bank_id = 'revalida-${year}'`);
      sql.push(`)`);
      sql.push(`WHERE id = 'revalida-${year}';`);
    }
    sql.push('');

    const content = sql.join('\n');

    // Write SQL file
    const sqlPath = join(this.outputDir, '08_revalida_questions.sql');
    writeFileSync(sqlPath, content, 'utf-8');

    console.log(`  ✓ REVALIDA: SQL file written to ${sqlPath}`);

    return sqlPath;
  }

  estimatedQuestionCount(): number {
    return 240; // 80 × 3 years (objective only)
  }

  supportedYears(): number[] {
    return [2023, 2024, 2025];
  }

  requiresManualSetup(): boolean {
    return false; // Direct INEP URLs available
  }
}
