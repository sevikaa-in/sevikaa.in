interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Retrieve cached item if exists and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Store item in memory cache with TTL (Time To Live in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Invalidate specific cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all matching keys (e.g., memoryCache.invalidatePattern('superadmin'))
   */
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Flush entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global server singleton instance
export const memoryCache = new MemoryCache();
