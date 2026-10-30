import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { DEFAULT_PROGRAM_NAME, sanitizeSettingsInput } from '@/lib/loyalty-settings';

export const dynamic = 'force-dynamic';
const db = () => (supabaseAdmin as any).from('loyalty_settings');

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await db().select('name_en,name_ar').eq('id', 1).maybeSingle();
  if (error) return serverError(error, 500);
  return NextResponse.json({
    settings: {
      name_en: data?.name_en ?? '',
      name_ar: data?.name_ar ?? '',
    },
    defaults: DEFAULT_PROGRAM_NAME,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const input = sanitizeSettingsInput(await req.json());
  if (!input.name_en) return NextResponse.json({ error: 'English name is required' }, { status: 400 });
  const { data, error } = await db()
    .upsert({ id: 1, ...input }, { onConflict: 'id' })
    .select('name_en,name_ar')
    .single();
  if (error) return serverError(error, 500);
  return NextResponse.json({ settings: data });
}
