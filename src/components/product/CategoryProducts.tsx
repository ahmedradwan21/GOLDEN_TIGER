'use client';

import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/types';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'top-rated';

const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Featured',
  'price-low': 'Price: Low to High',
  'price-high': 'Price: High to Low',
  'top-rated': 'Top Rated',
};

export function CategoryProducts({ products }: { products: Product[] }) {
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const sorted = useMemo(() => {
    const copy = [...products];
    switch (sortBy) {
      case 'price-low':
        return copy.sort((a, b) => a.price - b.price);
      case 'price-high':
        return copy.sort((a, b) => b.price - a.price);
      case 'top-rated':
        return copy.sort((a, b) => b.rating - a.rating);
      default:
        return copy;
    }
  }, [products, sortBy]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{sorted.length} products</p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted">
            Sort:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text focus-ring cursor-pointer"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {sorted.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sponsored={product.isSponsored}
            source="category"
          />
        ))}
      </div>
    </>
  );
}
