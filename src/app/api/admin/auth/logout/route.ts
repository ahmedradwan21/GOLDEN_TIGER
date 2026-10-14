import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/auth/session';

export async function POST() {
  clearAdminCookie();
  return NextResponse.json({ success: true });
}
