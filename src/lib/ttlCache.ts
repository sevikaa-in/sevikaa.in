/**
 * Simple, fast TTL (Time-To-Live) cache for serverless environments.
 * Reduces database query egress for frequently-accessed, low-frequency-change endpoints
 * (e.g., society listings, platform pricing, template metadata).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlSeconds: number = 300): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryCache.set(key, { data, expiresAt });
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key);
}

export function clearCacheByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
