import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

const settingsId = 'main';

const settingsSchema = z.object({
  is_enabled: z.boolean(),
  message_en: z.string().trim().max(300).optional().default(''),
  message_ar: z.string().trim().max(300).optional().default(''),
  link_url: z.string().trim().url().refine(
    (value) => value.startsWith('https://') || value.startsWith('http://'),
    { message: 'URL must start with http:// or https://' },
  ).nullable().optional(),
  background_color: z.string().trim().max(32).optional().default('#0B0B0F'),
  text_color: z.string().trim().max(32).optional().default('#F5F1E6'),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('announcement_bar_settings')
    .select('*')
    .eq('id', settingsId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = { ...parsed.data, updated_at: new Date().toISOString() };

  const { data, error } = await supabaseAdmin
    .from('announcement_bar_settings')
    .upsert({ id: settingsId, ...payload })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
