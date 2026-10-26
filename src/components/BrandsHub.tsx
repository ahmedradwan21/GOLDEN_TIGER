'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

interface Brand { id: string; name_en: string; name_ar?: string | null; slug: string; logo_url?: string | null }
interface BrandsHubProps { brands?: Brand[]; className?: string }

export function BrandsHub({ brands = [], className }: BrandsHubProps) {
  const { dir, t, locale } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 280;
    const delta = direction === 'left' ? -amount : amount;
    scrollRef.current.scrollBy({ left: dir === 'rtl' ? -delta : delta, behavior: 'smooth' });
  }, [dir]);

  if (!brands.length) return null;
  return (
    <section className={cn('max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn('text-lg sm:text-xl font-bold text-text', dir === 'rtl' && 'text-right')}>
          {t('admin.brands.heading')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:bg-surface-elevated hover:text-gold transition-colors"
            aria-label={t('admin.common.previous')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:bg-surface-elevated hover:text-gold transition-colors"
            aria-label={t('admin.common.next')}
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
            href={`/search?q=${encodeURIComponent(brand.name_en)}`}
            className="group flex shrink-0 w-64 rounded-xl overflow-hidden border border-border hover:border-gold/50 transition-all hover:shadow-lg"
          >
            <div className="flex-1 bg-surface p-5 flex flex-col items-center justify-center text-center">
              <Store className="h-8 w-8 text-gold mb-2" />
              <p className="text-sm font-bold text-text">{locale === 'ar' && brand.name_ar?.trim() ? brand.name_ar : brand.name_en}</p>
              <p className="mt-1 text-xs text-blue-500 group-hover:text-blue-600 transition-colors">
                {t('admin.brands.visit')}
              </p>
            </div>
            <div className="w-28 bg-black flex items-center justify-center p-5">
              <span className="text-white font-bold text-sm tracking-wide text-center">
                {brand.logo_url ? <SafeImage src={brand.logo_url} alt={brand.name_en} width={96} height={64} className="object-contain"/> : brand.name_en}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
