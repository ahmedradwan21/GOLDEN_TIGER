import 'server-only';
import { supabaseAdmin } from '@/lib/db-admin';
import { couponProblem, normalizeCouponCode, type CouponErrorCode, type CouponRow } from '@/lib/coupon-discount';

export type CouponLookup = { ok: true; coupon: CouponRow & { id: string } } | { ok: false; error: CouponErrorCode };

/** Finds a coupon by code (case-insensitive) and applies the validity rules. */
export async function findUsableCoupon(rawCode: unknown, sessionEmail: string | null | undefined): Promise<CouponLookup> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, error: 'not_found' };
  const escaped = code.replace(/[\\%_]/g, (m) => `\\${m}`);
  const { data, error } = await (supabaseAdmin as any)
    .from('coupons')
    .select('id, code, discount_type, value, max_uses, uses_count, expires_at, is_reward, customer_email')
    .ilike('code', escaped)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[coupons] ${error.message}`);
  if (!data) return { ok: false, error: 'not_found' };
  const problem = couponProblem(data as CouponRow, sessionEmail);
  return problem ? { ok: false, error: problem } : { ok: true, coupon: data };
}

/**
 * Atomically uses one redemption:
 * UPDATE coupons SET uses_count = uses_count + 1 WHERE code = X AND (max_uses IS NULL OR uses_count < max_uses).
 * Returns false when 0 rows were affected (limit reached) or the call failed.
 */
export async function redeemCoupon(code: string): Promise<boolean> {
  const { data, error } = await (supabaseAdmin as any).rpc('redeem_coupon', { p_code: code });
  if (error) { console.error('[coupons] redeem failed:', error.message); return false; }
  return data === true;
}

/** Gives back one redemption when the order fails after redeeming. */
export async function releaseCoupon(code: string): Promise<void> {
  const { error } = await (supabaseAdmin as any).rpc('release_coupon', { p_code: code });
  if (error) console.error('[coupons] release failed:', error.message);
}
