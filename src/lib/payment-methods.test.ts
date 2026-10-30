import { describe, it, expect } from 'bun:test';
import {
  isPaymentMethod,
  toWhatsAppNumber,
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
} from './payment-methods';

describe('payment methods', () => {
  it('accepts instapay, vodafone_cash and cod', () => {
    expect(['instapay', 'vodafone_cash', 'cod'].every(isPaymentMethod)).toBe(true);
  });
  it('rejects a missing choice', () => {
    expect(isPaymentMethod(undefined)).toBe(false);
    expect(isPaymentMethod('')).toBe(false);
  });
  it('rejects card payments', () => {
    expect(isPaymentMethod('card')).toBe(false);
  });
});

describe('toWhatsAppNumber', () => {
  it('converts an Egyptian mobile to the wa.me form', () => {
    expect(toWhatsAppNumber('01114246786')).toBe('201114246786');
  });
  it('keeps numbers that are already international', () => {
    expect(toWhatsAppNumber('201114246786')).toBe('201114246786');
    expect(toWhatsAppNumber('+20 111 424 6786')).toBe('201114246786');
    expect(toWhatsAppNumber('00201114246786')).toBe('201114246786');
  });
  it('returns empty for missing or unusable numbers', () => {
    expect(toWhatsAppNumber(null)).toBe('');
    expect(toWhatsAppNumber(undefined)).toBe('');
    expect(toWhatsAppNumber('')).toBe('');
    expect(toWhatsAppNumber('12345')).toBe('');
  });
});

describe('buildWhatsAppOrderMessage', () => {
  it('includes order number, customer name, total and payment method', () => {
    const message = buildWhatsAppOrderMessage({
      orderNumber: 'GT-1042',
      customerName: 'Ahmed Tarek',
      totalLabel: '$12.00',
      paymentMethod: 'instapay',
    });
    expect(message).toContain('GT-1042');
    expect(message).toContain('Ahmed Tarek');
    expect(message).toContain('$12.00');
    expect(message).toContain('InstaPay');
  });
  it('names cash on delivery for cod orders', () => {
    const message = buildWhatsAppOrderMessage({
      orderNumber: 'GT-1043',
      customerName: 'Ahmed Tarek',
      totalLabel: '$12.00',
      paymentMethod: 'cod',
    });
    expect(message).toContain('Cash on Delivery');
  });
});

describe('buildWhatsAppUrl', () => {
  it('opens wa.me with the message prefilled', () => {
    const message = buildWhatsAppOrderMessage({
      orderNumber: 'GT-1042',
      customerName: 'Ahmed Tarek',
      totalLabel: '$12.00',
      paymentMethod: 'vodafone_cash',
    });
    const url = buildWhatsAppUrl('01114246786', message);
    expect(url.startsWith('https://wa.me/201114246786?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('GT-1042'));
    expect(url).toContain(encodeURIComponent('Vodafone Cash'));
  });
  it('returns empty when the number is unusable', () => {
    expect(buildWhatsAppUrl('', 'hello')).toBe('');
    expect(buildWhatsAppUrl(null, 'hello')).toBe('');
  });
});
