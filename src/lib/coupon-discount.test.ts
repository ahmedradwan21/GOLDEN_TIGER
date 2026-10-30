import { describe, it, expect } from 'bun:test';
import { computeCouponDiscount, couponProblem, type CouponRow } from './coupon-discount';

const base: CouponRow = { code: 'GT10', discount_type: 'percentage', value: 10, max_uses: null, uses_count: 0, expires_at: null, is_reward: false, customer_email: null };
const now = new Date('2026-10-30T12:00:00Z');

describe('coupon rules', () => {
  it('percentage takes value% of subtotal', () => {
    expect(computeCouponDiscount(base, 20000)).toBe(2000);
  });
  it('fixed takes value in cents', () => {
    expect(computeCouponDiscount({ discount_type: 'fixed', value: 5000 }, 20000)).toBe(5000);
  });
  it('discount never exceeds subtotal', () => {
    expect(computeCouponDiscount({ discount_type: 'fixed', value: 5000 }, 3000)).toBe(3000);
  });
  it('no expiry is valid', () => {
    expect(couponProblem(base, null, now)).toBeNull();
  });
  it('past expiry is expired', () => {
    expect(couponProblem({ ...base, expires_at: '2026-10-29T00:00:00Z' }, null, now)).toBe('expired');
  });
  it('future expiry is valid', () => {
    expect(couponProblem({ ...base, expires_at: '2026-11-01T00:00:00Z' }, null, now)).toBeNull();
  });
  it('uses_count reaching max_uses is used up', () => {
    expect(couponProblem({ ...base, max_uses: 5, uses_count: 5 }, null, now)).toBe('used_up');
  });
  it('uses left is valid', () => {
    expect(couponProblem({ ...base, max_uses: 5, uses_count: 4 }, null, now)).toBeNull();
  });
  it('reward coupon needs login', () => {
    expect(couponProblem({ ...base, is_reward: true, customer_email: 'a@b.com' }, null, now)).toBe('login_required');
  });
  it('reward coupon rejects another customer', () => {
    expect(couponProblem({ ...base, is_reward: true, customer_email: 'a@b.com' }, 'x@y.com', now)).toBe('not_yours');
  });
  it('reward coupon accepts its owner', () => {
    expect(couponProblem({ ...base, is_reward: true, customer_email: 'A@b.com' }, 'a@B.com', now)).toBeNull();
  });
});
