import { NextResponse } from 'next/server';
import { getAnnouncementSettings } from '@/lib/data/announcement';
import { EMPTY_ANNOUNCEMENT } from '@/lib/announcement';

export const dynamic = 'force-dynamic';

// Public storefront read: returns only the bar's display fields.
export async function GET() {
  const settings = await getAnnouncementSettings();
  const body = settings && settings.is_active ? settings : { ...EMPTY_ANNOUNCEMENT };
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
  });
}
