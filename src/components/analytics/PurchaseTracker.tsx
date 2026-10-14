'use client';

import { useEffect } from 'react';
import { trackPurchase } from '@/lib/fbpixel';

interface PurchaseTrackerProps {
  contentIds: string[];
  value: number;
  numItems: number;
  orderId: string;
  currency?: string;
}

export function PurchaseTracker({ contentIds, value, numItems, orderId, currency }: PurchaseTrackerProps) {
  useEffect(() => {
    trackPurchase({ contentIds, value, numItems, orderId, currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
