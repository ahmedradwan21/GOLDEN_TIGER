import { expect, mock, test } from 'bun:test';
let admin = false;
let customer: { email:string } | null = null;
let count = 2;
let writes = 0;
let table = '';
let scope = '';
let slug = '';
const query = {
  select() { return this; }, order() { return this; },
  eq(key:string, value:string) { if (key === 'slug') slug = value; if (key === 'customer_email') scope = value; return this; },
  is() { return this; },
  insert() { writes++; return this; }, update() { writes++; return this; }, delete() {writes++;return this;}, upsert() {writes++;return this;},
  single: async () => ({data:{id:'saved'},error:null}),
  maybeSingle: async () => ({data:table==='categories'?{id:'cat'}:slug==='existing'?{id:'original'}:null,error:null}),
  then(resolve:any) { return Promise.resolve({data:[],error:null,count}).then(resolve); },
};
mock.module('@/lib/db-admin', () => ({supabaseAdmin:{from(name:string){table=name;return query;}}}));
mock.module('@/lib/brand-admin', () => ({ensureBrand: async (name:string) => name}));
mock.module('@/lib/auth/session', () => ({getAdminSession:async () => admin?{adminId:'a'}:null,getSession:async () => customer}));
mock.module('@/lib/data/catalog-settings', () => ({getDisplayCoupons:async (email?:string) => {scope=email??'public';return [];} }));
const brands = await import('../app/api/admin/brands/route');
const categories = await import('../app/api/admin/categories/route');
const coupons = await import('../app/api/admin/coupons/route');
const imports = await import('../app/api/admin/products/import/route');
const display = await import('../app/api/coupons/route');
const request = (body:unknown={}) => new Request('http://localhost', {method:'POST',body:JSON.stringify(body)}) as any;
test('every new admin endpoint requires an admin before reading or writing', async () => {
  admin=false;writes=0;
  for (const api of [brands,categories,coupons]) {
    expect((await api.GET()).status).toBe(401);
    expect((await api.POST(request())).status).toBe(401);
    expect((await api.PATCH(request())).status).toBe(401);
    expect((await api.DELETE(request())).status).toBe(401);
  }
  expect((await imports.GET()).status).toBe(401);
  expect((await imports.POST(request())).status).toBe(401);
  expect(writes).toBe(0);
});
test('category deletion refuses attached products and allows empty categories', async () => {
  admin=true;count=2;writes=0;
  const req = {nextUrl:new URL('http://localhost?id=cat')} as any;
  const blocked = await categories.DELETE(req);
  expect(blocked.status).toBe(409);expect((await blocked.json()).products_count).toBe(2);expect(writes).toBe(0);
  count=0;expect((await categories.DELETE(req)).status).toBe(200);expect(writes).toBe(1);
});
test('CSV API returns a real insert/update summary from uploaded multipart data', async () => {
  admin=true;writes=0;
  const template = await (await imports.GET()).text();
  const rows = ['new','existing'].map(slug => ['Watch',slug,'','','phones','1000','','1','','','','','',''].join(','));
  const form = new FormData();form.set('file',new File([template+rows.join('\r\n')],'products.csv'));
  const res = await imports.POST(new Request('http://localhost',{method:'POST',body:form}) as any);
  const summary = await res.json();
  expect(res.status).toBe(200);expect(summary).toEqual({imported:1,updated:1,skipped:0,errors:[]});expect(writes).toBe(2);
});
test('customer coupons derive the target email from the signed session only', async () => {
  customer=null;
  const req = {nextUrl:new URL('http://localhost?mine=1&email=other@example.com')} as any;
  expect((await display.GET(req)).status).toBe(401);
  customer={email:'owner@example.com'};
  expect((await display.GET(req)).status).toBe(200);expect(scope).toBe('owner@example.com');
});
