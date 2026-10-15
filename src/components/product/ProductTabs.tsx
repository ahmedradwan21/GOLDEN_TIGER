'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import type { Product } from '@/types';

type TabKey = 'description' | 'features' | 'specifications' | 'reviews' | 'shipping';

const RATING_DISTRIBUTION = [
  { stars: 5, percentage: 68 },
  { stars: 4, percentage: 22 },
  { stars: 3, percentage: 7 },
  { stars: 2, percentage: 2 },
  { stars: 1, percentage: 1 },
];

export function ProductTabs({ product }: { product: Product }) {
  const { t, dir } = useI18n();
  const [active, setActive] = useState<TabKey>('description');
  const tabListRef = useRef<HTMLDivElement>(null);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'description', label: t('product.tabs.description') },
    { key: 'features', label: t('product.tabs.features') },
    { key: 'specifications', label: t('product.tabs.specifications') },
    { key: 'reviews', label: t('product.tabs.reviews') },
    { key: 'shipping', label: t('product.tabs.shipping') },
  ];

  function handleKeyDown(e: React.KeyboardEvent) {
    const currentIndex = TABS.findIndex((tab) => tab.key === active);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = dir === 'rtl'
        ? (currentIndex - 1 + TABS.length) % TABS.length
        : (currentIndex + 1) % TABS.length;
      setActive(TABS[nextIndex].key);
      const btn = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button')[nextIndex];
      btn?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = dir === 'rtl'
        ? (currentIndex + 1) % TABS.length
        : (currentIndex - 1 + TABS.length) % TABS.length;
      setActive(TABS[prevIndex].key);
      const btn = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button')[prevIndex];
      btn?.focus();
    }
  }

  const paragraphs = product.description.split('\n\n');

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Product information"
        onKeyDown={handleKeyDown}
        className="flex overflow-x-auto no-scrollbar border-b border-border"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            aria-controls={`panel-${tab.key}`}
            id={`tab-${tab.key}`}
            onClick={() => setActive(tab.key)}
            className={cn(
              'shrink-0 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              active === tab.key
                ? 'text-gold border-gold'
                : 'text-muted border-transparent hover:text-text'
            )}
            tabIndex={active === tab.key ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6" dir={dir}>
        {active === 'description' && (
          <div role="tabpanel" id="panel-description" className="prose prose-invert max-w-none">
            {paragraphs.map((para, i) => (
              <p key={i} className={cn('text-sm text-muted leading-relaxed mb-4', dir === 'rtl' && 'text-right')}>
                {para}
              </p>
            ))}
          </div>
        )}

        {active === 'features' && (
          <div role="tabpanel" id="panel-features">
            <ul className="space-y-3">
              {product.features.map((feature, i) => (
                <li key={i} className={cn('flex items-start gap-3 text-sm text-text', dir === 'rtl' && 'flex-row-reverse text-right')}>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0 mt-1.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {active === 'specifications' && (
          <div role="tabpanel" id="panel-specifications">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <tr key={key} className="border-b border-border last:border-0">
                    <td className={cn('py-3 text-muted font-medium w-1/3', dir === 'rtl' ? 'pr-4 text-right' : 'pr-4')}>{key}</td>
                    <td className={cn('py-3 text-text', dir === 'rtl' && 'text-right')}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {active === 'reviews' && (
          <div role="tabpanel" id="panel-reviews">
            <div className={cn('flex flex-col sm:flex-row gap-6 mb-6', dir === 'rtl' && 'sm:flex-row-reverse')}>
              <div className={cn(dir === 'rtl' ? 'text-center sm:text-right' : 'text-center sm:text-left')}>
                <p className="text-4xl font-bold text-text">{product.rating.toFixed(1)}</p>
                <p className="text-sm text-muted mt-1">{product.reviewCount.toLocaleString()} {t('product.reviewsCount')}</p>
              </div>
              <div className="flex-1 space-y-2">
                {RATING_DISTRIBUTION.map((row) => (
                  <div key={row.stars} className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
                    <span className="text-xs text-muted w-12">{row.stars} {t('product.star')}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className={cn('text-xs text-muted w-10', dir === 'rtl' ? 'text-left' : 'text-right')}>{row.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === 'shipping' && (
          <div role="tabpanel" id="panel-shipping" className={cn('space-y-4 text-sm text-muted', dir === 'rtl' && 'text-right')}>
            <div>
              <h4 className="text-text font-semibold mb-1">{t('product.shippingTitle')}</h4>
              <p>{t('product.shippingDesc')}</p>
            </div>
            <div>
              <h4 className="text-text font-semibold mb-1">{t('product.returnsTitle')}</h4>
              <p>{t('product.returnsDesc')}</p>
            </div>
            <div>
              <h4 className="text-text font-semibold mb-1">{t('product.warrantyTitle')}</h4>
              <p>{t('product.warrantyDesc')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
