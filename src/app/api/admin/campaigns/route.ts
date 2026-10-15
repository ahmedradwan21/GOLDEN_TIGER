import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { getAllCampaigns, updateCampaign } from '@/lib/data/campaigns';

export async function GET() {
  try {
    const campaigns = await getAllCampaigns();
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ campaigns: [] }, { status: 200 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, isActive, discountPercentage, startsAt, endsAt } = body;

    if (!type) {
      return NextResponse.json({ error: 'Campaign type required' }, { status: 400 });
    }

    const campaign = await updateCampaign(type, {
      isActive,
      discountPercentage,
      startsAt,
      endsAt,
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}
