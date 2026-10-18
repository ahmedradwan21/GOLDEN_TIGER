'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoText: string;
}

interface BrandsHubProps {
  brands?: Brand[];
  className?: string;
}

const defaultBrands: Brand[] = [
  { id: '1', name: 'سامسونج', slug: 'samsung', logoText: 'SAMSUNG' },
  { id: '2', name: 'أبل', slug: 'apple', logoText: 'Apple' },
  { id: '3', name: 'هواوي', slug: 'huawei', logoText: 'HUAWEI' },
  { id: '4', name: 'سوني', slug: 'sony', logoText: 'SONY' },
  { id: '5', name: 'إل جي', slug: 'lg', logoText: 'LG' },
  { id: '6', name: 'نيكون', slug: 'nikon', logoText: 'Nikon' },
  { id: '7', name: 'فيليدا', slug: 'vileda', logoText: 'vileda' },
  { id: '8', name: 'ديل', slug: 'dell', logoText: 'DELL' },
];

export function BrandsHub({ brands = defaultBrands, className }: BrandsHubProps) {
  const { dir } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 280;
    const delta = direction === 'left' ? -amount : amount;
    scrollRef.current.scrollBy({ left: dir === 'rtl' ? -delta : delta, behavior: 'smooth' });
  }, [dir]);

  return (
    <section className={cn('max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn('text-lg sm:text-xl font-bold text-text', dir === 'rtl' && 'text-right')}>
          شوف ستور البراندات الرسمية
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:bg-surface-elevated hover:text-gold transition-colors"
            aria-label="السابق"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:bg-surface-elevated hover:text-gold transition-colors"
            aria-label="التالي"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/category/${brand.slug}`}
            className="group flex shrink-0 w-64 rounded-xl overflow-hidden border border-border hover:border-gold/50 transition-all hover:shadow-lg"
          >
            <div className="flex-1 bg-surface p-5 flex flex-col items-center justify-center text-center">
              <Store className="h-8 w-8 text-gold mb-2" />
              <p className="text-sm font-bold text-text">{brand.name}</p>
              <p className="mt-1 text-xs text-blue-500 group-hover:text-blue-600 transition-colors">
                زور الستور ←
              </p>
            </div>
            <div className="w-28 bg-black flex items-center justify-center p-5">
              <span className="text-white font-bold text-sm tracking-wide text-center">
                {brand.logoText}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
