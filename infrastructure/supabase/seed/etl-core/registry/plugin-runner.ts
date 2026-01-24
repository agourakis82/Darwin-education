/**
 * Plugin Runner
 * Executes plugin pipelines and handles errors
 */

import type { ETLPlugin, ETLResult } from '../types/plugin';

export interface PluginRunnerOptions {
  skipScrape?: boolean;
  skipValidation?: boolean;
  outputDir?: string;
  verbose?: boolean;
}

/**
 * Run a single plugin through its full pipeline
 */
export async function runPlugin(
  plugin: ETLPlugin,
  options: PluginRunnerOptions = {}
): Promise<ETLResult> {
  const startTime = Date.now();
  const verbose = options.verbose !== false;

  try {
    if (verbose) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Running plugin: ${plugin.name}`);
      console.log(`${'='.repeat(60)}\n`);
    }

    // Initialize
    if (verbose) console.log('📋 Initializing plugin...');
    await plugin.initialize();

    // Scrape
    if (!options.skipScrape) {
      if (verbose) console.log('📥 Scraping data...');
      const scrapedData = await plugin.scrape();
      if (verbose) console.log(`✓ Scraped ${scrapedData.pdfs.size} files`);

      // Parse
      if (verbose) console.log('📝 Parsing questions...');
      const parsedQuestions = await plugin.parse(scrapedData);
      if (verbose) {
        console.log(`✓ Parsed ${parsedQuestions.questions.length} questions`);
        if (parsedQuestions.parseStats.warnings.length > 0) {
          parsedQuestions.parseStats.warnings.forEach((w) =>
            console.warn(`⚠️  ${w}`)
          );
        }
      }

      // Transform
      if (verbose) console.log('🔄 Transforming questions...');
      const completeQuestions = await plugin.transform(parsedQuestions);
      if (verbose) {
        console.log(
          `✓ Transformed ${completeQuestions.questions.length} questions`
        );
        if (completeQuestions.validationStats.issues.length > 0) {
          completeQuestions.validationStats.issues.forEach((issue) =>
            console.warn(`⚠️  ${issue}`)
          );
        }
      }

      // Validate
      if (!options.skipValidation) {
        if (verbose) console.log('✅ Validating questions...');
        const validationResult = await plugin.validate(completeQuestions);
        if (!validationResult.isValid) {
          const errors = validationResult.errors.join('; ');
          throw new Error(`Validation failed: ${errors}`);
        }
        if (verbose) {
          console.log(
            `✓ Validation passed (${validationResult.stats.validQuestions}/${validationResult.stats.totalQuestions})`
          );
          validationResult.warnings.forEach((w) => console.warn(`⚠️  ${w}`));
        }
      }

      // Load
      if (verbose) console.log('💾 Loading questions to SQL...');
      const sqlPath = await plugin.load(completeQuestions);
      if (verbose) console.log(`✓ Generated SQL: ${sqlPath}`);

      const duration = Date.now() - startTime;

      if (verbose) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Plugin completed successfully!`);
        console.log(`Total questions: ${completeQuestions.questions.length}`);
        console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log(`${'='.repeat(60)}\n`);
      }

      return {
        success: true,
        pluginId: plugin.id,
        totalQuestions: completeQuestions.questions.length,
        sqlPath,
        duration,
      };
    }

    throw new Error('Scraping skipped but no other pipeline steps available');
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (verbose) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`❌ Plugin failed!`);
      console.log(`Error: ${errorMsg}`);
      console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
      console.log(`${'='.repeat(60)}\n`);
    }

    return {
      success: false,
      pluginId: plugin.id,
      totalQuestions: 0,
      errors: [errorMsg],
      duration,
    };
  }
}

/**
 * Run multiple plugins in parallel
 */
export async function runPluginsInParallel(
  plugins: ETLPlugin[],
  options: PluginRunnerOptions = {}
): Promise<ETLResult[]> {
  console.log(`\n🚀 Running ${plugins.length} plugins in parallel...\n`);

  const results = await Promise.all(plugins.map((p) => runPlugin(p, options)));

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Batch Execution Summary');
  console.log(`${'='.repeat(60)}\n`);

  const successCount = results.filter((r) => r.success).length;
  const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(
      `${status} ${result.pluginId}: ${result.totalQuestions} questions`
    );
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((e) => console.error(`   Error: ${e}`));
    }
  });

  console.log(`\nTotal: ${successCount}/${plugins.length} plugins succeeded`);
  console.log(`Total questions: ${totalQuestions}`);
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`${'='.repeat(60)}\n`);

  return results;
}
