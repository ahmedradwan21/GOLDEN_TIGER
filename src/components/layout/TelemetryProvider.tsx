'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track, initTracker, flushNow } from '@/lib/tracker';

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initTracker();
  }, []);

  useEffect(() => {
    if (pathname && !pathname.startsWith('/admin')) {
      track('VISIT', {});
    }
  }, [pathname]);

  useEffect(() => {
    const handlePageHide = () => flushNow();
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  return <>{children}</>;
}
