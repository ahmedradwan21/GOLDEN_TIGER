'use client';

import { useState, useEffect } from 'react';
import { ProductSlider } from '@/components/product/ProductSlider';
import type { Product } from '@/types';

export function RecentlyViewed({ currentProductId, allProducts }: { currentProductId: string; allProducts: Product[] }) {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('golden-tiger-recently-viewed');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const filtered = ids
        .filter((id) => id !== currentProductId)
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)
        .slice(0, 8);
      setRecentlyViewed(filtered);

      const updated = [currentProductId, ...ids.filter((id) => id !== currentProductId)].slice(0, 12);
      localStorage.setItem('golden-tiger-recently-viewed', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [currentProductId, allProducts]);

  if (recentlyViewed.length === 0) return null;

  return <ProductSlider titleKey="product.recentlyViewed" products={recentlyViewed} />;
}
