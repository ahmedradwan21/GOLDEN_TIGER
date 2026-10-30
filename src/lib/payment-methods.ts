import { z } from 'zod';

export const PAYMENT_METHODS = ['instapay', 'vodafone_cash', 'cod'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Required: the checkout cannot complete without one of the three manual methods. */
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return paymentMethodSchema.safeParse(v).success;
}

/** Public payment details shown at checkout (from store_settings id=1). */
export interface PaymentInfo {
  instapay_handle: string | null;
  vodafone_cash_number: string | null;
}

/** Bilingual names, used for the WhatsApp message the admin reads. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { en: string; ar: string }> = {
  instapay: { en: 'InstaPay', ar: 'إنستاباي' },
  vodafone_cash: { en: 'Vodafone Cash', ar: 'فودافون كاش' },
  cod: { en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' },
};

/**
 * Egyptian mobile (01xxxxxxxxx) -> international wa.me form (201xxxxxxxxx).
 * Already-international, spaced, or '+'-prefixed numbers pass through unchanged.
 * Returns '' for anything unusable so callers can hide the WhatsApp button.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length < 8) return '';
  return digits.startsWith('20') ? digits : `20${digits}`;
}

export interface WhatsAppOrderMessageInput {
  orderNumber: string;
  customerName: string;
  totalLabel: string;
  paymentMethod: PaymentMethod | '';
}

/** Prefilled WhatsApp text: order number, customer name, total, payment method. */
export function buildWhatsAppOrderMessage({
  orderNumber,
  customerName,
  totalLabel,
  paymentMethod,
}: WhatsAppOrderMessageInput): string {
  const label = paymentMethod ? PAYMENT_METHOD_LABELS[paymentMethod] : null;
  return [
    'The Golden Tiger',
    `Order / الطلب: ${orderNumber}`,
    `Name / الاسم: ${customerName || '-'}`,
    `Total / الإجمالي: ${totalLabel}`,
    `Payment / طريقة الدفع: ${label ? `${label.en} / ${label.ar}` : '-'}`,
  ].join('\n');
}

/** wa.me link with the message prefilled; '' when the number is unusable. */
export function buildWhatsAppUrl(number: string | null | undefined, message: string): string {
  const digits = toWhatsAppNumber(number);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
