'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/types';

interface ProductSliderProps {
  title: string;
  products: Product[];
  seeAllHref?: string;
}

export function ProductSlider({ title, products, seeAllHref }: ProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
          <h2 className="font-heading text-lg sm:text-xl font-bold text-text">{title}</h2>
          <div className="flex items-center gap-3">
            {seeAllHref && (
              <Link href={seeAllHref} className="text-sm text-gold hover:text-gold-light transition-colors">
                See all
              </Link>
            )}
            <div className="hidden md:flex gap-1">
              <button
                onClick={() => scroll('left')}
                className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold transition-colors"
                aria-label={`Scroll ${title} left`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold transition-colors"
                aria-label={`Scroll ${title} right`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-snap-x pb-2"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-[200px] sm:w-[240px] scroll-snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
