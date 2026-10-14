'use client';

import { useEffect } from 'react';
import { loadFBPixel, trackPageView } from '@/lib/fbpixel';

export function PageViewTracker() {
  useEffect(() => {
    loadFBPixel();
    trackPageView();
  }, []);

  return null;
}
