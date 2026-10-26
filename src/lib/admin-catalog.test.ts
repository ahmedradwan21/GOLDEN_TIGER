import { describe, expect, test } from 'bun:test';
import { couponSchema, brandSchema, categorySchema, couponTitle, couponAvailable } from './admin-catalog';
import { CSV_HEADERS, parseProductCSV, importProductRows } from './product-csv';
const csv = (rows: string[][]) => CSV_HEADERS.join(',') + '\r\n' + rows.map(row => row.map(v => '"'+v.replace(/"/g,'""')+'"').join(',')).join('\r\n');
const row = (slug: string, price='1000', category='electronics') => ['Watch',slug,'Tiger','',category,price,'','3','Short','Two lines\nSecond, "quoted" line','https://a.test/1.jpg|https://a.test/2.jpg','sale|new','ساعة','وصف'];
describe('admin catalog rules', () => {
  test('CSV retains quoted descriptions, Arabic and pipe-separated images/tags', () => {
    const result = parseProductCSV('\uFEFF'+csv([row('watch')]));
    expect(result[0].product?.description).toBe('Two lines\nSecond, "quoted" line');
    expect(result[0].product?.images).toEqual(['https://a.test/1.jpg','https://a.test/2.jpg']);
    expect(result[0].product?.tags).toEqual(['sale','new']);
    expect(result[0].product?.title_ar).toBe('ساعة');
  });
  test('CSV upserts by slug and counts successful inserts, updates and skipped rows', async () => {
    const saved = new Map<string, string>([['existing','p-original']]);
    const summary = await importProductRows(csv([row('new'),row('existing'),row('bad','-1'),row('missing','1000','unknown')]), {
      categoryId: async slug => slug === 'electronics' ? 'cat-1' : null,
      productId: async slug => saved.get(slug) ?? null,
      save: async p => { saved.set(p.slug,p.id); },
    });
    expect(summary.imported).toBe(1); expect(summary.updated).toBe(1); expect(summary.skipped).toBe(2);
    expect(saved.get('existing')).toBe('p-original');
    expect(summary.errors.map(e => e.row)).toEqual([6,8]);
  });
  test('database row errors are skipped and reported', async () => {
    const summary = await importProductRows(csv([row('fail')]), { categoryId: async () => 'cat', productId: async () => null, save: async () => {throw new Error('Duplicate SKU');} });
    expect(summary).toEqual({imported:0,updated:0,skipped:1,errors:[{row:2,message:'Duplicate SKU'}]});
  });
  test('malformed column rows are skipped with their row number', () => {
    expect(parseProductCSV(CSV_HEADERS.join(',')+'\nwatch,watch\n')[0]).toEqual({row:2,error:'Incorrect number of columns',product:null});
  });
  test('all required template headers are enforced', () => {
    expect(() => parseProductCSV('title,slug\nWatch,watch')).toThrow('CSV headers');
  });
  test('coupon percentage is capped at 100', () => {
    expect(couponSchema.safeParse({code:'P',discount_type:'percentage',value:101}).success).toBe(false);
    expect(couponSchema.parse({code:'P',discount_type:'percentage',value:100}).value).toBe(100);
  });
  test('fixed discounts retain integer cents', () => {
    expect(couponSchema.parse({code:'F',discount_type:'fixed',value:1250}).value).toBe(1250);
  });
  test('targeted emails normalize and invalid emails are rejected', () => {
    expect(couponSchema.parse({code:'E',discount_type:'fixed',value:0,customer_email:'Test@Example.com'}).customer_email).toBe('test@example.com');
    expect(couponSchema.safeParse({code:'E',discount_type:'fixed',value:0,customer_email:'invalid'}).success).toBe(false);
  });
  test('expired and exhausted coupons are not displayed', () => {
    const now = Date.parse('2026-10-25T20:31:00Z');
    expect(couponAvailable({expires_at:'2026-10-24T00:00:00Z',max_uses:null,uses_count:0},now)).toBe(false);
    expect(couponAvailable({expires_at:null,max_uses:2,uses_count:2},now)).toBe(false);
    expect(couponAvailable({expires_at:null,max_uses:null,uses_count:20},now)).toBe(true);
  });
  test('coupon Arabic titles fall back to English', () => {
    expect(couponTitle({code:'C',title_en:'Reward',title_ar:'مكافأة'},'ar')).toBe('مكافأة');
    expect(couponTitle({code:'C',title_en:'Reward',title_ar:'  '},'ar')).toBe('Reward');
  });
  test('brand fields preserve Arabic, ordering and active flag', () => {
    expect(brandSchema.parse({name_en:'Tiger',name_ar:'النمر',slug:'tiger',logo_url:'https://a.test/logo.png',sort_order:3,is_active:false})).toMatchObject({name_ar:'النمر',sort_order:3,is_active:false});
  });
  test('category forms retain Arabic names', () => {
    expect(categorySchema.parse({name:'Phones',name_ar:'هواتف',slug:'phones'}).name_ar).toBe('هواتف');
  });
});
