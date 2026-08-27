"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { webApiClient } from '@/lib/webApiClient';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';

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
 * */
export function usePrivateUrl(ref: string | null | undefined) {
  const isCloudinary = Boolean(
    ref && (ref.startsWith('cloudinary:') || ref.includes('res.cloudinary.com'))
  );
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(isCloudinary);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async () => {
    if (!ref) { 
      setUrl(''); 
      setLoading(false);
      return; 
    }

    let effectiveRef = ref;
    if (effectiveRef.includes('res.cloudinary.com') && (effectiveRef.includes('/image/upload/') || effectiveRef.includes('/image/authenticated/'))) {
      const match = effectiveRef.match(/\/image\/(?:upload|authenticated)\/(?:v\d+\/)?(.+)$/);
      if (match && match[1]) {
        effectiveRef = `cloudinary:image:${match[1]}`;
      }
    }

    // Non-Cloudinary public URLs (data:, blob:, non-cloudinary https://) — use as-is
    if (!effectiveRef.startsWith('cloudinary:')) {
      setUrl(effectiveRef);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await webApiClient.get(`/api/upload/cloudinary/sign?ref=${encodeURIComponent(effectiveRef)}`);
      if (data?.url) {
        setUrl(data.url);
      } else if (data?.authenticatedUrl) {
        setUrl(data.authenticatedUrl);
      } else {
        setUrl(resolveMediaUrl('worker-documents', effectiveRef) || '');
      }

      // Schedule refresh at 50 minutes (before 1-hour expiry)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(fetch, 50 * 60 * 1000);
    } catch {
      setUrl(resolveMediaUrl('worker-documents', effectiveRef) || '');
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
