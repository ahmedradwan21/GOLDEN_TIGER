'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { PriceTag } from '@/components/ui/PriceTag';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/pricing';
import { calculatePoints } from '@/lib/loyalty-points';
import { productToSnapshot, getStockVariant, discountPercent } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { trackAddToCart, trackViewContent } from '@/lib/fbpixel';
import type { Product } from '@/types';

export function BuyBox({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const stockVariant = getStockVariant(product.stock);
  const maxQty = Math.min(product.stock, 10);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stock === 0;
  const pointsEarned = calculatePoints(product.price * quantity);

  useEffect(() => {
    trackViewContent({
      contentIds: [product.id],
      contentName: product.title,
      value: product.price,
    });
  }, [product.id, product.title, product.price]);

  function handleAddToCart() {
    if (outOfStock) return;
    setAdding(true);
    addItem(productToSnapshot(product), quantity);
    trackAddToCart({
      contentIds: [product.id],
      contentName: product.title,
      value: product.price,
      quantity,
    });
    setTimeout(() => setAdding(false), 600);
    toast.success(`${product.title} added to cart`);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addItem(productToSnapshot(product), quantity);
    router.push('/checkout');
  }

  // Delivery estimate
  const today = new Date();
  const standardDate = new Date(today);
  standardDate.setDate(today.getDate() + 5);
  const expressDate = new Date(today);
  expressDate.setDate(today.getDate() + 2);
  const dateStr = standardDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-gold mb-1">{product.brand}</p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text leading-tight">
          {product.title}
        </h1>
      </div>

      <Rating rating={product.rating} reviewCount={product.reviewCount} size="md" />

      <div className="py-3 border-y border-border">
        <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
        {discount !== null && (
          <p className="text-sm text-success mt-1">
            You save {formatPrice((product.compareAtPrice || 0) - product.price)} ({discount}% off)
          </p>
        )}
      </div>

      {/* Stock badge */}
      <div>
        {stockVariant === 'in' && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success" /> In Stock
          </span>
        )}
        {stockVariant === 'low' && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-500">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Only {product.stock} left in stock
          </span>
        )}
        {stockVariant === 'out' && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger">
            <span className="h-2 w-2 rounded-full bg-danger" /> Out of Stock
          </span>
        )}
      </div>

      {/* Quantity */}
      {!outOfStock && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted" htmlFor="qty">Quantity:</label>
          <QuantityStepper
            quantity={quantity}
            max={maxQty}
            onChange={setQuantity}
          />
          {quantity >= maxQty && (
            <span className="text-xs text-amber-500">Max {maxQty} per order</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAddToCart}
          disabled={outOfStock || adding}
          className="flex-1 h-12 rounded-lg flex items-center justify-center gap-2 gold-button text-sm font-semibold"
          aria-label="Add to cart"
        >
          {adding ? (
            <>
              <Zap className="h-4 w-4" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="flex-1 h-12 rounded-lg flex items-center justify-center gap-2 bg-surface-elevated border border-border text-sm font-semibold text-text hover:border-gold/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <Zap className="h-4 w-4 text-gold" />
          Buy Now
        </button>
      </div>

      {/* Delivery estimate */}
      <div className="flex items-start gap-2 text-sm text-muted p-3 rounded-lg bg-surface-elevated">
        <Truck className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <div>
          <p className="text-text">FREE delivery by <span className="font-medium">{dateStr}</span></p>
          <p className="text-xs mt-0.5">Order within 4 hrs 30 mins. Express available.</p>
        </div>
      </div>

      {/* Loyalty Points Display */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gold/10 border border-gold/20">
        <Sparkles className="h-5 w-5 text-gold shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gold">
            Earn {pointsEarned.toLocaleString()} loyalty points
          </p>
          <p className="text-xs text-muted">
            10 points per $1 spent — redeem for exclusive discount coupons
          </p>
        </div>
      </div>

      {/* Secure note */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <ShieldCheck className="h-4 w-4 text-gold" />
        Secure transaction. 30-day returns.
      </div>
    </div>
  );
}
