/**
 * Plugin Registry
 * Manages registration and discovery of ETL plugins
 */

import type { ETLPlugin } from '../types/plugin';

export class PluginRegistry {
  private plugins: Map<string, ETLPlugin> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: ETLPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`⚠️  Plugin ${plugin.id} is already registered, overwriting...`);
    }
    this.plugins.set(plugin.id, plugin);
    console.log(`✓ Registered plugin: ${plugin.id} (${plugin.name})`);
  }

  /**
   * Get plugin by ID
   */
  get(id: string): ETLPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * List all registered plugins
   */
  list(): ETLPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if plugin is registered
   */
  has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get total question count across all plugins
   */
  getTotalQuestionCount(): number {
    return Array.from(this.plugins.values()).reduce(
      (sum, plugin) => sum + plugin.estimatedQuestionCount(),
      0
    );
  }

  /**
   * Get summary information
   */
  getSummary(): {
    totalPlugins: number;
    totalQuestions: number;
    plugins: Array<{
      id: string;
      name: string;
      questions: number;
      years: number[];
    }>;
  } {
    const plugins = this.list().map((p) => ({
      id: p.id,
      name: p.name,
      questions: p.estimatedQuestionCount(),
      years: p.supportedYears(),
    }));

    return {
      totalPlugins: plugins.length,
      totalQuestions: plugins.reduce((sum, p) => sum + p.questions, 0),
      plugins,
    };
  }
}
