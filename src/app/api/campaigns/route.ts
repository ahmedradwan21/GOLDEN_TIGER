import { NextResponse } from 'next/server';
import { getAllCampaigns } from '@/lib/data/campaigns';

export const dynamic = 'force-dynamic';

// Public read used by the homepage campaign banner (moved out of /api/admin so admin routes are all gated).
export async function GET() {
  try {
    return NextResponse.json({ campaigns: await getAllCampaigns() });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}
