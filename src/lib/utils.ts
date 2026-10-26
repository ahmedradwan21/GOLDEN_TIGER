import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CartItem, CartItemSnapshot, Product } from '@/types';
import { normalizeProductImages } from '@/lib/product-images';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function productToSnapshot(product: Product): CartItemSnapshot {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    titleAr: product.titleAr ?? '',
    image: normalizeProductImages(product.images)[0] ?? '',
    unitPrice: product.price,
    stock: product.stock,
  };
}

export function clampQuantity(qty: number, stock: number): number {
  const max = Math.min(stock, 10);
  return Math.max(1, Math.min(qty, max));
}

export function getStockHint(stock: number): string | null {
  if (stock === 0) return 'Out of Stock';
  if (stock <= 5) return `Only ${stock} left`;
  return null;
}

export function getStockVariant(stock: number): 'in' | 'low' | 'out' {
  if (stock === 0) return 'out';
  if (stock <= 5) return 'low';
  return 'in';
}

export function discountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
