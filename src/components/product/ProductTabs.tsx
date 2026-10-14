'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

type TabKey = 'description' | 'features' | 'specifications' | 'reviews' | 'shipping';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'features', label: 'Features' },
  { key: 'specifications', label: 'Specifications' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'shipping', label: 'Shipping & Returns' },
];

const RATING_DISTRIBUTION = [
  { stars: 5, percentage: 68 },
  { stars: 4, percentage: 22 },
  { stars: 3, percentage: 7 },
  { stars: 2, percentage: 2 },
  { stars: 1, percentage: 1 },
];

export function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<TabKey>('description');
  const tabListRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    const currentIndex = TABS.findIndex((t) => t.key === active);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % TABS.length;
      setActive(TABS[nextIndex].key);
      const btn = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button')[nextIndex];
      btn?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
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

      <div className="p-5 sm:p-6">
        {active === 'description' && (
          <div role="tabpanel" id="panel-description" className="prose prose-invert max-w-none">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-sm text-muted leading-relaxed mb-4">
                {para}
              </p>
            ))}
          </div>
        )}

        {active === 'features' && (
          <div role="tabpanel" id="panel-features">
            <ul className="space-y-3">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text">
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
                    <td className="py-3 pr-4 text-muted font-medium w-1/3">{key}</td>
                    <td className="py-3 text-text">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {active === 'reviews' && (
          <div role="tabpanel" id="panel-reviews">
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              <div className="text-center sm:text-left">
                <p className="text-4xl font-bold text-text">{product.rating.toFixed(1)}</p>
                <p className="text-sm text-muted mt-1">{product.reviewCount.toLocaleString()} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {RATING_DISTRIBUTION.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3">
                    <span className="text-xs text-muted w-12">{row.stars} star</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted w-10 text-right">{row.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === 'shipping' && (
          <div role="tabpanel" id="panel-shipping" className="space-y-4 text-sm text-muted">
            <div>
              <h4 className="text-text font-semibold mb-1">Shipping</h4>
              <p>Free standard shipping on orders over $50. Standard delivery in 5-7 business days. Express (2-3 days) and Next-Day options available at checkout.</p>
            </div>
            <div>
              <h4 className="text-text font-semibold mb-1">Returns</h4>
              <p>30-day hassle-free returns. Items must be in original condition with tags attached. Refunds processed within 3-5 business days of receipt.</p>
            </div>
            <div>
              <h4 className="text-text font-semibold mb-1">Warranty</h4>
              <p>All products come with a minimum 1-year manufacturer warranty. Extended warranty options available at checkout.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
