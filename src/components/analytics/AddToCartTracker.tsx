'use client';

import { useEffect } from 'react';
import { trackAddToCart } from '@/lib/fbpixel';

interface AddToCartTrackerProps {
  contentIds: string[];
  contentName: string;
  value: number;
  quantity?: number;
  currency?: string;
  trigger: unknown;
}

export function AddToCartTracker({ contentIds, contentName, value, quantity, currency, trigger }: AddToCartTrackerProps) {
  useEffect(() => {
    if (trigger === null || trigger === undefined) return;
    trackAddToCart({ contentIds, contentName, value, quantity, currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return null;
}
