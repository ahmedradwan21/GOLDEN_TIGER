'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/pricing';
import { SafeImage } from '@/components/ui/SafeImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { productTitle } from '@/lib/localize';

export function MiniCart() {
  const { items, hydrated, removeItem, incrementItem, decrementItem, closeMiniCart } = useCart();
  const [open, setOpen] = useState(false);
  const [localHydrated, setLocalHydrated] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const { t, locale } = useI18n();

  useEffect(() => {
    setLocalHydrated(hydrated);
  }, [hydrated]);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener('golden-tiger-open-minicart', openHandler);
    window.addEventListener('golden-tiger-close-minicart', closeHandler);
    return () => {
      window.removeEventListener('golden-tiger-open-minicart', openHandler);
      window.removeEventListener('golden-tiger-close-minicart', closeHandler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>('a, button, input');
      firstFocusable?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMiniCart();
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, closeMiniCart]);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={closeMiniCart}
        />
      )}
      <div
        ref={drawerRef}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface border-l border-border flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('minicart.aria')}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-text flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold" />
            Your Cart
          </h2>
          <button
            onClick={closeMiniCart}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-surface-elevated focus-ring"
            aria-label={t('minicart.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!localHydrated ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse h-8 w-8 rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted mb-4" />
            <p className="text-sm text-muted mb-4">{t('minicart.empty')}</p>
            <Link
              href="/"
              onClick={closeMiniCart}
              className="gold-button rounded-lg px-6 py-2.5 text-sm"
            >
              {t('minicart.startShopping')}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeMiniCart}
                    className="shrink-0"
                  >
                    <SafeImage
                      src={item.image}
                      alt={productTitle(item, locale)}
                      width={64}
                      height={64}
                      className="rounded-lg border border-border"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeMiniCart}
                      className="text-sm font-medium text-text line-clamp-2 hover:text-gold transition-colors"
                    >
                      {productTitle(item, locale)}
                    </Link>
                    <p className="text-xs text-muted mt-1">{t('cart.each').replace('{price}', formatPrice(item.unitPrice))}</p>
                    <div className="flex items-center justify-between mt-2">
                      <QuantityStepper
                        quantity={item.quantity}
                        max={Math.min(item.stock, 10)}
                        onChange={(q) => {
                          if (q > item.quantity) incrementItem(item.id);
                          else if (q < item.quantity) decrementItem(item.id);
                        }}
                        size="sm"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 flex items-center justify-center rounded text-muted hover:text-danger transition-colors"
                          aria-label={t('cart.removeAria').replace('{title}', productTitle(item, locale))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {item.quantity >= Math.min(item.stock, 10) && item.stock > 0 && (
                      <p className="text-xs text-amber-500 mt-1">{t('minicart.maxReached')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{t('checkout.subtotal')}</span>
                <span className="text-lg font-semibold text-text">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/cart"
                  onClick={closeMiniCart}
                  className="flex-1 h-10 flex items-center justify-center rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
                >
                  {t('minicart.viewCart')}
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeMiniCart}
                  className="flex-1 h-10 flex items-center justify-center gold-button rounded-lg text-sm"
                >
                  {t('checkout.title')}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
