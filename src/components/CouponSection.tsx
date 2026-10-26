'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Tag, ArrowLeft } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { couponTitle } from '@/lib/admin-catalog';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

export interface CouponItem { id: string; code: string; title_en?: string | null; title_ar?: string | null; image_url?: string | null; discount_type: string; value: number }
interface CouponSectionProps { coupons?: CouponItem[]; className?: string; hideCommunity?: boolean }

export function CouponSection({ coupons = [], className, hideCommunity = false }: CouponSectionProps) {
  const { dir, locale, t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    const delta = direction === 'left' ? -amount : amount;
    scrollRef.current.scrollBy({ left: dir === 'rtl' ? -delta : delta, behavior: 'smooth' });
  }, [dir]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (dir === 'rtl') {
        if (diff > 0) scroll('right');
        else scroll('left');
      } else {
        if (diff > 0) scroll('left');
        else scroll('right');
      }
    }
    touchStartX.current = null;
  }

  if (!coupons.length) return null;
  return (
    <section className={cn('max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="h-6 w-1.5 rounded-full bg-tiger-orange" />
          <h2 className={cn('text-lg sm:text-xl font-bold text-text', dir === 'rtl' && 'text-right')}>
            {t('admin.coupon.heading')}
          </h2>
        </div>
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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="group relative shrink-0 w-64 bg-surface rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="relative">
              {coupon.image_url && <div className="relative h-32 overflow-hidden bg-surface-elevated">
                <SafeImage
                  src={coupon.image_url ?? undefined}
                  alt={couponTitle(coupon,locale)}
                  fill
                  sizes="256px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>}
              <div className={cn("bg-tiger-orange text-white text-xs font-bold px-4 py-1.5 rounded-b-lg shadow-lg max-w-full break-words", coupon.image_url ? "absolute top-0 left-1/2 -translate-x-1/2" : "relative mx-auto w-fit")}>
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {coupon.code}
                </span>
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-bold text-text leading-snug">{couponTitle(coupon,locale)}</p>
              <p className="mt-1 text-xs text-muted">{coupon.discount_type === 'percentage' ? `${coupon.value}%` : `${(coupon.value / 100).toFixed(2)} ${locale === 'ar' ? 'دولار' : 'USD'}`} </p>
            </div>
          </div>
        ))}

        {!hideCommunity && <Link
          href="/community"
          className="group relative shrink-0 w-64 bg-danger rounded-xl overflow-hidden flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
        >
          <div className="p-8 text-center text-white">
            <ArrowLeft className="h-10 w-10 mx-auto mb-3 group-hover:translate-x-2 transition-transform" />
            <p className="text-base font-bold">{t('admin.coupon.contact')}</p>
            <p className="mt-1 text-xs opacity-80">{t('admin.coupon.offers')}</p>
          </div>
        </Link>}
      </div>
    </section>
  );
}
