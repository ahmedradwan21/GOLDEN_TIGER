import { NextRequest, NextResponse } from 'next/server';
import { revalidateHomepage } from '@/lib/revalidate-home';
import { getAdminSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db-admin';
import { normalizeProductImages } from '@/lib/product-images';
import { clampPriority, sortByPriority } from '@/lib/homepage-banners';

export const dynamic = 'force-dynamic';

const BANNER_COLUMNS =
  'id, slug, title, title_ar, images, is_published, is_homepage_banner, ad_priority, banner_image_url, banner_headline, banner_subtext, ad_starts_at, ad_ends_at';

/** All products flagged as homepage banners, highest priority first. */
export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(BANNER_COLUMNS)
    .eq('is_homepage_banner', true)
    .order('ad_priority', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = sortByPriority((data ?? []) as { ad_priority: number | null; images: unknown }[]);
  return NextResponse.json(rows.map((r) => ({ ...r, images: normalizeProductImages(r.images) })));
}

/**
 * Save banner ordering / removal.
 * Body: { priorities?: { id, ad_priority }[], remove?: string }
 */
export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { priorities?: unknown; remove?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (typeof body.remove === 'string' && body.remove) {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_homepage_banner: false, updated_at: new Date().toISOString() })
      .eq('id', body.remove);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    revalidateHomepage();
    return NextResponse.json({ success: true });
  }

  if (!Array.isArray(body.priorities) || body.priorities.length === 0 || body.priorities.length > 200) {
    return NextResponse.json({ error: 'Invalid priorities' }, { status: 400 });
  }

  const updates: { id: string; ad_priority: number }[] = [];
  for (const item of body.priorities) {
    const id = (item as { id?: unknown })?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'Invalid priorities' }, { status: 400 });
    updates.push({ id, ad_priority: clampPriority((item as { ad_priority?: unknown }).ad_priority) });
  }

  const now = new Date().toISOString();
  const results = await Promise.all(
    updates.map((u) =>
      supabaseAdmin
        .from('products')
        .update({ ad_priority: u.ad_priority, updated_at: now })
        .eq('id', u.id)
        .eq('is_homepage_banner', true)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 400 });

  revalidateHomepage();
  return NextResponse.json({ success: true });
}
