import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };

    const allowedFields = [
      'slug', 'title', 'brand', 'sku', 'short_description', 'description',
      'features', 'specifications', 'price_cents', 'compare_at_cents', 'currency',
      'stock', 'images', 'video_urls', 'rating', 'review_count', 'tags',
      'is_published', 'category_id', 'seo_title', 'seo_description', 'seo_keywords',
      'is_sponsored', 'is_homepage_banner', 'ad_priority',
      'banner_image_url', 'banner_headline', 'banner_subtext',
      'ad_starts_at', 'ad_ends_at',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateFields[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
