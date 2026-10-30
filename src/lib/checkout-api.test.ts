import { sessionMockBase } from '@/test/session-mock';
import { beforeEach, expect, mock, test } from 'bun:test';

type Call = { table: string; op: string; payload?: any; filters: [string, string, any][] };
type Result = { data: any; error: any };
const calls: Call[] = [];
let handler: (c: Call) => Result = () => ({ data: null, error: null });

const from = (table: string) => {
  const c: Call = { table, op: 'select', filters: [] };
  const done = () => { calls.push(c); return handler(c); };
  const filter = (kind: string) => (k: string, v: any) => { c.filters.push([kind, k, v]); return q; };
  const q: any = {
    select() { return q; },
    insert(p: any) { c.op = 'insert'; c.payload = p; return q; },
    update(p: any) { c.op = 'update'; c.payload = p; return q; },
    delete() { c.op = 'delete'; return q; },
    eq: filter('eq'), is: filter('is'), in: filter('in'), gte: filter('gte'),
    order() { return q; },
    limit() { return q; },
    maybeSingle: async () => done(),
    single: async () => done(),
    then(res: any, rej: any) { return Promise.resolve(done()).then(res, rej); },
  };
  return q;
};
mock.module('@/lib/db-admin', () => ({
  supabaseAdmin: { from, rpc: async () => ({ data: true, error: null }) },
}));
mock.module('@/lib/auth/session', () => ({ ...sessionMockBase, getSession: async () => null }));
mock.module('@/lib/data/shipping-methods', () => ({ getShippingPriceCents: async () => 5000 }));
mock.module('@/lib/telegram-order', () => ({ sendOrderTelegram: async () => {} }));
mock.module('@/lib/data/coupons', () => ({
  findUsableCoupon: async () => ({ ok: false, error: 'not_found' }),
  redeemCoupon: async () => true,
  releaseCoupon: async () => {},
}));

const req = (body: unknown) => new Request('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify(body) }) as any;
const ctx = { params: { orderId: 'order-1' } };
const openOrder = { id: 'order-1', session_id: 'sid-ok', status: 'CHECKOUT_STARTED', order_number: null, delivery_method: null, user_id: null, shipping_cents: 0 };
const address = {
  fullName: 'Ahmed Tarek', email: 'a@x.com', phone: '01012345678', addressLine1: '12 Nile St', addressLine2: '',
  city: 'Cairo', stateOrRegion: 'Cairo', postalCode: '', country: 'Egypt', landmark: 'Near the mosque',
};
const updates = (table = 'orders') => calls.filter((c) => c.table === table && c.op === 'update');

beforeEach(() => { calls.length = 0; handler = () => ({ data: null, error: null }); });

test('order numbers are GT-YYYYMMDD- + 10 chars from a CSPRNG alphabet without 0/O/1/I', async () => {
  const { generateOrderNumber } = await import('./payments/mockGateway');
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const n = generateOrderNumber(new Date(2026, 9, 30));
    expect(n).toMatch(/^GT-20261030-[A-HJ-NP-Z2-9]{10}$/);
    seen.add(n);
  }
  expect(seen.size).toBe(500);
});

test('PATCH with a sessionId that does not own the order returns 404 and updates nothing', async () => {
  const { PATCH } = await import('../app/api/checkout/[orderId]/route');
  handler = (c) => (c.table === 'orders' ? { data: openOrder, error: null } : { data: null, error: null });
  expect((await PATCH(req({ sessionId: 'someone-else', email: 'a@x.com' }), ctx)).status).toBe(404);
  expect((await PATCH(req({ email: 'a@x.com' }), ctx)).status).toBe(400); // sessionId is required
  expect(updates().length).toBe(0);
});

test('PATCH rejects an inactive/unknown delivery method and an invalid address', async () => {
  const { PATCH } = await import('../app/api/checkout/[orderId]/route');
  handler = (c) => (c.table === 'orders' ? { data: openOrder, error: null } : { data: null, error: null });
  expect((await PATCH(req({ sessionId: 'sid-ok', deliveryMethod: 'teleport' }), ctx)).status).toBe(400);
  expect((await PATCH(req({ sessionId: 'sid-ok', shippingAddress: { ...address, fullName: 'x'.repeat(101) } }), ctx)).status).toBe(400);
  expect((await PATCH(req({ sessionId: 'sid-ok', shippingAddress: { ...address, phone: '123' } }), ctx)).status).toBe(400);
  expect(updates().length).toBe(0);
});

test('PATCH with the owner sessionId and an active method saves the server price, scoped to the session', async () => {
  const { PATCH } = await import('../app/api/checkout/[orderId]/route');
  handler = (c) => {
    if (c.table === 'orders' && c.op === 'select') return { data: openOrder, error: null };
    if (c.table === 'shipping_methods') return { data: { id: 'express', price_cents: 7500 }, error: null };
    if (c.table === 'order_items') return { data: [{ unit_price_cents: 10000, quantity: 2 }], error: null };
    return { data: [{ id: 'order-1' }], error: null };
  };
  const res = await PATCH(req({ sessionId: 'sid-ok', shippingAddress: { ...address, evil: 'x' }, deliveryMethod: 'express' }), ctx);
  expect(res.status).toBe(200);
  const u = updates()[0]!;
  expect(u.payload.shipping_cents).toBe(7500);
  expect(u.payload.delivery_method).toBe('express');
  expect(u.payload.shipping_address.evil).toBeUndefined();
  expect(u.filters).toContainEqual(['eq', 'session_id', 'sid-ok']);
});

