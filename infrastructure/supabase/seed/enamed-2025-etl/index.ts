#!/usr/bin/env npx tsx
/**
 * ENAMED 2025 ETL Pipeline
 * =========================
 *
 * Imports ENAMED 2025 microdata and INEP portal content into Darwin Education.
 *
 * Usage:
 *   npx tsx index.ts              # Run full pipeline
 *   npx tsx index.ts --scrape     # Only download/parse PDFs
 *   npx tsx index.ts --parse      # Only parse microdata (no scraping)
 *   npx tsx index.ts --validate   # Only run validation
 *   npx tsx index.ts --irt-only   # Generate SQL with IRT params only (no PDF content)
 *   npx tsx index.ts --sample 100 # Limit participant sample size
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

// Config and types
import { OUTPUT_DIR, QUESTION_BANK_CONFIG } from './config';
import type { ETLOptions, ETLResult, CompleteQuestion, StatisticsReport } from './types';

// Parsers
import {
  parseItemParameters,
  processItemParameters,
  getValidItems,
  getItemStatistics,
} from './parsers/item-parameters';
import {
  parseEnadeParticipants,
  getParticipantStatistics,
} from './parsers/participant-data';

// Scrapers
import { getExamPDFs } from './scrapers/inep-portal';
import {
  parseExamPDF,
  parseGabaritoPDF,
  mergeQuestionsWithGabarito,
} from './scrapers/pdf-parser';

// Transformers
import { inferAreaFromPosition } from './transformers/area-mapper';
import {
  mergeAllQuestions,
  getMergeStatistics,
  createPlaceholderQuestions,
} from './transformers/question-merger';

// Validators
import {
  validateScores,
  generateValidationReport,
} from './validators/score-validator';

// Loaders
import {
  generateQuestionsSql,
  generateIRTOnlySql,
  generateStatisticsSql,
  writeSqlFile,
} from './loaders/sql-generator';

/**
 * Parse command line arguments
 */
