import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { ensureBrand } from '@/lib/brand-admin';
import { normalizeProductImages } from '@/lib/product-images';
import { normalizeBannerFields } from '@/lib/homepage-banners';
import { revalidateHomepage } from '@/lib/revalidate-home';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return serverError(error, 500);
  }
  if (!data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ ...data, images: normalizeProductImages(data.images) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  try {
    const body = await req.json();
    if ('brand' in body) body.brand = await ensureBrand(body.brand);
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };

    const allowedFields = [
      'slug', 'title', 'title_ar', 'description_ar', 'brand', 'sku', 'short_description', 'description',
      'features', 'specifications', 'price_cents', 'compare_at_cents', 'currency',
      'stock', 'images', 'video_urls', 'rating', 'review_count', 'tags',
      'is_published', 'category_id', 'seo_title', 'seo_description', 'seo_keywords',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateFields[field] = field === 'images' ? normalizeProductImages(body[field]) : body[field];
      }
    }

    // Homepage banner / ad fields are validated in one place.
    const banner = normalizeBannerFields(body);
    if (banner.error) {
      return NextResponse.json({ error: banner.error }, { status: 400 });
    }
    Object.assign(updateFields, banner.fields);

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return serverError(error, 400);
    }

    revalidateHomepage();
    return NextResponse.json({ ...data, images: normalizeProductImages(data?.images) });
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', params.id);

  if (error) {
    return serverError(error, 400);
  }

  revalidateHomepage();
  return NextResponse.json({ success: true });
}
