import { NextResponse } from 'next/server';

const GENERIC: Record<number, string> = {
  400: 'Request could not be processed',
  500: 'Something went wrong. Please try again.',
};

/** Logs the real error server-side and returns a generic JSON error (never raw DB messages/stacks). */
export function serverError(err: unknown, status = 500, context = 'api'): NextResponse {
  const e = err as { message?: string; code?: string; stack?: string } | null;
  console.error(`[${context}]`, e?.code ?? '', e?.message ?? String(err), e?.stack ?? '');
  return NextResponse.json({ error: GENERIC[status] ?? GENERIC[500] }, { status });
}
