import { NextRequest, NextResponse } from 'next/server';
import { getSuggestions } from '@/lib/data/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  if (!q.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await getSuggestions(q);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
