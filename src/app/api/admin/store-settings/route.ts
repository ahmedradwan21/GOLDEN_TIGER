import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { validateStoreNumbers } from '@/lib/admin-settings';

export const dynamic = 'force-dynamic';

const COLUMNS = 'whatsapp_number, vodafone_cash_number, instapay_handle';

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await (supabaseAdmin as any).from('store_settings').select(COLUMNS).eq('id', 1).maybeSingle();
  if (error) return serverError(error, 500);
  return NextResponse.json({
    whatsapp_number: data?.whatsapp_number ?? '',
    vodafone_cash_number: data?.vodafone_cash_number ?? '',
    instapay_handle: data?.instapay_handle ?? '',
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const input = validateStoreNumbers(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Invalid store numbers' }, { status: 400 });
  const row = {
    id: 1,
    whatsapp_number: input.whatsapp_number || null,
    vodafone_cash_number: input.vodafone_cash_number || null,
    instapay_handle: input.instapay_handle || null,
  };
  const { data, error } = await (supabaseAdmin as any)
    .from('store_settings')
    .upsert(row, { onConflict: 'id' })
    .select(COLUMNS)
    .single();
  if (error) return serverError(error, 500);
  return NextResponse.json({
    whatsapp_number: data?.whatsapp_number ?? '',
    vodafone_cash_number: data?.vodafone_cash_number ?? '',
    instapay_handle: data?.instapay_handle ?? '',
  });
}
