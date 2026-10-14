'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';
import type { Product, Category } from '@/types';

interface CategorySliderProps {
  title: string;
  category: Category;
  products: Product[];
  seeAllHref: string;
}

export function CategorySlider({ title, category, products, seeAllHref }: CategorySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const filteredProducts = activeSub
    ? products.filter((p) => p.subcategoryId === activeSub)
    : products;

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-text">{title}</h2>
          <Link
            href={seeAllHref}
            className="text-sm text-gold hover:text-gold-light transition-colors"
          >
            See all
          </Link>
        </div>

        {/* Subcategory chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSub(null)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              !activeSub
                ? 'bg-gold text-background'
                : 'bg-surface-elevated text-muted hover:text-text'
            )}
          >
            All
          </button>
          {category.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSub(sub.id)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                activeSub === sub.id
                  ? 'bg-gold text-background'
                  : 'bg-surface-elevated text-muted hover:text-text'
              )}
            >
              {sub.name}
            </button>
          ))}
        </div>

        <div className="relative group">
          {/* Desktop arrows */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold transition-colors opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold transition-colors opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-snap-x pb-2"
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="shrink-0 w-[200px] sm:w-[240px] scroll-snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
