import { sessionMockBase } from '@/test/session-mock';
import { expect, mock, test } from 'bun:test';

let admin = false;
const inserts: { table: string; row: any }[] = [];
const query = (table: string) => {
  const q: any = {
    select() { return q; }, order() { return q; }, eq() { return q; }, not() { return q; }, range() { return q; },
    limit() { return q; }, ilike() { return q; }, update() { return q; }, delete() { return q; },
    insert(row: any) { inserts.push({ table, row }); return q; },
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: { id: 'new', ...inserts.at(-1)?.row }, error: null }),
    then(resolve: any) { return Promise.resolve({ data: [], error: null }).then(resolve); },
  };
  return q;
};
mock.module('@/lib/db-admin', () => ({ supabaseAdmin: { from: (t: string) => query(t) } }));
mock.module('@/lib/auth/session', () => ({ ...sessionMockBase, getAdminSession: async () => (admin ? { adminId: 'a' } : null) }));

const req = (body: unknown, method = 'POST') =>
  Object.assign(new Request('http://localhost/api/admin/affiliates', { method, body: JSON.stringify(body) }), {
    nextUrl: new URL('http://localhost/api/admin/affiliates?id=x'),
  }) as any;

test('affiliate endpoints refuse non-admins before touching the database', async () => {
  const api = await import('../app/api/admin/affiliates/route');
  const report = await import('../app/api/admin/affiliates/report/route');
  admin = false;
  inserts.length = 0;
  expect((await api.GET()).status).toBe(401);
  expect((await api.POST(req({ name: 'A', commission_percent: 5 }))).status).toBe(401);
  expect((await api.PUT(req({ id: 'x', name: 'A', commission_percent: 5 }, 'PUT'))).status).toBe(401);
  expect((await api.DELETE(req(null, 'DELETE'))).status).toBe(401);
  expect((await report.GET(req(null, 'GET'))).status).toBe(401);
  expect(inserts.length).toBe(0);
});

test('creating an affiliate inserts a 10% non-reward coupon with no expiry and links its code', async () => {
  const api = await import('../app/api/admin/affiliates/route');
  admin = true;
  inserts.length = 0;
  const res = await api.POST(req({ name: 'Ahmed Tarek', commission_percent: 12 }));
  expect(res.status).toBe(201);
  const coupon = inserts.find((i) => i.table === 'coupons')!.row;
  const affiliate = inserts.find((i) => i.table === 'affiliates')!.row;
  expect(coupon.code).toMatch(/^AHMEDTAREK-[A-Z2-9]{4}$/);
  expect(coupon.discount_type).toBe('percentage');
  expect(coupon.value).toBe(10);
  expect(coupon.is_reward).toBe(false);
  expect(coupon.expires_at).toBeNull();
  expect(affiliate.coupon_code).toBe(coupon.code);
});
