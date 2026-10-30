import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import type { PaymentInfo } from '@/lib/payment-methods';

export const dynamic = 'force-dynamic';

// Public checkout read: only the InstaPay handle and Vodafone Cash number from store_settings (id=1).
export async function GET() {
  const { data, error } = await (supabaseAdmin as any)
    .from('store_settings')
    .select('instapay_handle, vodafone_cash_number')
    .eq('id', 1)
    .maybeSingle();
  if (error) {
    console.error('[payment-info]', error.message);
    return NextResponse.json({ error: 'Could not load payment details' }, { status: 500 });
  }
  const body: PaymentInfo = {
    instapay_handle: data?.instapay_handle ?? null,
    vodafone_cash_number: data?.vodafone_cash_number ?? null,
  };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
