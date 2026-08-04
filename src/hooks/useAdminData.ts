import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Global in-memory client cache shared across all Admin and Super Admin pages
const globalAdminCache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 30000; // 30 seconds fresh window

/**
 * Prefetch helper function: Call on hover or in background to populate cache silently
 */
export async function prefetchAdminData(key: string, fetcher: () => Promise<any>, ttl = DEFAULT_TTL) {
  if (!key) return;
  const existing = globalAdminCache.get(key);
  const now = Date.now();
  if (existing && now - existing.timestamp < ttl) {
    return existing.data; // Already fresh in cache
  }

  try {
    const data = await fetcher();
    if (data) {
      globalAdminCache.set(key, { data, timestamp: now });
    }
    return data;
  } catch (err) {
    console.warn(`[Prefetch] Failed for key ${key}:`, err);
  }
}

/**
 * Invalidate specific key or prefix from global cache
 */
export function invalidateAdminCache(prefix?: string) {
  if (!prefix) {
    globalAdminCache.clear();
    return;
  }
  for (const k of globalAdminCache.keys()) {
    if (k.startsWith(prefix)) {
      globalAdminCache.delete(k);
    }
  }
}

interface UseAdminDataOptions {
  ttl?: number;
  prefetchNextKey?: string;
  prefetchNextFetcher?: () => Promise<any>;
  enabled?: boolean;
}

/**
 * Custom Hook for 0ms SWR reads, background revalidation, and next-page prefetching
 */
export function useAdminData<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseAdminDataOptions = {}
) {
  const { ttl = DEFAULT_TTL, prefetchNextKey, prefetchNextFetcher, enabled = true } = options;

  const [data, setData] = useState<T | null>(() => {
    if (!key || !enabled) return null;
    const cached = globalAdminCache.get(key);
    return cached ? cached.data : null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (!key || !enabled) return false;
    return !globalAdminCache.has(key);
  });

  const [error, setError] = useState<any>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const executeFetch = useCallback(async (showLoader = false) => {
    if (!key || !enabled) return;

    if (showLoader) setLoading(true);

    try {
      const freshData = await fetcherRef.current();
      if (freshData !== undefined) {
        globalAdminCache.set(key, { data: freshData, timestamp: Date.now() });
        setData(freshData);
        setError(null);
      }
    } catch (err) {
      console.warn(`[useAdminData] Fetch error for ${key}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, enabled]);

  useEffect(() => {
    if (!key || !enabled) return;

    const cached = globalAdminCache.get(key);
    const now = Date.now();

    if (cached) {
      setData(cached.data);
      setLoading(false);
      // Revalidate in background if older than TTL
      if (now - cached.timestamp >= ttl) {
        executeFetch(false);
      }
    } else {
      executeFetch(true);
    }

    // Trigger next-page prefetch if provided
    if (prefetchNextKey && prefetchNextFetcher) {
      prefetchAdminData(prefetchNextKey, prefetchNextFetcher, ttl);
    }
  }, [key, enabled, ttl, prefetchNextKey, prefetchNextFetcher, executeFetch]);

  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      globalAdminCache.set(key, { data: newData, timestamp: Date.now() });
      setData(newData);
    } else {
      executeFetch(true);
    }
  }, [key, executeFetch]);

  return { data, loading, error, mutate, refetch: () => executeFetch(true) };
}
