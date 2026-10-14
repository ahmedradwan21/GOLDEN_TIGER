'use client';

import { useEffect } from 'react';
import { trackInitiateCheckout } from '@/lib/fbpixel';

interface InitiateCheckoutTrackerProps {
  contentIds: string[];
  value: number;
  numItems: number;
  currency?: string;
  trigger: unknown;
}

export function InitiateCheckoutTracker({ contentIds, value, numItems, currency, trigger }: InitiateCheckoutTrackerProps) {
  useEffect(() => {
    if (trigger === null || trigger === undefined) return;
    trackInitiateCheckout({ contentIds, value, numItems, currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return null;
}