test('start rejects missing and unpublished products with 400 and never creates the order', async () => {
  const { POST } = await import('../app/api/checkout/start/route');
  handler = (c) => {
    if (c.table === 'products') return { data: [
      { id: 'p-ok', title: 'Lamp', images: [], price_cents: 9900, is_published: true },
      { id: 'p-hidden', title: 'Old', images: [], price_cents: 5000, is_published: false },
    ], error: null };
    return { data: null, error: null };
  };
  const res = await POST(req({ sessionId: 'sid-ok', items: [
    { productId: 'p-ok', quantity: 1 }, { productId: 'p-gone', quantity: 2 }, { productId: 'p-hidden', quantity: 1 },
  ] }));
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.items.map((i: any) => i.productId).sort()).toEqual(['p-gone', 'p-hidden']);
  expect(calls.filter((c) => c.op === 'insert' || c.op === 'update' || c.op === 'delete').length).toBe(0);
});

test('checkout responses never include raw database error messages', async () => {
  const { POST } = await import('../app/api/checkout/start/route');
  handler = (c) => (c.table === 'products'
    ? { data: null, error: { code: '42P01', message: 'relation "secret_products" does not exist' } }
    : { data: null, error: null });
  const res = await POST(req({ sessionId: 'sid-ok', items: [{ productId: 'p1', quantity: 1 }] }));
  expect(res.status).toBe(500);
  const text = await res.text();
  expect(text).not.toContain('secret_products');
  expect(text).not.toContain('42P01');
});

function completeHandler(collisions: number) {
  let claimAttempts = 0;
  const h = (c: Call): Result => {
    if (c.table === 'orders' && c.op === 'select') return { data: openOrder, error: null };
    if (c.table === 'order_items') return { data: [{ product_id: 'p1', title_snapshot: 'Lamp', quantity: 1, unit_price_cents: 9900 }], error: null };
    if (c.table === 'products') return { data: [{ id: 'p1', title: 'Lamp', price_cents: 9900, stock: 5, is_published: true }], error: null };
    if (c.table === 'orders' && c.op === 'update' && 'order_number' in c.payload && c.payload.order_number) {
      claimAttempts++;
      if (claimAttempts <= collisions) return { data: null, error: { code: '23505', message: 'duplicate key orders_order_number_key' } };
    }
    return { data: [{ id: 'order-1' }], error: null };
  };
  return { h, attempts: () => claimAttempts };
}

test('complete retries with a new order number on 23505 collisions (up to 3 retries)', async () => {
  const { POST } = await import('../app/api/checkout/[orderId]/complete/route');
  const ok = completeHandler(3);
  handler = ok.h;
  const res = await POST(req({ sessionId: 'sid-ok', paymentMethod: 'cod' }), ctx);
  expect(res.status).toBe(200);
  expect(ok.attempts()).toBe(4);
  const numbers = updates().filter((u) => u.payload.order_number).map((u) => u.payload.order_number);
  expect(new Set(numbers).size).toBe(4);
  expect((await res.json()).orderNumber).toBe(numbers.at(-1));

  calls.length = 0;
  const fail = completeHandler(99);
  handler = fail.h;
  const res2 = await POST(req({ sessionId: 'sid-ok', paymentMethod: 'cod' }), ctx);
  expect(res2.status).toBe(500);
  expect(fail.attempts()).toBe(4);
  expect(await res2.text()).not.toContain('orders_order_number_key');
});

const sellable = [{ id: 'p1', title: 'Ring', images: [], price_cents: 1000, is_published: true }];
const startBody = { sessionId: 'sid-ok', items: [{ productId: 'p1', quantity: 2 }] };

test('start reuses the newest open order when the session already has several (no crash)', async () => {
  const { POST } = await import('../app/api/checkout/start/route');
  handler = (c) => {
    if (c.table === 'products') return { data: sellable, error: null };
    if (c.table === 'orders' && c.op === 'select') return { data: [{ id: 'newest' }, { id: 'older' }], error: null };
    return { data: null, error: null };
  };
  const res = await POST(req(startBody));
  expect(res.status).toBe(200);
  expect((await res.json()).orderId).toBe('newest');
  expect(calls.some((c) => c.table === 'orders' && c.op === 'insert')).toBe(false);
});

test('start reuses the concurrent open order when insert hits a 23505 unique violation', async () => {
  const { POST } = await import('../app/api/checkout/start/route');
  let selects = 0;
  handler = (c) => {
    if (c.table === 'products') return { data: sellable, error: null };
    if (c.table === 'orders' && c.op === 'select') return { data: selects++ === 0 ? [] : [{ id: 'winner' }], error: null };
    if (c.table === 'orders' && c.op === 'insert') return { data: null, error: { code: '23505', message: 'dup' } };
    return { data: null, error: null };
  };
  const res = await POST(req(startBody));
  expect(res.status).toBe(200);
  expect((await res.json()).orderId).toBe('winner');
  const items = calls.find((c) => c.table === 'order_items' && c.op === 'insert');
  expect(items?.payload[0].order_id).toBe('winner');
});
