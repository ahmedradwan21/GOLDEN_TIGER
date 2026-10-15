'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export function DealsOfTheDay({ products }: { products: Product[] }) {
  const { t, dir } = useI18n();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-8 bg-surface/50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn('flex items-center justify-between mb-6', dir === 'rtl' && 'flex-row-reverse')}>
          <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
            <div className="h-10 w-10 rounded-full bg-tiger-orange/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-tiger-orange" />
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-text">{t('home.dealsTitle')}</h2>
              <p className="text-xs text-muted">{t('home.dealsSubtitle')}</p>
            </div>
          </div>
          <div className={cn('text-right', dir === 'rtl' && 'text-left')}>
            <p className="text-xs text-muted">{t('home.endsIn')}</p>
            <p className="font-mono text-lg font-bold text-gold tabular-nums" aria-live="polite">
              {timeLeft}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
