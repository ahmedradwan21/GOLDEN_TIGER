import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { generateCouponCode } from '@/lib/data/loyalty';


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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tierId } = body as { tierId?: string };

    if (!tierId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Discount and cost always come from the database, never from the client.
    const { data: tier, error: tierError } = await (supabaseAdmin as any)
      .from('loyalty_tiers')
      .select('id,discount_percentage,points_required,is_active')
      .eq('id', tierId)
      .maybeSingle();
    if (tierError) throw new Error(tierError.message);
    if (!tier || !tier.is_active) {
      return NextResponse.json({ error: 'Reward tier not available' }, { status: 404 });
    }
    const discountType = 'percentage' as const;
    const value = Number(tier.discount_percentage);
    const pointsCost = Number(tier.points_required);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const coupon = await insertCouponAdmin({
      discountType,
      value,
      maxUses: 1,
      expiresAt: expiresAt.toISOString(),
      isReward: true,
      customerEmail: null,
      customerPhone: null,
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }

    return NextResponse.json({ coupon, pointsCost });
  } catch (err) {
    return serverError(err, 500, "loyalty");
  }
}
