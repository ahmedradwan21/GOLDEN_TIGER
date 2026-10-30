import type { CartItem, DeliveryMethod } from '@/types';

export const TAX_RATE = 0.08;
export const FREE_SHIPPING_THRESHOLD = 5000; // $50.00 in cents
export const STANDARD_SHIPPING_FEE = 599; // $5.99 in cents

// Delivery methods come from the shipping_methods table via /api/shipping-methods.

export interface PriceBreakdown {
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
  amountUntilFreeShipping: number;
}

export function computePriceBreakdown(
  items: CartItem[],
  deliveryMethod: DeliveryMethod | null
): PriceBreakdown {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const tax = Math.round(subtotal * TAX_RATE);

  let shipping = 0;
  if (items.length > 0 && deliveryMethod) {
    if (
      deliveryMethod.freeThreshold &&
      subtotal >= deliveryMethod.freeThreshold
    ) {
      shipping = 0;
    } else {
      shipping = deliveryMethod.fee;
    }
  }

  const total = subtotal + tax + shipping;
  const amountUntilFreeShipping =
    subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD
      ? FREE_SHIPPING_THRESHOLD - subtotal
      : 0;

  return {
    itemCount,
    subtotal,
    tax,
    shipping,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountUntilFreeShipping,
  };
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatPriceNoSymbol(cents: number): string {
  return (cents / 100).toFixed(2);
}
