"use client";

import { useEffect } from 'react';

export function BrowserExtensionErrorFilter() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason?.message || String(event?.reason || '');
      if (
        typeof reason === 'string' &&
        (reason.includes('Could not establish connection') ||
         reason.includes('Receiving end does not exist') ||
         reason.includes('extension context invalidated'))
      ) {
        // Prevent browser extension communication errors from surfacing as uncaught web app rejections
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return null;
}
