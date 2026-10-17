import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageKey = searchParams.get('pageKey');

  if (!pageKey) {
    return NextResponse.json({ error: 'Missing pageKey' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('site_content')
    .select('id, page_key, title_en, title_ar, body_en, body_ar, updated_at')
    .eq('page_key', pageKey)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: data });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { pageKey, titleEn, titleAr, bodyEn, bodyAr } = body;

    if (!pageKey) {
      return NextResponse.json({ error: 'Missing pageKey' }, { status: 400 });
    }

    const update = {
      title_en: String(titleEn ?? '').slice(0, 500),
      title_ar: String(titleAr ?? '').slice(0, 500),
      body_en: String(bodyEn ?? ''),
      body_ar: String(bodyAr ?? ''),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('site_content')
      .update(update)
      .eq('page_key', pageKey)
      .select('id, page_key, title_en, title_ar, body_en, body_ar, updated_at')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ content: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
