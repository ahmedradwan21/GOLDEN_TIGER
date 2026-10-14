import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';

const trackEventSchema = z.object({
  eventType: z.enum(['VISIT', 'IMPRESSION', 'VIEW', 'CLICK', 'ADD_TO_CART']),
  productId: z.string().optional(),
  source: z.string().optional(),
  path: z.string().min(1).max(500),
});

const trackSchema = z.object({
  sessionId: z.string().min(1).max(100),
  events: z.array(trackEventSchema).min(1).max(50),
});

const BOT_PATTERNS = /bot|crawler|spider|crawling|slurp|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot/i;

const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function deriveDeviceType(ua: string): string {
  if (/mobile|android.*mobile|iphone|ipod/i.test(ua)) return 'mobile';
  if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) return 'tablet';
  return 'desktop';
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return new NextResponse(null, { status: 429 });
    }

    const userAgent = req.headers.get('user-agent') ?? '';
    if (BOT_PATTERNS.test(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 20480) {
      return new NextResponse(null, { status: 413 });
    }

    const body = await req.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse(null, { status: 400 });
    }

    const { sessionId, events } = parsed.data;
    const deviceType = deriveDeviceType(userAgent);
    const referrer = req.headers.get('referer') ?? null;

    const rows = events.map((e) => ({
      event_type: e.eventType,
      product_id: e.productId ?? null,
      session_id: sessionId,
      path: e.path,
      source: e.source ?? null,
      referrer,
      user_agent: userAgent.slice(0, 500),
      device_type: deviceType,
    }));

    const { error } = await supabase.from('click_logs').insert(rows);
    if (error) {
      return new NextResponse(null, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
