/**
 * Cache Management Utilities
 * Handles PDF caching and file operations
 */

import { existsSync, mkdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export class CacheManager {
  constructor(private cacheDir: string) {}

  /**
   * Ensure cache directory exists
   */
  ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
      console.log(`✓ Created cache directory: ${this.cacheDir}`);
    }
  }

  /**
   * Get full path for cached file
   */
  getCachePath(filename: string): string {
    return join(this.cacheDir, filename);
  }

  /**
   * Check if file exists in cache and is valid
   * @param filename - File to check
   * @param minSize - Minimum file size (default 1KB)
   */
  isCached(filename: string, minSize = 1024): boolean {
    const cachePath = this.getCachePath(filename);
    if (!existsSync(cachePath)) {
      return false;
    }

    try {
      const stats = statSync(cachePath);
      return stats.size >= minSize;
    } catch {
      return false;
    }
  }

  /**
   * Save data to cache
   */
  saveToCache(filename: string, data: Buffer): void {
    this.ensureCacheDir();
    const cachePath = this.getCachePath(filename);
    writeFileSync(cachePath, data);
  }

  /**
   * Read data from cache
   */
  readFromCache(filename: string): Buffer {
    const cachePath = this.getCachePath(filename);
    if (!existsSync(cachePath)) {
      throw new Error(`Cache file not found: ${cachePath}`);
    }
    return readFileSync(cachePath);
  }

  /**
   * Get file size from cache
   */
  getCacheFileSize(filename: string): number {
    const cachePath = this.getCachePath(filename);
    if (!existsSync(cachePath)) {
      return 0;
    }
    return statSync(cachePath).size;
  }

  /**
   * Clear a cached file
   */
  clearCacheFile(filename: string): void {
    const cachePath = this.getCachePath(filename);
    if (existsSync(cachePath)) {
      try {
        // Just overwrite with empty buffer for safety (no unlink)
        writeFileSync(cachePath, Buffer.alloc(0));
      } catch (err) {
        console.warn(`Warning: Could not clear cache file ${filename}`);
      }
    }
  }
}
