/**
 * AI Response Cache
 *
 * Caching layer for AI responses to reduce API costs.
 * Target: 80%+ cache hit rate for common requests.
 *
 * @module packages/shared/src/services/ai/cache
 */

import type { CacheRequestType, CacheConfig, CacheEntry } from '../../types/ai';
import { CacheError } from '../../types/ai';

/**
 * Default cache configurations by request type
 */
const DEFAULT_CACHE_CONFIGS: Record<CacheRequestType, CacheConfig> = {
  explain: {
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    enabled: true,
  },
  generate: {
    ttl: Number.POSITIVE_INFINITY, // Permanent cache for generated questions
    enabled: true,
  },
  case_study: {
    ttl: 30 * 24 * 60 * 60, // 30 days
    enabled: true,
  },
  summarize: {
    ttl: 14 * 24 * 60 * 60, // 14 days
    enabled: true,
  },
};

/**
 * AI response cache manager
 */
export class AICache {
  private configs: Record<CacheRequestType, CacheConfig>;

  constructor(configs?: Partial<Record<CacheRequestType, CacheConfig>>) {
    this.configs = {
      ...DEFAULT_CACHE_CONFIGS,
      ...configs,
    };
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(requestType: CacheRequestType, params: Record<string, any>): string {
    // Sort keys for consistent hashing
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    const paramsString = JSON.stringify(sortedParams);
    return this.hash(`${requestType}:${paramsString}`);
  }

  /**
   * Check if cache entry is valid
   */
  isValid(entry: CacheEntry): boolean {
    if (!entry) return false;

    const config = this.configs[entry.requestType];
    if (!config || !config.enabled) return false;

    // Check if entry has expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Calculate expiration date for a request type
   */
  calculateExpiresAt(requestType: CacheRequestType): Date {
    const config = this.configs[requestType];
    if (!config) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    if (config.ttl === Number.POSITIVE_INFINITY) {
      // Set to far future for "permanent" cache
      return new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
    }

    return new Date(Date.now() + config.ttl * 1000);
  }

  /**
   * Calculate cost in BRL based on token usage
   * Minimax abab6.5-chat pricing: ~R$0.002 per 1000 tokens
   */
  calculateCost(tokensUsed: number): number {
    const COST_PER_1K_TOKENS = 0.002; // R$0.002 per 1000 tokens
    return (tokensUsed / 1000) * COST_PER_1K_TOKENS;
  }

  /**
   * Simple hash function for cache keys
   * Uses DJB2 algorithm for speed
   */
  private hash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i); // hash * 33 + c
    }
    // Convert to hex string and ensure positive
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Update cache configuration for a request type
   */
  updateConfig(requestType: CacheRequestType, config: Partial<CacheConfig>): void {
    this.configs[requestType] = {
      ...this.configs[requestType],
      ...config,
    };
  }

  /**
   * Get cache configuration for a request type
   */
  getConfig(requestType: CacheRequestType): CacheConfig {
    return this.configs[requestType];
  }

  /**
   * Disable caching for a specific request type
   */
  disable(requestType: CacheRequestType): void {
    if (this.configs[requestType]) {
      this.configs[requestType].enabled = false;
    }
  }

  /**
   * Enable caching for a specific request type
   */
  enable(requestType: CacheRequestType): void {
    if (this.configs[requestType]) {
      this.configs[requestType].enabled = true;
    }
  }

  /**
   * Check if caching is enabled for a request type
   */
  isEnabled(requestType: CacheRequestType): boolean {
    return this.configs[requestType]?.enabled ?? false;
  }
}

/**
 * Default cache instance
 */
export const aiCache = new AICache();

/**
 * Cache statistics calculator
 */
export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalTokensSaved: number;
  costSavedBrl: number;
}

/**
 * Calculate cache statistics from entries
 */
export function calculateCacheStats(entries: CacheEntry[]): CacheStats {
  const totalRequests = entries.reduce((sum, e) => sum + e.hits + 1, 0); // +1 for initial request
  const cacheHits = entries.reduce((sum, e) => sum + e.hits, 0);
  const cacheMisses = entries.length; // Each entry represents one cache miss (initial request)

  const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

  const totalTokensSaved = entries.reduce((sum, e) => sum + e.tokensUsed * e.hits, 0);
  const costSavedBrl = entries.reduce((sum, e) => sum + e.costBrl * e.hits, 0);

  return {
    totalRequests,
    cacheHits,
    cacheMisses,
    hitRate,
    totalTokensSaved,
    costSavedBrl,
  };
}

/**
 * Prune expired cache entries
 */
export function pruneExpiredEntries(entries: CacheEntry[]): CacheEntry[] {
  const now = new Date();
  return entries.filter((entry) => !entry.expiresAt || entry.expiresAt > now);
}

/**
 * Get most popular cached responses
 */
export function getTopCachedResponses(
  entries: CacheEntry[],
  limit: number = 10
): CacheEntry[] {
  return entries
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit);
}

/**
 * Get cache entries by request type
 */
export function getCacheEntriesByType(
  entries: CacheEntry[],
  requestType: CacheRequestType
): CacheEntry[] {
  return entries.filter((entry) => entry.requestType === requestType);
}

/**
 * Calculate total cache size (approximate)
 */
export function calculateCacheSize(entries: CacheEntry[]): number {
  return entries.reduce((sum, entry) => {
    // Approximate size: key + response + metadata
    const keySize = entry.key.length * 2; // UTF-16
    const responseSize = entry.response.length * 2;
    const metadataSize = 100; // Rough estimate for numbers and dates
    return sum + keySize + responseSize + metadataSize;
  }, 0);
}

/**
 * Format cache size in human-readable format
 */
export function formatCacheSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
