import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db-admin';
import { getTopCustomers, generateCouponCode } from '@/lib/data/loyalty';
import { formatPrice } from '@/lib/pricing';


async function insertCouponAdmin(params: {
  discountType: 'percentage' | 'fixed';
  value: number;
  maxUses: number | null;
  expiresAt: string;
  isReward: boolean;
  customerEmail: string | null;
  customerPhone: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .insert({
      code: generateCouponCode(),
      discount_type: params.discountType,
      value: params.value,
      max_uses: params.maxUses,
      expires_at: params.expiresAt,
      is_reward: params.isReward,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
    })
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[coupons] insert failed (check RLS / service role key):', error);
    throw new Error(`Coupon insert failed: ${error.message}`);
  }
  if (!data) throw new Error('Coupon insert returned no row (likely blocked by RLS)');
  return {
    id: data.id,
    code: data.code,
    discountType: data.discount_type as 'percentage' | 'fixed',
    value: data.value,
    maxUses: data.max_uses,
    usesCount: data.uses_count,
    expiresAt: data.expires_at,
    isReward: data.is_reward,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    createdAt: data.created_at,
  };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await getTopCustomers(20);
    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ error: 'Failed to load loyalty data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { customerEmail, customerPhone, discountType, value, maxUses } = body;

    if (!customerEmail && !customerPhone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const coupon = await insertCouponAdmin({
      discountType: discountType ?? 'percentage',
      value: value ?? 10,
      maxUses: maxUses ?? 1,
      expiresAt: expiresAt.toISOString(),
      isReward: true,
      customerEmail: customerEmail ?? null,
      customerPhone: customerPhone ?? null,
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }

    return NextResponse.json({
      coupon,
      message: `Coupon ${coupon.code} created for ${customerEmail || customerPhone} — ${discountType === 'percentage' ? value + '% off' : formatPrice(value)} valid for 30 days`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
