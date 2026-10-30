import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { toAnnouncementSettings, validateAnnouncementInput } from '@/lib/announcement';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await supabaseAdmin
    .from('announcement_bar_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) return serverError(error, 500);
  return NextResponse.json(toAnnouncementSettings(data as Record<string, unknown> | null));
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;

  let input;
  try {
    input = validateAnnouncementInput(await req.json());
  } catch {
    input = null;
  }
  if (!input) return NextResponse.json({ error: 'Invalid announcement fields' }, { status: 400 });

  // Single-row table: update the existing row, or create it if it is missing.
  const existing = await supabaseAdmin.from('announcement_bar_settings').select('id').limit(1).maybeSingle();
  if (existing.error) return serverError(existing.error, 500);

  const result = existing.data
    ? await supabaseAdmin
        .from('announcement_bar_settings')
        .update(input)
        .eq('id', (existing.data as { id: string }).id)
        .select('*')
        .single()
    : await supabaseAdmin.from('announcement_bar_settings').insert(input).select('*').single();

  if (result.error) return serverError(result.error, 400);
  return NextResponse.json(toAnnouncementSettings(result.data as Record<string, unknown>));
}
