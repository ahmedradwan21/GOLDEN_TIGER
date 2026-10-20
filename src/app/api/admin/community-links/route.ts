import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

const urlSchema = z.string().trim().url().refine(
  (value) => value.startsWith('https://') || value.startsWith('http://'),
  { message: 'URL must start with http:// or https://' },
);

const createLinkSchema = z.object({
  platform: z.string().trim().min(1, 'Platform is required').max(100),
  name_en: z.string().trim().min(1, 'English name is required').max(200),
  name_ar: z.string().trim().min(1, 'Arabic name is required').max(200),
  description_en: z.string().trim().max(1000).optional().default(''),
  description_ar: z.string().trim().max(1000).optional().default(''),
  url: urlSchema,
  sort_order: z.number().int().min(0).optional().default(0),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('social_community_links')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: NextRequest) {
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

  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { platform, ...rest } = parsed.data;
  const normalizedPlatform = platform.toLowerCase();

  // Reject duplicate platforms (case-insensitive).
  const { data: existing } = await supabaseAdmin
    .from('social_community_links')
    .select('id')
    .ilike('platform', normalizedPlatform)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'A channel with this platform already exists' },
      { status: 409 },
    );
  }

  const { data: link, error } = await supabaseAdmin
    .from('social_community_links')
    .insert({ platform: normalizedPlatform, ...rest })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link }, { status: 201 });
}
