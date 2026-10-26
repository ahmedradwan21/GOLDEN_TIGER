'use client';

import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { categoryName } from '@/lib/localize';

export function CategoryTiles({ categories }: { categories: Category[] }) {
  const { t, dir, locale } = useI18n();
  return (
    <section className="py-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={cn('font-heading text-xl sm:text-2xl font-bold text-text mb-6', dir === 'rtl' && 'text-right')}>
          {t('home.shopByCategory')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border card-glow"
            >
              <SafeImage
                src={cat.image}
                alt={categoryName(cat, locale)}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 12vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                <p className="text-xs sm:text-sm font-semibold text-text text-center leading-tight">
                  {categoryName(cat, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
