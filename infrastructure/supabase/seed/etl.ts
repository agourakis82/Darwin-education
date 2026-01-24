#!/usr/bin/env tsx
/**
 * ETL CLI Entry Point
 * Unified command-line interface for all question source plugins
 */

import { PluginRegistry } from './etl-core/registry/plugin-registry';
import { runPlugin, runPluginsInParallel } from './etl-core/registry/plugin-runner';

// Import plugins
import { ENAMED2025Plugin } from './sources/enamed-2025/plugin';
import { ENAREPlugin } from './sources/enare-2024/plugin';
import { USPFUVESTPlugin } from './sources/usp-fuvest/plugin';
import { REVALIDAPlugin } from './sources/revalida/plugin';
import { RegionalPlugin } from './sources/regional/plugin';

async function main() {
  const registry = new PluginRegistry();

  // Register all available plugins
  registry.register(new ENAMED2025Plugin());
  registry.register(new ENAREPlugin());
  registry.register(new USPFUVESTPlugin());
  registry.register(new REVALIDAPlugin());
  registry.register(new RegionalPlugin());

  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'list': {
        console.log('\n📋 Available ETL Plugins:\n');
        const summary = registry.getSummary();
        console.log(`Total plugins: ${summary.totalPlugins}`);
        console.log(`Total questions: ${summary.totalQuestions}\n`);

        summary.plugins.forEach((p) => {
          console.log(`  ✓ ${p.id}`);
          console.log(`    Name: ${p.name}`);
          console.log(`    Questions: ${p.questions}`);
          console.log(`    Years: ${p.years.join(', ')}\n`);
        });
        break;
      }

      case 'run': {
        const pluginId = args[0];
        if (!pluginId) {
          console.error('❌ Usage: pnpm etl run <plugin-id>');
          process.exit(1);
        }

        const plugin = registry.get(pluginId);
        if (!plugin) {
          console.error(`❌ Plugin not found: ${pluginId}`);
          process.exit(1);
        }

        const result = await runPlugin(plugin);
        process.exit(result.success ? 0 : 1);
        break;
      }

      case 'batch': {
        if (args.length === 0) {
          console.error('❌ Usage: pnpm etl batch <plugin-id> [plugin-id] ...');
          process.exit(1);
        }

        const plugins = args
          .map((id) => {
            const p = registry.get(id);
            if (!p) {
              console.error(`❌ Plugin not found: ${id}`);
            }
            return p;
          })
          .filter((p): p is NonNullable<typeof p> => p !== undefined && p !== null);

        if (plugins.length === 0) {
          console.error('❌ No valid plugins found');
          process.exit(1);
        }

        const results = await runPluginsInParallel(plugins);
        const allSuccess = results.every((r) => r.success);
        process.exit(allSuccess ? 0 : 1);
        break;
      }

      case 'info': {
        const pluginId = args[0];
        if (!pluginId) {
          console.error('❌ Usage: pnpm etl info <plugin-id>');
          process.exit(1);
        }

        const plugin = registry.get(pluginId);
        if (!plugin) {
          console.error(`❌ Plugin not found: ${pluginId}`);
          process.exit(1);
        }

        console.log(`\n📦 Plugin Information\n`);
        console.log(`ID: ${plugin.id}`);
        console.log(`Name: ${plugin.name}`);
        console.log(`Description: ${plugin.description}`);
        console.log(`Version: ${plugin.version}`);
        console.log(`Questions: ${plugin.estimatedQuestionCount()}`);
        console.log(`Years: ${plugin.supportedYears().join(', ')}`);
        console.log(`Manual setup required: ${plugin.requiresManualSetup() ? 'Yes' : 'No'}\n`);
        break;
      }

      case 'help':
      case '-h':
      case '--help': {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║              ETL Plugin Manager                                 ║
║              Question Source Management for Darwin             ║
╚════════════════════════════════════════════════════════════════╝

USAGE
  pnpm etl <command> [options]

COMMANDS
  list                    List all available plugins
  run <plugin-id>         Execute a plugin pipeline
  batch <ids...>          Run multiple plugins in parallel
  info <plugin-id>        Show plugin information
  help                    Show this help message

EXAMPLES
  pnpm etl list
  pnpm etl run enamed-2025
  pnpm etl batch enamed-2025 enare-2024 usp-fuvest
  pnpm etl info enamed-2025

PLUGINS
  Available plugins can be seen with 'pnpm etl list'

DOCUMENTATION
  For more information, see:
  - ETL_FRAMEWORK_SUMMARY.md - Framework architecture
  - infrastructure/supabase/seed/etl-core/README.md - API documentation
`);
        break;
      }

      default: {
        console.error(`❌ Unknown command: ${command || '(none)'}`);
        console.error('Run "pnpm etl help" for usage information');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
