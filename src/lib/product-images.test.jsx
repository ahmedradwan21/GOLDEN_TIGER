import { afterEach, describe, expect, mock, test } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { normalizeProductImages } from './product-images';
import { mapProductRow } from './data/mappers';

mock.module('@/context/I18nContext', () => ({ useI18n: () => ({ locale: 'en', dir: 'ltr', t: key => ({'gallery.viewImage': 'View image'}[key] ?? key) }) }));
mock.module('next/image', () => ({
  default: (props) => {
    if (typeof props.src !== 'string' || !props.src) throw new Error('Invalid image source');
    return React.createElement('img', props);
  },
}));

let row = { id: 'test', images: null };
let saved;
const query = {
  select() { return this; }, order() { return this; }, range() { return this; },
  eq() { return this; }, or() { return this; },
  insert(value) { saved = value; return this; },
  update(value) { saved = value; return this; },
  maybeSingle: async () => ({ data: row, error: null }),
  single: async () => ({ data: row, error: null }),
  then(resolve) { return Promise.resolve({ data: [row], count: 1, error: null }).then(resolve); },
};
mock.module('@/lib/brand-admin', () => ({ ensureBrand: async name => name }));
mock.module('@/lib/db-admin', () => ({ supabaseAdmin: { from: () => query } }));
mock.module('@/lib/auth/session', () => ({ getAdminSession: async () => ({ id: 'admin' }) }));

const { ProductGallery } = await import('../components/product/ProductGallery');
const listApi = await import('../app/api/admin/products/route');
const itemApi = await import('../app/api/admin/products/[id]/route');
const valid = '/products/example.jpg';
let gallery;
afterEach(() => { if (gallery) act(() => gallery.unmount()); gallery = undefined; });

describe('product image safety', () => {
  for (const input of [undefined, null, [], '', {}, [undefined, null, {}, 42, '', 'bad-url', '//host/image', 'javascript:alert(1)']]) {
    test(`missing or malformed image collection defaults to []: ${JSON.stringify(input)}`, () => {
      expect(normalizeProductImages(input)).toEqual([]);
      expect(mapProductRow({ images: input }).images).toEqual([]);
      act(() => { gallery = create(React.createElement(ProductGallery, { images: input, title: 'Product' })); });
      expect(gallery.root.findAllByType('img').length).toBe(0);
    });
  }

  test('keeps valid image strings and discards malformed entries', () => {
    expect(normalizeProductImages([null, ` ${valid} `, {}, 'https://example.com/image.jpg', 'http://example.com/image.jpg']))
      .toEqual([valid, 'https://example.com/image.jpg', 'http://example.com/image.jpg']);
  });

  test('selection stays safe when images shrink, disappear, and return', () => {
    act(() => { gallery = create(React.createElement(ProductGallery, { images: [valid, '/second.jpg'], title: 'Product' })); });
    act(() => gallery.root.findByProps({ 'aria-label': 'View image 2' }).props.onClick());
    act(() => gallery.update(React.createElement(ProductGallery, { images: [valid], title: 'Product' })));
    expect(gallery.root.findAllByType('img')[0].props.src).toBe(valid);
    act(() => gallery.update(React.createElement(ProductGallery, { images: null, title: 'Product' })));
    act(() => gallery.root.findByProps({ role: 'img' }).props.onKeyDown({ key: 'ArrowRight' }));
    expect(gallery.root.findAllByType('img').length).toBe(0);
    act(() => gallery.update(React.createElement(ProductGallery, { images: [valid], title: 'Product' })));
    expect(gallery.root.findAllByType('img')[0].props.src).toBe(valid);
  });

  test('a failed image load removes the unusable image without crashing', () => {
    act(() => { gallery = create(React.createElement(ProductGallery, { images: [valid], title: 'Product' })); });
    act(() => gallery.root.findAllByType('img')[0].props.onError());
    expect(gallery.root.findAllByType('img').length).toBe(0);
  });

  test('product list and detail API always return image arrays', async () => {
    for (const input of [undefined, null, [null, {}], [valid]]) {
      row = { id: 'test', images: input };
      const list = await (await listApi.GET(new Request('http://localhost/api/admin/products'))).json();
      const detail = await (await itemApi.GET(new Request('http://localhost'), { params: { id: 'test' } })).json();
      expect(list.products[0].images).toEqual(normalizeProductImages(input));
      expect(detail.images).toEqual(normalizeProductImages(input));
    }
  });

  test('product creation and update normalize null and malformed images', async () => {
    row = { id: 'test', images: null };
    const request = (images) => new Request('http://localhost', { method: 'POST', body: JSON.stringify({ images }) });
    const created = await (await listApi.POST(request(null))).json();
    expect(saved.images).toEqual([]);
    expect(created.images).toEqual([]);
    const updated = await (await itemApi.PATCH(request([null, valid, {}]), { params: { id: 'test' } })).json();
    expect(saved.images).toEqual([valid]);
    expect(updated.images).toEqual([]);
  });
});