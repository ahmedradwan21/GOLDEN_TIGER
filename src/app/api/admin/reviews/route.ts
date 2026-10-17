import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = (page - 1) * limit;

  try {
    const { data, count, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, author_name, rating, comment, is_approved, admin_reply, admin_replied_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const productIds = Array.from(new Set((data ?? []).map((r) => r.product_id)));
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug')
      .in('id', productIds);

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));

    const reviewsWithProducts = (data ?? []).map((r) => ({
      ...r,
      product_title: productMap.get(r.product_id)?.title ?? 'Unknown',
      product_slug: productMap.get(r.product_id)?.slug ?? '',
    }));

    return NextResponse.json({
      reviews: reviewsWithProducts,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { reviewId, adminReply, isApproved } = body;

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};

    if (adminReply !== undefined) {
      const trimmed = String(adminReply).trim().slice(0, 2000);
      update.admin_reply = trimmed || null;
      update.admin_replied_at = trimmed ? new Date().toISOString() : null;
    }

    if (isApproved !== undefined) {
      update.is_approved = Boolean(isApproved);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .update(update)
      .eq('id', reviewId)
      .select('id, product_id, author_name, rating, comment, is_approved, admin_reply, admin_replied_at, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
