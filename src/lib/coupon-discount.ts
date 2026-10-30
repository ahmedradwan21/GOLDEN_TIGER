import { normalizeEmail } from '@/lib/auth/email';
/** Browser-safe coupon rules shared by checkout UI, validate-coupon and order completion. */

export interface CouponRow {
  code: string;
  discount_type: string; // 'percentage' | 'fixed'
  value: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_reward: boolean;
  customer_email: string | null;
}

export type CouponErrorCode = 'not_found' | 'expired' | 'used_up' | 'not_yours' | 'login_required';

/** Checks expiry, remaining uses and reward ownership. Returns null when the coupon is usable. */
export function couponProblem(
  c: CouponRow,
  sessionEmail: string | null | undefined,
  now: Date = new Date()
): CouponErrorCode | null {
  if (c.expires_at && new Date(c.expires_at).getTime() <= now.getTime()) return 'expired';
  if (c.max_uses != null && c.uses_count >= c.max_uses) return 'used_up';
  if (c.is_reward && c.customer_email) {
    if (!sessionEmail) return 'login_required';
    if (normalizeEmail(sessionEmail) !== normalizeEmail(c.customer_email)) return 'not_yours';
  }
  return null;
}

/** percentage: value% of subtotal; fixed: value cents. Never exceeds the subtotal. */
export function computeCouponDiscount(c: Pick<CouponRow, 'discount_type' | 'value'>, subtotalCents: number): number {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  const value = Math.max(0, c.value ?? 0);
  const raw = c.discount_type === 'fixed' ? value : Math.round((subtotal * Math.min(value, 100)) / 100);
  return Math.min(raw, subtotal);
}

export function normalizeCouponCode(code: unknown): string | null {
  if (typeof code !== 'string') return null;
  const s = code.trim();
  return s.length >= 1 && s.length <= 64 ? s : null;
}
