import { sessionMockBase } from '@/test/session-mock';
import { beforeEach, expect, mock, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

let rpcResult: { data: any; error: any } | 'throw' = { data: true, error: null };
let userRow: any = null;
const lookups: string[] = [];

mock.module('@/lib/db-admin', () => ({
  supabaseAdmin: {
    rpc: async () => { if (rpcResult === 'throw') throw new Error('boom'); return rpcResult; },
    from: () => {
      const q: any = {
        select: () => q,
        eq: (_k: string, v: string) => { lookups.push(v); return q; },
        maybeSingle: async () => ({ data: userRow, error: null }),
      };
      return q;
    },
  },
}));
mock.module('@/lib/auth/session', () => ({ ...sessionMockBase,
  getSession: async () => null,
  getAdminSession: async () => null,
  createSessionCookie: async () => {},
}));

beforeEach(() => { rpcResult = { data: true, error: null }; userRow = null; lookups.length = 0; });

const loginReq = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/auth/login', { method: 'POST', body: JSON.stringify(body), headers }) as any;

test('rate-limit helper: allows, blocks, fails closed by default and parses client IP', async () => {
  const { rateLimitHit, getClientIp, rateLimitedResponse } = await import('./rate-limit');
  expect(await rateLimitHit('k', 5, 60)).toBe(true);
  rpcResult = { data: false, error: null };
  expect(await rateLimitHit('k', 5, 60)).toBe(false);
  rpcResult = { data: null, error: { message: 'db down' } };
  expect(await rateLimitHit('k', 5, 60)).toBe(false);
  expect(await rateLimitHit('k', 5, 60, { failClosed: false })).toBe(true);
  rpcResult = 'throw';
  expect(await rateLimitHit('k', 5, 60)).toBe(false);
  expect(getClientIp(new Request('http://x', { headers: { 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8' } }))).toBe('1.2.3.4');
  expect(getClientIp(new Request('http://x'))).toBe('unknown');
  expect(rateLimitedResponse().status).toBe(429);
});

test('email normalization trims and lowercases, and login looks up the normalized email', async () => {
  const { normalizeEmail } = await import('./auth/email');
  expect(normalizeEmail('  Foo.Bar@Example.COM ')).toBe('foo.bar@example.com');
  expect(normalizeEmail(null)).toBe('');
  const { POST } = await import('../app/api/auth/login/route');
  await POST(loginReq({ email: '  Foo@Example.COM ', password: 'x' }));
  expect(lookups).toContain('foo@example.com');
});

test('login returns the same generic error for unknown email and wrong password', async () => {
  const { POST } = await import('../app/api/auth/login/route');
  const unknown = await POST(loginReq({ email: 'nobody@example.com', password: 'whatever' }));
  userRow = { id: 'u1', email: 'a@example.com', name: 'A', password_hash: bcrypt.hashSync('right-password', 4) };
  const wrong = await POST(loginReq({ email: 'a@example.com', password: 'wrong-password' }));
  expect(unknown.status).toBe(401);
  expect(wrong.status).toBe(401);
  const [a, b] = [await unknown.json(), await wrong.json()];
  expect(a).toEqual(b);
  expect(a.code).toBe('INVALID_CREDENTIALS');
});

test('origin check rejects cross-site state-changing requests only', async () => {
  const { isOriginAllowed, checkOrigin } = await import('./api/origin');
  const r = (method: string, headers: Record<string, string>) => new Request('http://shop.test/api/x', { method, headers });
  expect(isOriginAllowed(r('POST', { host: 'shop.test', origin: 'https://shop.test' }))).toBe(true);
  expect(isOriginAllowed(r('POST', { host: 'shop.test' }))).toBe(true);
  expect(isOriginAllowed(r('GET', { host: 'shop.test', origin: 'https://evil.test' }))).toBe(true);
  for (const m of ['POST', 'PATCH', 'PUT', 'DELETE']) {
    expect(checkOrigin(r(m, { host: 'shop.test', origin: 'https://evil.test' }))?.status).toBe(403);
  }
  expect(isOriginAllowed(r('POST', { host: 'shop.test', origin: 'null' }))).toBe(false);
});

test('every /api/admin route (except auth/login, auth/logout) returns 401 without an admin session', async () => {
  const root = join(import.meta.dir, '../app/api/admin');
  const files: string[] = [];
  const walk = (d: string) => readdirSync(d).forEach((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p); else if (f === 'route.ts') files.push(p);
  });
  walk(root);
  const skip = ['auth/login', 'auth/logout'].map((s) => join(root, s, 'route.ts'));
  const checked = files.filter((f) => !skip.includes(f));
  expect(checked.length).toBeGreaterThan(20);
  const results: string[] = [];
  for (const f of checked) {
    expect(readFileSync(f, 'utf8')).not.toContain('getAdminSession');
    const mod: any = await import(f);
    for (const m of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']) {
      if (typeof mod[m] !== 'function') continue;
      const { NextRequest } = await import('next/server');
      const r = new NextRequest('http://localhost/api/admin/x?id=1', {
        method: m, headers: { host: 'localhost' }, ...(m === 'GET' ? {} : { body: '{}' }),
      });
      const res = await mod[m](r, { params: { id: '1' } });
      if (res.status !== 401) results.push(`${f.replace(root, '')} ${m} -> ${res.status}`);
    }
  }
  expect(results).toEqual([]);
});
