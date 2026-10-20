import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

const urlSchema = z.string().trim().url().refine(
  (value) => value.startsWith('https://') || value.startsWith('http://'),
  { message: 'URL must start with http:// or https://' },
);

const updateLinkSchema = z.object({
  platform: z.string().trim().min(1).max(100).optional(),
  name_en: z.string().trim().min(1).max(200).optional(),
  name_ar: z.string().trim().min(1).max(200).optional(),
  description_en: z.string().trim().max(1000).optional(),
  description_ar: z.string().trim().max(1000).optional(),
  url: urlSchema.optional(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
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

  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (typeof updates.platform === 'string') {
    const normalized = updates.platform.toLowerCase();
    const { data: clash } = await supabaseAdmin
      .from('social_community_links')
      .select('id')
      .ilike('platform', normalized)
      .neq('id', params.id)
      .maybeSingle();
    if (clash) {
      return NextResponse.json(
        { error: 'A channel with this platform already exists' },
        { status: 409 },
      );
    }
    updates.platform = normalized;
  }
  updates.updated_at = new Date().toISOString();

  const { data: link, error } = await supabaseAdmin
    .from('social_community_links')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!link) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  return NextResponse.json({ link });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: link, error } = await supabaseAdmin
    .from('social_community_links')
    .delete()
    .eq('id', params.id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!link) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