function parseArgs(): ETLOptions {
  const args = process.argv.slice(2);

  const options: ETLOptions = {
    scrapeOnly: args.includes('--scrape'),
    parseOnly: args.includes('--parse'),
    validateOnly: args.includes('--validate'),
    full: !args.some((a) =>
      ['--scrape', '--parse', '--validate', '--irt-only'].includes(a)
    ),
    skipValidation: args.includes('--skip-validation'),
    outputDir: OUTPUT_DIR,
    verbose: args.includes('--verbose') || args.includes('-v'),
    sampleSize: undefined,
  };

  // Parse sample size
  const sampleIdx = args.indexOf('--sample');
  if (sampleIdx !== -1 && args[sampleIdx + 1]) {
    options.sampleSize = parseInt(args[sampleIdx + 1], 10);
  }

  // IRT-only mode
  if (args.includes('--irt-only')) {
    options.parseOnly = true;
  }

  return options;
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Log with timestamp
 */
function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Run the full ETL pipeline
 */
async function runPipeline(options: ETLOptions): Promise<ETLResult> {
  const startTime = new Date();
  const result: ETLResult = {
    success: false,
    startTime,
    endTime: startTime,
    duration: 0,
    itemsParsed: 0,
    questionsScraped: 0,
    questionsMerged: 0,
    participantsProcessed: 0,
    errors: [],
    warnings: [],
  };

  try {
    ensureOutputDir();

    // =========================================================================
    // Step 1: Parse IRT Parameters from Microdata
    // =========================================================================
    log('Step 1: Parsing IRT parameters from microdata...');

    const rawItems = await parseItemParameters();
    const processedItems = processItemParameters(rawItems);
    const validItems = getValidItems(processedItems);
    const itemStats = getItemStatistics(processedItems);

    result.itemsParsed = processedItems.length;

    log(`  Parsed ${processedItems.length} items (${validItems.length} valid)`);
    log(
      `  Difficulty range: ${itemStats.difficultyRange.min.toFixed(2)} to ${itemStats.difficultyRange.max.toFixed(2)}`
    );
    log(
      `  Discrimination range: ${itemStats.discriminationRange.min.toFixed(2)} to ${itemStats.discriminationRange.max.toFixed(2)}`
    );

    // If IRT-only mode, generate SQL and exit
    if (process.argv.includes('--irt-only')) {
      log('Generating IRT-only SQL (no PDF content)...');

      const irtData = validItems.map((item) => ({
        itemNumber: item.NU_ITEM_PROVA_1,
        difficulty: item.PARAMETRO_B!,
        discrimination: item.estimatedDiscrimination,
        guessing: item.guessing,
        infit: item.INFIT,
        outfit: item.OUTFIT,
        area: inferAreaFromPosition(item.NU_ITEM_PROVA_1),
      }));

      const sql = generateIRTOnlySql(irtData);
      result.sqlFile = writeSqlFile('05_enamed_2025_questions.sql', sql);

      log(`Generated: ${result.sqlFile}`);
      result.success = true;
      result.questionsMerged = irtData.length;
      return result;
    }

    // If parse-only mode, stop here
    if (options.parseOnly && !options.validateOnly) {
      log('Parse-only mode: Stopping after IRT parameter parsing.');
      result.success = true;
      return result;
    }

    // =========================================================================
    // Step 2: Download and Parse PDFs from INEP Portal
    // =========================================================================
    let questions: CompleteQuestion[] = [];

    if (!options.validateOnly) {
      log('Step 2: Fetching exam PDFs from INEP portal...');

      try {
        const { caderno1, caderno2, gabarito, fromCache } = await getExamPDFs();
        log(`  PDFs ${fromCache ? 'loaded from cache' : 'downloaded'}`);

        // Parse PDFs
        log('  Parsing exam booklets...');
        const questions1 = await parseExamPDF(caderno1, 1);
        const questions2 = await parseExamPDF(caderno2, 2);

        log(`  Parsed ${questions1.length} questions from caderno 1`);
        log(`  Parsed ${questions2.length} questions from caderno 2`);

        // Parse gabarito
        log('  Parsing answer key...');
        const { caderno1: gab1, caderno2: gab2 } =
          await parseGabaritoPDF(gabarito);

        log(`  Extracted ${Object.keys(gab1.answers).length} answers`);

        // Merge questions with gabarito
        const merged1 = mergeQuestionsWithGabarito(questions1, gab1);
        const merged2 = mergeQuestionsWithGabarito(questions2, gab2);

        result.questionsScraped = merged1.length + merged2.length;

        // =========================================================================
        // Step 3: Merge Scraped Content with IRT Parameters
        // =========================================================================
        log('Step 3: Merging scraped content with IRT parameters...');

        const mergeResult = mergeAllQuestions(merged1, merged2, processedItems);
        questions = mergeResult.questions;

        for (const warning of mergeResult.warnings) {
          result.warnings.push(warning);
        }

        const mergeStats = getMergeStatistics(questions, processedItems);
        result.questionsMerged = mergeStats.merged;

        log(`  Merged ${mergeStats.merged} questions`);
        log(`  Coverage: ${(mergeStats.coverage * 100).toFixed(1)}%`);
        log(`  By area: ${JSON.stringify(mergeStats.byArea)}`);

        // Create placeholders for missing questions
        if (mergeStats.merged < mergeStats.validIRT) {
          const existing = new Set(questions.map((q) => q.originalItemNumber));
          const placeholders = createPlaceholderQuestions(
            processedItems,
            existing
          );
          questions.push(...placeholders);
          log(`  Added ${placeholders.length} placeholder questions`);
        }
      } catch (error) {
        result.errors.push(`PDF processing failed: ${error}`);
        log(`  Error: ${error}`);
        log('  Falling back to IRT-only mode...');

        // Fallback to placeholders
        const placeholders = createPlaceholderQuestions(
          processedItems,
          new Set()
        );
        questions = placeholders;
        result.questionsMerged = placeholders.length;
      }
    }

    // =========================================================================
    // Step 4: Parse Participant Data and Validate
    // =========================================================================
    if (!options.scrapeOnly && !options.skipValidation) {
      log('Step 4: Parsing participant data for validation...');

      try {
        const participants = await parseEnadeParticipants(options.sampleSize);
        const participantStats = getParticipantStatistics(participants);

        result.participantsProcessed = participants.length;

        log(`  Loaded ${participants.length} participants`);
        log(`  With scores: ${participantStats.withScores}`);
        log(
          `  Theta range: ${participantStats.thetaRange.min.toFixed(2)} to ${participantStats.thetaRange.max.toFixed(2)}`
        );

        // Validate scores
        log('Step 5: Validating Darwin TRI calculator...');

        const validationSummary = await validateScores(
          participants,
          processedItems,
          Math.min(options.sampleSize || 1000, 1000) // Cap validation at 1000
        );

        log(`  Pearson correlation: ${validationSummary.pearsonR.toFixed(4)}`);
        log(`  MAE: ${validationSummary.meanAbsoluteError.toFixed(4)}`);
        log(`  RMSE: ${validationSummary.rootMeanSquareError.toFixed(4)}`);
        log(`  Validation ${validationSummary.passed ? 'PASSED' : 'FAILED'}`);

        // Write validation report
        const reportJson = generateValidationReport(validationSummary);
        result.validationReport = path.join(OUTPUT_DIR, 'validation-report.json');
        writeFileSync(result.validationReport, reportJson);
        log(`  Report: ${result.validationReport}`);

        for (const rec of validationSummary.recommendations) {
          log(`  - ${rec}`);
        }
      } catch (error) {
        result.warnings.push(`Validation failed: ${error}`);
        log(`  Validation error: ${error}`);
      }
    }

    // =========================================================================
    // Step 5: Generate SQL
    // =========================================================================
    if (questions.length > 0) {
      log('Step 6: Generating SQL seed file...');

      const sql = generateQuestionsSql(questions);
      result.sqlFile = writeSqlFile('05_enamed_2025_questions.sql', sql);

      log(`  Generated: ${result.sqlFile}`);
      log(`  Questions: ${questions.length}`);
    }

    result.success = true;
  } catch (error) {
    result.errors.push(`Pipeline error: ${error}`);
    log(`Error: ${error}`);
  }

  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  return result;
}

/**
 * Print summary
 */
function printSummary(result: ETLResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('ETL Pipeline Summary');
  console.log('='.repeat(60));
  console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`Items parsed: ${result.itemsParsed}`);
  console.log(`Questions scraped: ${result.questionsScraped}`);
  console.log(`Questions merged: ${result.questionsMerged}`);
  console.log(`Participants processed: ${result.participantsProcessed}`);

  if (result.sqlFile) {
    console.log(`SQL file: ${result.sqlFile}`);
  }
  if (result.validationReport) {
    console.log(`Validation report: ${result.validationReport}`);
  }

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of result.warnings.slice(0, 10)) {
      console.log(`  - ${warning}`);
    }
    if (result.warnings.length > 10) {
      console.log(`  ... and ${result.warnings.length - 10} more`);
    }
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         ENAMED 2025 Microdata ETL Pipeline                 ║');
  console.log('║         Darwin Education                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const options = parseArgs();

  if (options.verbose) {
    console.log('Options:', options);
  }

  const result = await runPipeline(options);
  printSummary(result);

  process.exit(result.success ? 0 : 1);
}

// Run if called directly
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
