'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { prefetchAdminData } from '@/hooks/useAdminData';

interface PrefetchLinkProps extends React.ComponentProps<typeof Link> {
  apiKey?: string;
  apiFetcher?: () => Promise<any>;
  children: React.ReactNode;
}

/**
 * Enhanced Link for Admin & Super Admin Sidebars that triggers
 * 0ms instant route & API prefetching on hover / focus.
 */
export function PrefetchLink({
  href,
  apiKey,
  apiFetcher,
  children,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter();

  const handlePrefetch = () => {
    // 1. Prefetch Next.js Route Page Bundle
    if (typeof href === 'string') {
      router.prefetch(href);
    }
    // 2. Prefetch API Data into Memory Cache
    if (apiKey && apiFetcher) {
      prefetchAdminData(apiKey, apiFetcher);
    }
  };

  return (
    <Link
      href={href}
      onMouseEnter={(e) => {
        handlePrefetch();
        if (onMouseEnter) onMouseEnter(e);
      }}
      onFocus={(e) => {
        handlePrefetch();
        if (onFocus) onFocus(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
