import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { ensureBrand } from '@/lib/brand-admin';
import { normalizeProductImages } from '@/lib/product-images';
import { normalizeBannerFields } from '@/lib/homepage-banners';
import { revalidateHomepage } from '@/lib/revalidate-home';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';

  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('products')
      .select('id, slug, title, brand, sku, price_cents, compare_at_cents, stock, images, is_published, category_id, rating, review_count, tags, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category_id', category);
    }

    const { data, count, error } = await query;
    if (error) {
      return serverError(error, 500);
    }

    return NextResponse.json({
      products: (data ?? []).map((product) => ({ ...product, images: normalizeProductImages(product.images) })),
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  try {
    const body = await req.json();
    const banner = normalizeBannerFields(body);
    if (banner.error) {
      return NextResponse.json({ error: banner.error }, { status: 400 });
    }
    if ('brand' in body) body.brand = await ensureBrand(body.brand);
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        id: body.id || `p-${crypto.randomUUID()}`,
        slug: body.slug,
        title: body.title,
        title_ar: body.title_ar ?? '',
        description_ar: body.description_ar ?? '',
        brand: body.brand ?? null,
        sku: body.sku ?? null,
        short_description: body.short_description ?? null,
        description: body.description ?? '',
        features: body.features ?? [],
        specifications: body.specifications ?? null,
        price_cents: body.price_cents,
        compare_at_cents: body.compare_at_cents ?? null,
        stock: body.stock ?? 0,
        images: normalizeProductImages(body.images),
        video_urls: body.video_urls ?? [],
        tags: body.tags ?? [],
        is_published: body.is_published ?? true,
        category_id: body.category_id,
        seo_title: body.seo_title ?? null,
        seo_description: body.seo_description ?? null,
        seo_keywords: body.seo_keywords ?? null,
        ...banner.fields,
      })
      .select()
      .single();

    if (error) {
      return serverError(error, 400);
    }

    revalidateHomepage();
    return NextResponse.json({ ...data, images: normalizeProductImages(data?.images) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
