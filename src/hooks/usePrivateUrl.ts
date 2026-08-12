"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { resolvePrivateUrl } from '@/utils/resolveMediaUrl';

/**
 * usePrivateUrl — React hook for displaying private Cloudinary assets.
 *
 * Automatically fetches a signed URL and refreshes it before expiry (at 50 min).
 * The DB stores a permanent cloudinary: reference — this hook resolves it to
 * a live, displayable URL that never expires in normal usage.
 *
 * Usage:
 *   const { url, loading } = usePrivateUrl(worker.aadhaar_front_url);
 *   <img src={url} />
 */
export function usePrivateUrl(ref: string | null | undefined) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async () => {
    if (!ref) { setUrl(''); return; }

    // Public URLs (https://, data:, blob:) — use as-is, no refresh needed
    if (!ref.startsWith('cloudinary:')) {
      setUrl(ref);
      return;
    }

    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.get(`/api/upload/cloudinary/sign?ref=${encodeURIComponent(ref)}`);
      setUrl(data?.url || '');

      // Schedule refresh at 50 minutes (before 1-hour expiry)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(fetch, 50 * 60 * 1000);
    } catch {
      setUrl('');
    } finally {
      setLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    fetch();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [fetch]);

  return { url, loading, refresh: fetch };
}
