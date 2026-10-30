/**
 * Browser-safe affiliate rules shared by /admin/affiliates and its API routes:
 * field validation, coupon code generation and the earnings report math.
 */

export interface AffiliateInput {
  name: string;
  phone: string | null;
  email: string | null;
  commission_percent: number;
  notes: string | null;
  is_active: boolean;
}

export interface AdminAffiliate extends AffiliateInput {
  id: string;
  coupon_code: string;
  created_at: string;
}

/** Coupon every new affiliate gets: 10% off, not a reward, never expires, unlimited uses. */
export const AFFILIATE_COUPON = {
  discount_type: 'percentage',
  value: 10,
  is_reward: false,
  expires_at: null,
  max_uses: null,
} as const;

const PHONE = /^[+\d\s()-]*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (v: unknown, max: number): string | null | undefined => {
  if (v == null) return null;
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (s.length > max) return undefined;
  return s || null;
};

/** Returns cleaned fields, or null when anything is invalid. */
export function validateAffiliate(body: unknown): AffiliateInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const name = text(b.name, 120);
  const phone = text(b.phone, 30);
  const email = text(b.email, 200);
  const notes = text(b.notes, 2000);
  if (!name || phone === undefined || email === undefined || notes === undefined) return null;
  if (phone && !PHONE.test(phone)) return null;
  if (email && !EMAIL.test(email)) return null;
  const pct = typeof b.commission_percent === 'string' ? Number(b.commission_percent) : b.commission_percent;
  if (typeof pct !== 'number' || !Number.isFinite(pct) || pct < 0 || pct > 100) return null;
  return {
    name,
    phone,
    email: email ? email.toLowerCase() : null,
    commission_percent: Math.round(pct * 100) / 100,
    notes,
    is_active: b.is_active !== false,
  };
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I

/** "Ahmed Tarek" -> "AHMEDTAREK" (Latin letters/digits only, max 12). Falls back to "GT". */
export function codePrefix(name: string): string {
  const latin = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  return latin || 'GT';
}

const defaultRandom = (): number => {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
};

/** NAME-XXXX, where XXXX is 4 random characters. Uniqueness is enforced by the caller. */
export function generateAffiliateCode(name: string, random: () => number = defaultRandom): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return `${codePrefix(name)}-${suffix}`;
}

export interface ReportOrder {
  coupon_code: string | null;
  total_cents: number;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export interface EarningsRow {
  affiliate_id: string;
  name: string;
  coupon_code: string;
  commission_percent: number;
  is_active: boolean;
  order_count: number;
  total_sales_cents: number;
  commission_cents: number;
}

export interface DateRange {
  from: string | null; // ISO, inclusive
  to: string | null; // ISO, inclusive
}

/** The order's date for reporting: when it was completed, else when it was created. */
const orderTime = (o: ReportOrder) => Date.parse(o.completed_at ?? o.created_at);

/**
 * Per affiliate: COMPLETED orders whose coupon_code matches (case-insensitive) within the range.
 * commission = sum(total_cents * commission_percent / 100), rounded to whole cents once at the end.
 */
export function buildEarningsReport(
  affiliates: Pick<AdminAffiliate, 'id' | 'name' | 'coupon_code' | 'commission_percent' | 'is_active'>[],
  orders: ReportOrder[],
  range: DateRange = { from: null, to: null }
): EarningsRow[] {
  const from = range.from ? Date.parse(range.from) : -Infinity;
  const to = range.to ? Date.parse(range.to) : Infinity;
  const byCode = new Map<string, { count: number; sales: number }>();
  for (const o of orders) {
    if (o.status !== 'COMPLETED' || !o.coupon_code) continue;
    const t = orderTime(o);
    if (!Number.isFinite(t) || t < from || t > to) continue;
    const key = o.coupon_code.trim().toUpperCase();
    const agg = byCode.get(key) ?? { count: 0, sales: 0 };
    agg.count += 1;
    agg.sales += o.total_cents;
    byCode.set(key, agg);
  }
  return affiliates.map((a) => {
    const agg = byCode.get(a.coupon_code.trim().toUpperCase()) ?? { count: 0, sales: 0 };
    return {
      affiliate_id: a.id,
      name: a.name,
      coupon_code: a.coupon_code,
      commission_percent: Number(a.commission_percent),
      is_active: a.is_active,
      order_count: agg.count,
      total_sales_cents: agg.sales,
      commission_cents: Math.round((agg.sales * Number(a.commission_percent)) / 100),
    };
  });
}

/** <input type="date"> value (admin's timezone) -> ISO at the start or end of that day. */
export function dayBoundary(value: string, edge: 'start' | 'end'): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T${edge === 'start' ? '00:00:00.000' : '23:59:59.999'}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
