'use client';

import { useEffect } from 'react';
import { trackViewContent } from '@/lib/fbpixel';

interface ViewContentTrackerProps {
  contentIds: string[];
  contentName: string;
  value: number;
  currency?: string;
}

export function ViewContentTracker({ contentIds, contentName, value, currency }: ViewContentTrackerProps) {
  useEffect(() => {
    trackViewContent({ contentIds, contentName, value, currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
