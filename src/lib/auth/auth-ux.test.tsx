import { beforeEach, expect, mock, test } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { authFailure, authErrorKey } from './errors';

let lookup: { data: any; error: any };
let inserted: { data: any; error: any };
let passwordValid = false;
let sessionCount = 0;
let insertCount = 0;
let lookupCount = 0;
const query = {
  select() { return this; }, eq() { return this; }, update() { return this; },
  insert() { insertCount++; return this; },
  async maybeSingle() { lookupCount++; return lookup; },
  async single() { return inserted; },
};
mock.module('@/lib/db-admin', () => ({ supabaseAdmin: { from: () => query } }));
mock.module('@/lib/auth/password', () => ({
  verifyPassword: async () => passwordValid,
  hashPassword: async () => 'test-hash',
}));
mock.module('@/lib/auth/session', () => ({
  createSessionCookie: async () => { sessionCount++; },
  createAdminCookie: async () => { sessionCount++; },
}));
const login = await import('../../app/api/auth/login/route');
const register = await import('../../app/api/auth/register/route');
const admin = await import('../../app/api/admin/auth/login/route');

beforeEach(() => {
  lookup = { data: null, error: null };
  inserted = { data: { id: 'user', email: 'customer@example.com' }, error: null };
  passwordValid = false;
  sessionCount = 0;
  insertCount = 0;
  lookupCount = 0;
});
function request(email = 'customer@example.com', password = 'test-password', ip = 'test-ip') {
  return new Request('http://localhost/api/auth', {
    method: 'POST', headers: { 'x-forwarded-for': ip },
    body: JSON.stringify({ email, password }),
  }) as any;
}

test('login distinguishes an unregistered email without creating a session', async () => {
  const response = await login.POST(request());
  expect(response.status).toBe(401);
  expect((await response.json()).code).toBe('EMAIL_NOT_REGISTERED');
  expect(sessionCount).toBe(0);
});
test('login distinguishes a wrong password without creating a session', async () => {
  lookup.data = { id: 'user', email: 'customer@example.com', password_hash: 'hash' };
  const response = await login.POST(request());
  expect(response.status).toBe(401);
  expect((await response.json()).code).toBe('WRONG_PASSWORD');
  expect(sessionCount).toBe(0);
});
test('valid login still creates the existing session', async () => {
  lookup.data = { id: 'user', email: 'customer@example.com', password_hash: 'hash' };
  passwordValid = true;
  expect((await login.POST(request())).status).toBe(200);
  expect(sessionCount).toBe(1);
});
test('database lookup failure is not reported as an unregistered email', async () => {
  lookup.error = { code: 'DB_UNAVAILABLE' };
  const response = await login.POST(request());
  expect(response.status).toBe(500);
  expect((await response.json()).code).toBe('SERVER_ERROR');
});
test('registration detects an existing email before inserting or creating a session', async () => {
  lookup.data = { id: 'user' };
  const response = await register.POST(request());
  expect(response.status).toBe(409);
  expect((await response.json()).code).toBe('EMAIL_ALREADY_REGISTERED');
  expect(insertCount).toBe(0);
  expect(sessionCount).toBe(0);
});
test('registration handles duplicate email conflicts during insert', async () => {
  inserted = { data: null, error: { code: '23505' } };
  const response = await register.POST(request());
  expect(response.status).toBe(409);
  expect((await response.json()).code).toBe('EMAIL_ALREADY_REGISTERED');
  expect(sessionCount).toBe(0);
});
test('registration lookup failure does not attempt an insert', async () => {
  lookup.error = { code: 'DB_UNAVAILABLE' };
  expect((await register.POST(request())).status).toBe(500);
  expect(insertCount).toBe(0);
});
test('successful registration retains existing session creation', async () => {
  expect((await register.POST(request())).status).toBe(200);
  expect(sessionCount).toBe(1);
});
test('existing admin IP limiter allows five attempts then blocks before lookup', async () => {
  for (let i = 0; i < 5; i++) {
    expect((await admin.POST(request(`ip-${i}@example.com`, 'test-password', 'limited-ip'))).status).toBe(401);
  }
  expect((await admin.POST(request('ip-6@example.com', 'test-password', 'limited-ip'))).status).toBe(429);
  expect(lookupCount).toBe(5);
});
test('existing admin email limiter blocks across different IPs', async () => {
  for (let i = 0; i < 5; i++) {
    expect((await admin.POST(request('limited-email@example.com', 'test-password', `email-ip-${i}`))).status).toBe(401);
  }
  expect((await admin.POST(request('limited-email@example.com', 'test-password', 'email-ip-6'))).status).toBe(429);
  expect(lookupCount).toBe(5);
});
test('existing admin rate window expires after fifteen minutes', async () => {
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  try {
    for (let i = 0; i < 5; i++) await admin.POST(request('window@example.com', 'test-password', 'window-ip'));
    expect((await admin.POST(request('window@example.com', 'test-password', 'window-ip'))).status).toBe(429);
    now += 15 * 60 * 1000 + 1;
    expect((await admin.POST(request('window@example.com', 'test-password', 'window-ip'))).status).toBe(401);
  } finally { Date.now = originalNow; }
});
test('429 responses retain localized rate-limit handling without an error code', () => {
  expect(authFailure({ error: 'Too many attempts' }, 429).code).toBe('RATE_LIMITED');
  expect(authErrorKey(authFailure({}, 429).code)).toBe('auth.error.rateLimited');
});
test('409 responses retain duplicate-email handling without an error code', () => {
  expect(authFailure({}, 409).code).toBe('EMAIL_ALREADY_REGISTERED');
});

// Exercise visibility using the real input, dictionary, and design-system Button.
const { PasswordInput } = await import('../../components/auth/PasswordInput');
const { I18nProvider } = await import('../../context/I18nContext');
test('password toggle reveals and hides the same typed value without submitting', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null, setItem: () => {} },
  });
  try {
  let view: ReturnType<typeof create> | undefined;
  act(() => { view = create(<I18nProvider><PasswordInput value="typed-password" readOnly /></I18nProvider>); });
  if (!view) throw new Error('Input did not render');
  const rendered = view;
  const input = () => rendered.root.findByType('input');
  const toggle = () => rendered.root.findByType('button');
  expect(input().props.type).toBe('password');
  expect(toggle().props.type).toBe('button');
  act(() => toggle().props.onClick());
  expect(input().props.type).toBe('text');
  expect(input().props.value).toBe('typed-password');
  act(() => toggle().props.onClick());
  expect(input().props.type).toBe('password');
  expect(input().props.value).toBe('typed-password');
  act(() => rendered.unmount());
  } finally {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});