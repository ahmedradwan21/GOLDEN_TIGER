import { describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { act, create } from 'react-test-renderer';

// Bun has no web storage here.
function stubStorage(name: 'localStorage' | 'sessionStorage') {
  if ((globalThis as any)[name]) return;
  const store = new Map<string, string>();
  (globalThis as any)[name] = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
  };
}
stubStorage('localStorage');
stubStorage('sessionStorage');

/**
 * The bilingual copy is read straight from the i18n source instead of from the
 * context module, because another test file replaces that module globally.
 */
const i18nSource = readFileSync(new URL('../../context/I18nContext.tsx', import.meta.url), 'utf8');
function dictValue(key: string): string {
  const match = new RegExp(`'${key}':\\s*'([^']*)'`).exec(i18nSource);
  if (!match) throw new Error(`i18n key is missing from the dictionary: ${key}`);
  return match[1];
}
const t = (key: string) => {
  try {
    return dictValue(key);
  } catch {
    return key;
  }
};

// Keep the render free of Next runtime, images, pixel tracking, and the real context.
mock.module('@/context/I18nContext', () => ({
  I18nProvider: ({ children }: any) => children,
  useI18n: () => ({ locale: 'en', dir: 'ltr', t, setLocale: () => {}, toggleLocale: () => {} }),
}));
mock.module('next/link', () => ({
  default: ({ href, children }: any) => React.createElement('a', { href }, children),
}));
mock.module('@/components/ui/SafeImage', () => ({
  SafeImage: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}));
mock.module('@/components/layout/Logo', () => ({
  Logo: () => React.createElement('div', null, 'Golden Tiger'),
}));
mock.module('@/lib/fbpixel', () => ({
  trackPurchase: () => {},
  trackInitiateCheckout: () => {},
}));

const BASE_ORDER = {
  orderNumber: 'GT-1042',
  email: 'ahmed@example.com',
  deliveryMethodName: 'Standard',
  deliveryMethodEstimate: '3-5',
  subtotal: 1000,
  tax: 80,
  shipping: 120,
  total: 1200,
  placedAt: new Date().toISOString(),
  status: 'CHECKOUT_STARTED',
  paymentMethod: 'instapay',
  customerName: 'Ahmed Tarek',
  deliveryNotes: 'Ring the bell twice',
  preferredDeliveryTime: 'After 5 PM',
  whatsappNumber: '201114246786',
  instapayHandle: 'ahmed@instapay',
  vodafoneCashNumber: '01000000000',
  shippingDetails: {
    fullName: 'Ahmed Tarek', email: 'ahmed@example.com', phone: '01114246786',
    addressLine1: '12 Tahrir St', addressLine2: '', city: 'Cairo',
    stateOrRegion: 'Cairo', postalCode: '', country: 'Egypt',
  },
  items: [{ id: 'i1', slug: '', title: 'Tiger Mug', image: '', unitPrice: 1000, stock: 0, quantity: 1 }],
};

let OrderConfirmationClient: any;

async function loadClient() {
  if (!OrderConfirmationClient) {
    ({ OrderConfirmationClient } = await import('@/components/checkout/OrderConfirmationClient'));
  }
  return OrderConfirmationClient;
}

async function render(overrides: Record<string, unknown> = {}) {
  const order = { ...BASE_ORDER, ...overrides };
  const Client = await loadClient();
  let view: any;
  act(() => {
    view = create(React.createElement(Client, { orderNumber: order.orderNumber, serverOrder: order }));
  });
  return {
    text: JSON.stringify(view.toJSON()),
    whatsappHref: view.root
      .findAll((node: any) => typeof node.props?.href === 'string' && node.props.href.startsWith('https://wa.me'))
      .map((node: any) => node.props.href as string)[0] ?? '',
  };
}

describe('order confirmation manual payment block', () => {
  test('instapay shows the handle, the pending label and the WhatsApp link', async () => {
    const { text, whatsappHref } = await render();
    expect(text).toContain('ahmed@instapay');
    expect(text).toContain(dictValue('order.status.awaitingPayment'));
    expect(whatsappHref.startsWith('https://wa.me/201114246786?text=')).toBe(true);
    const message = decodeURIComponent(whatsappHref.split('text=')[1] ?? '');
    expect(message).toContain('GT-1042');
    expect(message).toContain('Ahmed Tarek');
    expect(message).toContain('$12.00');
    expect(message).toContain('InstaPay');
  });

  test('vodafone_cash shows the wallet number', async () => {
    const { text } = await render({ paymentMethod: 'vodafone_cash' });
    expect(text).toContain('01000000000');
    expect(text).not.toContain('ahmed@instapay');
  });

  test('cod shows the pay-the-courier line', async () => {
    const { text } = await render({ paymentMethod: 'cod' });
    expect(text).toContain(dictValue('order.pay.cod'));
    expect(text).not.toContain('ahmed@instapay');
  });

  test('shows delivery notes and the preferred delivery time', async () => {
    const { text } = await render();
    expect(text).toContain('Ring the bell twice');
    expect(text).toContain('After 5 PM');
  });

  test('hides the payment block once the order is completed', async () => {
    const { text } = await render({ status: 'COMPLETED' });
    expect(text).not.toContain(dictValue('order.status.awaitingPayment'));
  });
});

describe('manual payment copy', () => {
  test('the dictionary carries the exact bilingual wording', () => {
    expect(dictValue('order.status.awaitingPayment')).toBe('بانتظار تأكيد الدفع / Awaiting payment confirmation');
    expect(dictValue('order.pay.cod')).toBe('ادفع كاش عند الاستلام / Pay cash to the courier');
    expect(dictValue('order.sendScreenshot')).toBe(
      'Send the payment screenshot to our WhatsApp / ابعت سكرين شوت التحويل على واتسابنا'
    );
  });
});
