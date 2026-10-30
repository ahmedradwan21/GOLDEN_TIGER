import { describe, it, expect } from 'bun:test';
import { AFFILIATE_COUPON, buildEarningsReport, codePrefix, generateAffiliateCode, validateAffiliate, type ReportOrder } from './affiliates';

const aff = { id: 'a1', name: 'Ahmed', coupon_code: 'AHMED-AB23', commission_percent: 15, is_active: true };
const order = (o: Partial<ReportOrder>): ReportOrder => ({
  coupon_code: 'AHMED-AB23', total_cents: 10000, status: 'COMPLETED', completed_at: '2026-10-15T10:00:00Z', created_at: '2026-10-14T10:00:00Z', ...o,
});

describe('affiliate coupon', () => {
  it('is 10% percentage, not a reward, no expiry', () => {
    expect(AFFILIATE_COUPON.discount_type).toBe('percentage');
    expect(AFFILIATE_COUPON.value).toBe(10);
    expect(AFFILIATE_COUPON.is_reward).toBe(false);
    expect(AFFILIATE_COUPON.expires_at).toBeNull();
  });
  it('code is NAME-XXXX', () => {
    expect(generateAffiliateCode('Ahmed Tarek', () => 0)).toBe('AHMEDTAREK-AAAA');
    expect(generateAffiliateCode('Sara')).toMatch(/^SARA-[A-Z2-9]{4}$/);
  });
  it('non-Latin names fall back to GT prefix', () => {
    expect(codePrefix('أحمد')).toBe('GT');
  });
});

describe('affiliate validation', () => {
  it('requires a name and a commission between 0 and 100', () => {
    expect(validateAffiliate({ name: '', commission_percent: 10 })).toBeNull();
    expect(validateAffiliate({ name: 'A', commission_percent: 101 })).toBeNull();
    expect(validateAffiliate({ name: 'A', commission_percent: -1 })).toBeNull();
    expect(validateAffiliate({ name: 'A', commission_percent: 12.5 })?.commission_percent).toBe(12.5);
  });
  it('rejects a bad email', () => {
    expect(validateAffiliate({ name: 'A', commission_percent: 5, email: 'nope' })).toBeNull();
  });
});

describe('earnings report', () => {
  it('commission = sum(total_cents * commission_percent / 100)', () => {
    const [r] = buildEarningsReport([aff], [order({ total_cents: 10000 }), order({ total_cents: 5000 })]);
    expect(r.order_count).toBe(2);
    expect(r.total_sales_cents).toBe(15000);
    expect(r.commission_cents).toBe(2250);
  });
  it('only counts COMPLETED orders', () => {
    const [r] = buildEarningsReport([aff], [order({ status: 'CHECKOUT_STARTED' }), order({ status: 'CANCELLED' })]);
    expect(r.order_count).toBe(0);
    expect(r.commission_cents).toBe(0);
  });
  it('matches coupon_code case-insensitively and ignores other codes', () => {
    const [r] = buildEarningsReport([aff], [order({ coupon_code: 'ahmed-ab23' }), order({ coupon_code: 'OTHER-1111' })]);
    expect(r.order_count).toBe(1);
  });
  it('applies the from/to date filter inclusively', () => {
    const orders = [
      order({ completed_at: '2026-10-01T00:00:00Z' }),
      order({ completed_at: '2026-10-15T00:00:00Z' }),
      order({ completed_at: '2026-10-31T23:59:59Z' }),
      order({ completed_at: '2026-11-01T00:00:00Z' }),
    ];
    const [r] = buildEarningsReport([aff], orders, { from: '2026-10-01T00:00:00Z', to: '2026-10-31T23:59:59Z' });
    expect(r.order_count).toBe(3);
  });
  it('uses created_at when completed_at is empty', () => {
    const [r] = buildEarningsReport([aff], [order({ completed_at: null, created_at: '2026-09-01T00:00:00Z' })], { from: '2026-10-01T00:00:00Z', to: null });
    expect(r.order_count).toBe(0);
  });
});
