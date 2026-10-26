import 'server-only';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { ensureDatabaseConfigured } from '@/lib/env';
import type { CustomerLTV, Coupon } from '@/types';

export const POINTS_PER_DOLLAR = 10;
export const POINTS_TIER_1 = 500;
export const POINTS_TIER_2 = 1000;
export const POINTS_TIER_3 = 2500;

export function calculatePoints(priceCents: number): number {
  return Math.floor((priceCents / 100) * POINTS_PER_DOLLAR);
}

interface CouponRow {
  title_en?: string | null;
  title_ar?: string | null;
  image_url?: string | null;
  id: string;
  code: string;
  discount_type: string;
  value: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_reward: boolean;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
}

function mapCouponRow(r: CouponRow): Coupon {
  return {
    id: r.id,
    titleEn: r.title_en, titleAr: r.title_ar, imageUrl: r.image_url,
    code: r.code,
    discountType: r.discount_type as 'percentage' | 'fixed',
    value: r.value,
    maxUses: r.max_uses,
    usesCount: r.uses_count,
    expiresAt: r.expires_at,
    isReward: r.is_reward,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    createdAt: r.created_at,
  };
}

export async function getTopCustomers(limit = 20): Promise<CustomerLTV[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('orders')
    .select('email, total_cents, points_earned, user_id')
    .eq('status', 'COMPLETED')
    .not('email', 'is', null);

  if (error || !data) return [];

  const byEmail: Record<string, { totalSpent: number; totalPoints: number; orders: number; userId: string | null }> = {};

  for (const row of data as { email: string; total_cents: number; points_earned: number; user_id: string | null }[]) {
    if (!row.email) continue;
    if (!byEmail[row.email]) {
      byEmail[row.email] = { totalSpent: 0, totalPoints: 0, orders: 0, userId: null };
    }
    byEmail[row.email].totalSpent += row.total_cents;
    byEmail[row.email].totalPoints += row.points_earned || 0;
    byEmail[row.email].orders += 1;
    byEmail[row.email].userId = row.user_id;
  }

  let customers: CustomerLTV[] = Object.entries(byEmail).map(([email, d]) => ({
    email,
    name: null,
    phone: null,
    totalSpentCents: d.totalSpent,
    totalOrders: d.orders,
    totalPoints: d.totalPoints,
    isGuest: !d.userId,
  }));

  const emails = customers.map((c) => c.email);
  if (emails.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('email, name, phone')
      .in('email', emails);

    const userMap: Record<string, { name: string | null; phone: string | null }> = {};
    for (const u of (users ?? []) as { email: string; name: string | null; phone: string | null }[]) {
      userMap[u.email] = { name: u.name, phone: u.phone };
    }
    customers = customers.map((c) => ({
      ...c,
      name: userMap[c.email]?.name ?? null,
      phone: userMap[c.email]?.phone ?? null,
    }));
  }

  return customers.sort((a, b) => b.totalSpentCents - a.totalSpentCents).slice(0, limit);
}

export async function getCouponsForCustomer(email: string): Promise<Coupon[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as CouponRow[]).map(mapCouponRow);
}

export function generateCouponCode(prefix = 'GT'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createCoupon(params: {
  code?: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  isReward?: boolean;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<Coupon | null> {
  if (!isDatabaseConfigured()) return null;
  ensureDatabaseConfigured();

  const code = params.code ?? generateCouponCode();

  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code,
      discount_type: params.discountType,
      value: params.value,
      max_uses: params.maxUses ?? null,
      expires_at: params.expiresAt ?? null,
      is_reward: params.isReward ?? false,
      customer_email: params.customerEmail ?? null,
      customer_phone: params.customerPhone ?? null,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return mapCouponRow(data as CouponRow);
}

export async function getAllCoupons(): Promise<Coupon[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as CouponRow[]).map(mapCouponRow);
}
