import { describe, it, expect } from 'bun:test';
import { toDeliveryMethod } from './shipping-methods';
import { computePriceBreakdown } from './pricing';

const row = { id: 'm1', name_en: 'Cairo', name_ar: 'القاهرة', eta_en: '1-2 days', eta_ar: 'يوم أو يومين', price_cents: 5000 };
const items = [{ unitPrice: 10000, quantity: 1 }] as any;

describe('shipping methods', () => {
  it('uses name_ar in Arabic when set', () => {
    expect(toDeliveryMethod(row, 'ar').name).toBe('القاهرة');
  });
  it('falls back to name_en when name_ar is empty', () => {
    expect(toDeliveryMethod({ ...row, name_ar: '  ' }, 'ar').name).toBe('Cairo');
  });
  it('charges price_cents as shipping', () => {
    expect(computePriceBreakdown(items, toDeliveryMethod(row, 'en')).shipping).toBe(5000);
  });
  it('price_cents 0 means free shipping', () => {
    expect(computePriceBreakdown(items, toDeliveryMethod({ ...row, price_cents: 0 }, 'en')).shipping).toBe(0);
  });
});
