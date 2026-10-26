'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Zap, ChevronLeft, ChevronRight, Flame, Truck, Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Rating } from '@/components/ui/Rating';
import { PriceTag } from '@/components/ui/PriceTag';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { productToSnapshot, getStockHint, cn } from '@/lib/utils';
import { productTitle } from '@/lib/localize';
import { track } from '@/lib/tracker';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  sponsored?: boolean;
  source?: string;
  onVisible?: (product: Product) => void;
  onSelect?: (product: Product) => void;
  className?: string;
}

const TICKER_MESSAGES = [
  { icon: Truck, key: 'card.ticker.freeDelivery' },
  { icon: Star, key: 'card.ticker.topInCategory' },
  { icon: Flame, key: 'card.ticker.soldRecently' },
];

const BADGE_LABELS = ['card.badge.bestseller', 'card.badge.topPicks'];

export function ProductCard({
  product,
  sponsored,
  source = 'product_card',
  onVisible,
  onSelect,
  className,
}: ProductCardProps) {
  const { t, dir, locale } = useI18n();
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const visibleFired = useRef(false);

  const images = product.images.length > 0 ? product.images : [''];
  const outOfStock = product.stock === 0;
  const stockHint = getStockHint(product.stock);
  const title = productTitle(product, locale);

  const nextImage = useCallback(() => {
    setImageIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-fading image slideshow every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(nextImage, 3000);
    return () => clearInterval(timer);
  }, [nextImage, images.length]);

  // Vertical text ticker cycling every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((i) => (i + 1) % TICKER_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!onVisible || visibleFired.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !visibleFired.current) {
          visibleFired.current = true;
          track('IMPRESSION', { productId: product.id, source: sponsored ? `sponsored_${source}` : source });
          onVisible(product);
        }
      },
      { threshold: 0.5, rootMargin: '0px 0px 0px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onVisible, product, sponsored, source]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    addItem(productToSnapshot(product), 1);
    track('ADD_TO_CART', { productId: product.id, source: sponsored ? `sponsored_${source}` : source });
    setTimeout(() => setAdding(false), 600);
    onSelect?.(product);
  };

  const handleImageNav = (e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.preventDefault();
    e.stopPropagation();
    if (direction === 'prev') prevImage();
    else nextImage();
  };

  const badgeLabel = sponsored ? BADGE_LABELS[0] : product.tags.includes('bestseller') ? BADGE_LABELS[0] : BADGE_LABELS[1];
  const CurrentTickerIcon = TICKER_MESSAGES[tickerIndex].icon;

  return (
    <div
      ref={ref}
      data-product-id={product.id}
      className={cn(
        'group relative bg-surface rounded-xl border border-border overflow-hidden card-glow',
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status badges */}
      <div className={cn('absolute top-2 z-20 flex flex-col gap-1', dir === 'rtl' ? 'right-2' : 'left-2')}>
        <span className="bg-tiger-orange text-white text-[0.625rem] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
          {t(badgeLabel)}
        </span>
        {sponsored && (
          <span className="bg-gold/20 text-gold text-[0.625rem] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {t('home.sponsored')}
          </span>
        )}
      </div>
      {outOfStock && (
        <span className={cn('absolute top-2 z-20 bg-danger/20 text-danger text-[0.625rem] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm', dir === 'rtl' ? 'left-2' : 'right-2')}>
          {t('product.outOfStock')}
        </span>
      )}

      <Link
        href={`/product/${product.slug}`}
        onClick={() => {
          track('CLICK', { productId: product.id, source: sponsored ? `sponsored_${source}` : source });
          onSelect?.(product);
        }}
        className="block"
        aria-label={sponsored ? `${t('home.sponsored')}: ${title}` : title}
      >
        <div className="relative aspect-square overflow-hidden bg-surface-elevated">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={cn(
                'absolute inset-0 transition-opacity duration-700',
                idx === imageIndex ? 'opacity-100' : 'opacity-0'
              )}
            >
              <SafeImage
                src={img}
                alt={title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className={cn(
                  'object-cover transition-transform duration-500',
                  hovered && idx === imageIndex ? 'scale-110' : 'scale-100'
                )}
              />
            </div>
          ))}

          {/* Hover navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => handleImageNav(e, 'prev')}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-text opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface hover:text-gold',
                  dir === 'rtl' ? 'right-2' : 'left-2'
                )}
                aria-label={t('gallery.prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => handleImageNav(e, 'next')}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-text opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface hover:text-gold',
                  dir === 'rtl' ? 'left-2' : 'right-2'
                )}
                aria-label={t('gallery.next')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Image indicator dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    idx === imageIndex ? 'w-4 bg-gold' : 'w-1 bg-muted/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <p className="text-[0.625rem] uppercase tracking-wider text-muted">{product.brand}</p>
        <Link
          href={`/product/${product.slug}`}
          onClick={() => onSelect?.(product)}
          className="block"
        >
          <h3 dir="auto" className={cn('text-sm font-medium text-text line-clamp-2 leading-snug min-h-[2.5rem] hover:text-gold transition-colors', dir === 'rtl' && 'text-right')}>
            {title}
          </h3>
        </Link>
        <Rating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
        <PriceTag
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
        />

        {/* Vertical text ticker */}
        <div className="relative h-5 overflow-hidden bg-surface-elevated rounded-md px-2">
          <div
            key={tickerIndex}
            className="flex items-center gap-1 text-[0.625rem] text-tiger-orange font-medium animate-fade-in"
          >
            <CurrentTickerIcon className="h-3 w-3 shrink-0" />
            <span>{t(TICKER_MESSAGES[tickerIndex].key)}</span>
          </div>
        </div>

        {stockHint && stockHint !== t('product.outOfStock') && (
          <p className="text-xs text-amber-500 font-medium">{stockHint}</p>
        )}
        <button
          onClick={handleAddToCart}
          disabled={outOfStock || adding}
          className={cn(
            'w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all',
            outOfStock
              ? 'bg-surface-elevated text-muted cursor-not-allowed'
              : 'gold-button'
          )}
          aria-label={`${t('product.addCart')} ${title}`}
        >
          {adding ? (
            <>
              <Zap className="h-3.5 w-3.5" />
              {t('product.added')}
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              {outOfStock ? t('product.outOfStock') : t('product.addCart')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
