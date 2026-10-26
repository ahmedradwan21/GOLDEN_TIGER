import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { LOYALTY_TIER_FIELDS } from '@/lib/loyalty-tiers';

export const dynamic = 'force-dynamic';

// Public: active tiers only, ordered for display.
export async function GET() {
  const { data, error } = await (supabaseAdmin as any)
    .from('loyalty_tiers')
    .select(LOYALTY_TIER_FIELDS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tiers: data ?? [] });
}
