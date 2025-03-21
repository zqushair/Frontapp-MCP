import logger from './logger.js';

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  /** The cached data */
  data: T;
  /** The timestamp when the data was cached */
  timestamp: number;
  /** The expiration time in milliseconds */
  expiresIn: number;
}

/**
 * Cache options interface
 */
export interface CacheOptions {
  /** The default expiration time in milliseconds */
  defaultExpiresIn: number;
  /** The maximum number of entries in the cache */
  maxEntries: number;
  /** Whether to enable debug logging */
  debug: boolean;
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  defaultExpiresIn: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
  debug: false,
};

/**
 * Cache manager
 * This utility provides caching functionality for API responses and other data
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private options: CacheOptions;

  /**
   * Create a new cache manager
   * @param options Cache options
   */
  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      ...DEFAULT_CACHE_OPTIONS,
      ...options,
    };
    this.cache = new Map<string, CacheEntry<any>>();

    // Start the cleanup interval
    setInterval(() => this.cleanup(), 60 * 1000); // Run cleanup every minute
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value, or undefined if not found or expired
   */
  public get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    // If the entry doesn't exist, return undefined
    if (!entry) {
      if (this.options.debug) {
        logger.debug(`Cache miss: ${key}`);
      }
      return undefined;
    }

    // If the entry has expired, delete it and return undefined
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.options.debug) {
        logger.debug(`Cache expired: ${key}`);
      }
      return undefined;
    }

    // Return the cached data
    if (this.options.debug) {
      logger.debug(`Cache hit: ${key}`);
    }
    return entry.data;
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param data The data to cache
   * @param expiresIn The expiration time in milliseconds (optional, defaults to defaultExpiresIn)
   */
  public set<T>(key: string, data: T, expiresIn?: number): void {
    // If the cache is full, remove the oldest entry
    if (this.cache.size >= this.options.maxEntries) {
      this.removeOldest();
    }

    // Set the cache entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiresIn || this.options.defaultExpiresIn,
    });

    if (this.options.debug) {
      logger.debug(`Cache set: ${key}`, {
        expiresIn: expiresIn || this.options.defaultExpiresIn,
        size: this.cache.size,
      });
    }
  }

  /**
   * Delete a value from the cache
   * @param key The cache key
   * @returns Whether the key was found and deleted
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (this.options.debug && result) {
      logger.debug(`Cache delete: ${key}`);
    }
    return result;
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
    if (this.options.debug) {
      logger.debug('Cache cleared');
    }
  }

  /**
   * Get the number of entries in the cache
   * @returns The number of entries
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   * @returns An array of cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public stats(): {
    size: number;
    maxEntries: number;
    oldestEntry: { key: string; age: number } | null;
    newestEntry: { key: string; age: number } | null;
  } {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    let newestKey: string | null = null;
    let newestTimestamp = 0;

    // Find the oldest and newest entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
      if (entry.timestamp > newestTimestamp) {
        newestKey = key;
        newestTimestamp = entry.timestamp;
      }
    }

    const now = Date.now();

    return {
      size: this.cache.size,
      maxEntries: this.options.maxEntries,
      oldestEntry: oldestKey
        ? { key: oldestKey, age: now - oldestTimestamp }
        : null,
      newestEntry: newestKey
        ? { key: newestKey, age: now - newestTimestamp }
        : null,
    };
  }

  /**
   * Check if a cache entry has expired
   * @param entry The cache entry
   * @returns Whether the entry has expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.timestamp + entry.expiresIn;
  }

  /**
   * Remove the oldest entry from the cache
   */
  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    // Find the oldest entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    }

    // Delete the oldest entry
    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.options.debug) {
        logger.debug(`Cache evicted oldest entry: ${oldestKey}`);
      }
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    // Delete expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.expiresIn) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (this.options.debug && expiredCount > 0) {
      logger.debug(`Cache cleanup: removed ${expiredCount} expired entries`);
    }
  }

  /**
   * Get or set a value in the cache with a callback function
   * @param key The cache key
   * @param callback The callback function to get the data if not cached
   * @param expiresIn The expiration time in milliseconds (optional)
   * @returns The cached or fetched data
   */
  public async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    expiresIn?: number
  ): Promise<T> {
    // Try to get the value from the cache
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // If not in cache, call the callback to get the data
    try {
      const data = await callback();
      // Cache the data
      this.set(key, data, expiresIn);
      return data;
    } catch (error) {
      // If the callback fails, log the error and rethrow
      logger.error(`Error fetching data for cache key: ${key}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export a singleton instance with default options
export const cacheManager = new CacheManager();

// Export default
export default cacheManager;
