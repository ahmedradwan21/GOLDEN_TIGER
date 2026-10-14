'use client';

type ClickEventType = 'VISIT' | 'IMPRESSION' | 'VIEW' | 'CLICK' | 'ADD_TO_CART';

interface TrackEvent {
  eventType: ClickEventType;
  productId?: string;
  source?: string;
  path: string;
}

const SESSION_KEY = 'gt_sid';
const FLUSH_INTERVAL = 2000;
const MAX_BATCH = 50;

let sessionId: string | null = null;
let queue: TrackEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function getOrCreateSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === 'undefined') return '';

  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      sessionId = existing;
      return sessionId;
    }
  } catch {
    // ignore
  }

  sessionId = crypto.randomUUID();
  try {
    localStorage.setItem(SESSION_KEY, sessionId);
  } catch {
    // ignore
  }

  // Set cookie for server-side reads
  document.cookie = `${SESSION_KEY}=${sessionId}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;

  return sessionId;
}

function shouldTrack(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return false;
  // Skip known bots
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return false;
  return true;
}

function flush(): void {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  const payload = JSON.stringify({
    sessionId: getOrCreateSessionId(),
    events: batch,
  });

  // Try sendBeacon, fallback to fetch keepalive
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    const ok = navigator.sendBeacon('/api/track', blob);
    if (ok) return;
  }

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Re-queue on failure
    queue.unshift(...batch);
  });
}

export function track(eventType: ClickEventType, data: { productId?: string; source?: string } = {}): void {
  if (!shouldTrack()) return;
  queue.push({
    eventType,
    productId: data.productId,
    source: data.source,
    path: window.location.pathname,
  });

  if (!flushTimer) {
    flushTimer = setInterval(flush, FLUSH_INTERVAL);
  }
}

export function flushNow(): void {
  flush();
}

export function initTracker(): void {
  if (typeof window === 'undefined') return;
  getOrCreateSessionId();

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  };

  const handlePageHide = () => {
    flush();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
}
