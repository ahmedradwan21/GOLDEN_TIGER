/* eslint-disable @typescript-eslint/no-explicit-any */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export function loadFBPixel(): void {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (w.fbq) return;
  if (!FB_PIXEL_ID) return;

  if (!w.fbq) {
    w.fbq = function () {
      (w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, arguments) : w.fbq.queue.push(arguments));
    };
    w.fbq.push = w.fbq;
    w.fbq.loaded = true;
    w.fbq.version = '2.0';
    w.fbq.queue = [];
  }
  if (!w._fbq) w._fbq = w.fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode?.insertBefore(script, firstScript);

  w.fbq('init', FB_PIXEL_ID);
  w.fbq('track', 'PageView');
}

type PixelEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase';

interface PixelParams {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  value?: number;
  currency?: string;
  contents?: Array<{ id: string; quantity: number; price: number }>;
  num_items?: number;
  [key: string]: unknown;
}

export function trackEvent(event: PixelEvent, params?: PixelParams): void {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (!w.fbq) return;
  w.fbq('track', event, params);
}

export function trackPageView(): void {
  trackEvent('PageView');
}

export function trackViewContent(params: {
  contentIds: string[];
  contentName: string;
  contentType?: string;
  value: number;
  currency?: string;
}): void {
  trackEvent('ViewContent', {
    content_ids: params.contentIds,
    content_name: params.contentName,
    content_type: params.contentType ?? 'product',
    value: params.value / 100,
    currency: params.currency ?? 'USD',
  });
}

export function trackAddToCart(params: {
  contentIds: string[];
  contentName: string;
  value: number;
  currency?: string;
  quantity?: number;
}): void {
  trackEvent('AddToCart', {
    content_ids: params.contentIds,
    content_name: params.contentName,
    content_type: 'product',
    value: (params.value * (params.quantity ?? 1)) / 100,
    currency: params.currency ?? 'USD',
    contents: [{ id: params.contentIds[0], quantity: params.quantity ?? 1, price: params.value / 100 }],
    num_items: params.quantity ?? 1,
  });
}

export function trackInitiateCheckout(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
}): void {
  trackEvent('InitiateCheckout', {
    content_ids: params.contentIds,
    content_type: 'product',
    value: params.value / 100,
    currency: params.currency ?? 'USD',
    num_items: params.numItems,
  });
}

export function trackPurchase(params: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
  orderId: string;
}): void {
  trackEvent('Purchase', {
    content_ids: params.contentIds,
    content_type: 'product',
    value: params.value / 100,
    currency: params.currency ?? 'USD',
    num_items: params.numItems,
    order_id: params.orderId,
  });
}
