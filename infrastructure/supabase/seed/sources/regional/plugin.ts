/**
 * Regional Plugin
 * Multi-source regional residency exams: AMRIGS (RS), SURCE (CE), SUS-SP Quadrix (SP)
 * Total: 1,200 questions across 3 sources, 3 years each
 */

import type {
  ETLPlugin,
  ScrapedData,
  ParsedQuestions,
  CompleteQuestions,
  ValidationResult,
} from '../../etl-core/types/plugin';
import { RegionalScraper, type RegionalScrapedExam } from './scraper';
import { RegionalParser } from './parser';
import { RegionalTransformer } from './transformer';
import { sqlValue, sqlComment } from '../../etl-core/utils/sql';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RegionalPlugin implements ETLPlugin {
  readonly id = 'regional';
  readonly name = 'Regional Exams';
  readonly description =
    'Regional residency exams (AMRIGS RS, SURCE CE, SUS-SP Quadrix) - 400 questions per source';
  readonly version = '1.0.0';

  private outputDir: string;
  private cacheDir: string;
  private scraper: RegionalScraper;
  private parser: RegionalParser;
  private transformer: RegionalTransformer;
  private scrapedExams: RegionalScrapedExam[] = [];
  private parsedExams: Array<{
    sourceId: 'amrigs' | 'surce' | 'susSp';
    year: number;
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
    this.scraper = new RegionalScraper(this.cacheDir, this.outputDir);
    this.parser = new RegionalParser();
    this.transformer = new RegionalTransformer();
  }

  async initialize(): Promise<void> {
    console.log('🔧 Regional: Initializing...');
    await this.scraper.initialize();
    mkdirSync(this.outputDir, { recursive: true });
  }

  async scrape(): Promise<ScrapedData> {
    console.log('📥 Regional: Scraping AMRIGS, SURCE, and SUS-SP portals...');

    this.scrapedExams = await this.scraper.scrapeAllSources();

    // Count valid PDFs by source
    const countBySource = new Map<string, number>();
    for (const exam of this.scrapedExams) {
      if (exam.pdf !== null) {
        countBySource.set(
          exam.sourceId,
          (countBySource.get(exam.sourceId) || 0) + 1
        );
      }
    }

    let message = 'Scraped regional exams: ';
    for (const [sourceId, count] of countBySource) {
      message += `${sourceId}(${count} years) `;
    }

    return {
      pdfs: new Map(
        this.scrapedExams
          .filter((exam) => exam.pdf !== null)
          .map((exam) => [`regional_${exam.sourceId}_${exam.year}`, exam.pdf!])
      ),
      metadata: {
        source: 'regional-portals',
        year: 2024,
        itemCount: 1200, // 100 × 3 sources × 4 years
        validItems:
          Array.from(countBySource.values()).reduce((a, b) => a + b, 0) * 100,
        message,
      },
      timestamp: new Date(),
    };
  }

  async parse(data: ScrapedData): Promise<ParsedQuestions> {
    console.log('📖 Regional: Parsing scraped PDFs from all sources...');

    const allParsedQuestions: Array<{
      number: number;
      stem: string;
      options: Array<{ letter: string; text: string }>;
      correctAnswer?: string;
      metadata?: { source: string; year: number; area?: string };
    }> = [];

    for (const exam of this.scrapedExams) {
      if (!exam.pdf) {
        console.log(`  ℹ️  ${exam.metadata.source} ${exam.year}: No PDF available (skipping)`);
        continue;
      }

      try {
        const parsedExam = await this.parser.parsePDF(exam.pdf, exam.sourceId, exam.year);

        // Store parsed exam for transformer
        this.parsedExams.push({
          sourceId: parsedExam.sourceId,
          year: parsedExam.year,
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
              source: `regional-${exam.sourceId}`,
              year: exam.year,
              area: q.metadata?.area,
            },
          });
        }

        console.log(
          `  ✓ ${exam.metadata.source} ${exam.year}: ${parsedExam.questions.length} questions parsed`
        );
      } catch (err) {
        console.error(`  ✗ ${exam.metadata.source} ${exam.year}: Parsing failed: ${err}`);
      }
    }

    return {
      questions: allParsedQuestions,
      metadata: {
        source: 'regional-portals',
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
    console.log('🔄 Regional: Transforming questions with IRT estimation...');

    const result = this.transformer.transformQuestions(this.parsedExams);

    console.log(
      `  ✓ Regional: ${result.questions.length} questions transformed with IRT parameters`
    );

    return result;
  }

  async validate(questions: CompleteQuestions): Promise<ValidationResult> {
    console.log('✓ Regional: Validating questions...');

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

    console.log(`  ✓ Regional: ${validCount}/${questions.questions.length} questions valid`);

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
    console.log('💾 Regional: Generating SQL...');

    const timestamp = new Date().toISOString();
    const sql: string[] = [
      sqlComment('============================================================================'),
      sqlComment('Regional Residency Exams with Metadata-Based IRT Parameters'),
      sqlComment(`Generated: ${timestamp}`),
      sqlComment('Sources: AMRIGS (RS), SURCE (CE), SUS-SP Quadrix (SP)'),
      sqlComment(`Items: ${questions.questions.length} questions across 3 sources, 3 years`),
      sqlComment('============================================================================'),
      '',
      sqlComment('Create question banks for each regional source and year'),
    ];

    // Create banks by source and year
    const bankSets = new Set<string>();
    for (const q of questions.questions) {
      bankSets.add(q.bankId);
    }

    for (const bankId of Array.from(bankSets).sort()) {
      sql.push(`INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)`);
      sql.push(`VALUES (`);
      sql.push(`  '${bankId}',`);
      sql.push(`  '${bankId.replace(/-/g, ' ').toUpperCase()}',`);
      sql.push(`  'Regional residency exam with metadata-based IRT parameters',`);
      sql.push(`  'regional_portals',`);
      sql.push(`  2022,`);
      sql.push(`  2024,`);
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
    for (const bankId of Array.from(bankSets).sort()) {
      sql.push(`UPDATE question_banks`);
      sql.push(`SET question_count = (`);
      sql.push(`  SELECT COUNT(*) FROM questions WHERE bank_id = '${bankId}'`);
      sql.push(`)`);
      sql.push(`WHERE id = '${bankId}';`);
    }
    sql.push('');

    const content = sql.join('\n');

    // Write SQL file
    const sqlPath = join(this.outputDir, '09_regional_questions.sql');
    writeFileSync(sqlPath, content, 'utf-8');

    console.log(`  ✓ Regional: SQL file written to ${sqlPath}`);

    return sqlPath;
  }

  estimatedQuestionCount(): number {
    return 1200; // 100 × 3 sources × 4 years
  }

  supportedYears(): number[] {
    return [2021, 2022, 2023, 2024];
  }

  requiresManualSetup(): boolean {
    return true; // Regional portals may require manual PDF downloads
  }
}
