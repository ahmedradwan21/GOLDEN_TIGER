import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getClientIp, rateLimitHit, rateLimitedResponse } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, author_name, rating, comment, admin_reply, admin_replied_at, created_at')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return serverError(error, 500);
    }

    return NextResponse.json({ reviews: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitHit(`review:ip:${getClientIp(req)}`, 5, 60 * 60))) return rateLimitedResponse();

    const body = await req.json();
    const { productId, authorName, rating, comment } = body;

    if (!productId || !authorName || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const trimmedName = String(authorName).trim().slice(0, 100);
    const trimmedComment = String(comment).trim().slice(0, 2000);

    if (trimmedName.length < 1 || trimmedComment.length < 1) {
      return NextResponse.json({ error: 'Name and comment cannot be empty' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        author_name: trimmedName,
        rating: parsedRating,
        comment: trimmedComment,
        is_approved: true,
      })
      .select('id, author_name, rating, comment, admin_reply, admin_replied_at, created_at')
      .single();

    if (error) {
      return serverError(error, 500);
    }

    return NextResponse.json({ review: data });
  } catch {
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
