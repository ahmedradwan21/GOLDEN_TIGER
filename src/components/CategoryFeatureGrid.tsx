'use client';

import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import type { Category } from '@/types';
import { categoryName } from '@/lib/localize';

interface CategoryFeature {
  label: string;
  href: string;
  image: string;
  alt: string;
}

interface CategoryFeatureGridProps {
  categories: Category[];
  products: Array<{ id: string; slug: string; title: string; images: string[]; categoryId: string }>;
  className?: string;
}

export function CategoryFeatureGrid({ categories, products, className }: CategoryFeatureGridProps) {
  const { dir, locale } = useI18n();

  const features: CategoryFeature[] = categories.slice(0, 4).map((cat) => {
    const product = products.find((p) => p.categoryId === cat.id);
    const image = product?.images[0] ?? cat.image;
    return {
      label: categoryName(cat, locale),
      href: `/category/${cat.slug}`,
      image,
      alt: categoryName(cat, locale),
    };
  });

  if (features.length < 4) {
    while (features.length < 4) {
      const cat = categories[features.length % Math.max(categories.length, 1)];
      features.push({
        label: (cat ? categoryName(cat, locale) : ''),
        href: cat ? `/category/${cat.slug}` : '#',
        image: cat?.image ?? '',
        alt: (cat ? categoryName(cat, locale) : ''),
      });
    }
  }

  const arabicLabels = ['الأكثر مبيعاً', 'أفضل الأجهزة المنزلية', 'الأكثر رواجاً', 'عروض حصرية'];

  return (
    <section className={cn('max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      <h2 className={cn('text-lg sm:text-xl font-bold text-text mb-4', dir === 'rtl' && 'text-right')}>
        تسوق حسب الفئة
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="group relative bg-surface rounded-xl border border-border overflow-hidden p-4 hover:border-gold/50 transition-all hover:shadow-lg"
          >
            <p className={cn('text-sm font-bold text-text mb-3', dir === 'rtl' && 'text-right')}>
              {arabicLabels[index] ?? feature.label}
            </p>
            <div className="relative h-32 sm:h-40 overflow-hidden rounded-lg bg-surface-elevated">
              <SafeImage
                src={feature.image}
                alt={feature.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <p className={cn('mt-3 text-xs text-muted group-hover:text-gold transition-colors', dir === 'rtl' && 'text-right')}>
              {feature.label} ←
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
