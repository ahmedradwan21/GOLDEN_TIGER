'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Rating } from '@/components/ui/Rating';
import { PriceTag } from '@/components/ui/PriceTag';
import { useCart } from '@/context/CartContext';
import { productToSnapshot, getStockHint } from '@/lib/utils';
import { cn } from '@/lib/utils';
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

export function ProductCard({
  product,
  sponsored,
  source = 'product_card',
  onVisible,
  onSelect,
  className,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visibleFired = useRef(false);

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
  }, [onVisible, product]);

  const outOfStock = product.stock === 0;
  const stockHint = getStockHint(product.stock);

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
      {sponsored && (
        <span className="absolute top-2 left-2 z-10 bg-gold/20 text-gold text-[0.625rem] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
          Sponsored
        </span>
      )}
      {outOfStock && (
        <span className="absolute top-2 right-2 z-10 bg-danger/20 text-danger text-[0.625rem] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
          Out of Stock
        </span>
      )}

      <Link
        href={`/product/${product.slug}`}
        onClick={() => {
          track('CLICK', { productId: product.id, source: sponsored ? `sponsored_${source}` : source });
          onSelect?.(product);
        }}
        className="block"
        aria-label={sponsored ? `Sponsored result: ${product.title}` : product.title}
      >
        <div className="relative aspect-square overflow-hidden bg-surface-elevated">
          <SafeImage
            src={hovered && product.images[1] ? product.images[1] : product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={cn(
              'object-cover transition-transform duration-500',
              hovered ? 'scale-110' : 'scale-100'
            )}
          />
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <p className="text-[0.625rem] uppercase tracking-wider text-muted">{product.brand}</p>
        <Link
          href={`/product/${product.slug}`}
          onClick={() => onSelect?.(product)}
          className="block"
        >
          <h3 className="text-sm font-medium text-text line-clamp-2 leading-snug min-h-[2.5rem] hover:text-gold transition-colors">
            {product.title}
          </h3>
        </Link>
        <Rating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
        <PriceTag
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
        />
        {stockHint && stockHint !== 'Out of Stock' && (
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
          aria-label={`Add ${product.title} to cart`}
        >
          {adding ? (
            <>
              <Zap className="h-3.5 w-3.5" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
