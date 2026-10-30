import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isOriginAllowed, forbiddenOriginResponse } from '@/lib/api/origin';

// Applies the CSRF Origin check to every state-changing API route (admin + customer).
export function middleware(req: NextRequest) {
  if (!isOriginAllowed(req)) return forbiddenOriginResponse();
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
