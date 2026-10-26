import { parse } from 'csv-parse/sync';
import { z } from 'zod';

export const CSV_HEADERS = ['title','slug','brand','sku','category_slug','price_cents','compare_at_cents','stock','short_description','description','images','tags','title_ar','description_ar'] as const;
export const CSV_TEMPLATE = CSV_HEADERS.join(',') + '\r\n';
const integer = (value: string, field: string, optional = false) => {
  if (!value.trim() && optional) return null;
  if (!/^\d+$/.test(value.trim())) throw new Error(`${field} must be a non-negative integer`);
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`${field} is too large`);
  return number;
};
const required = (value: string, field: string) => {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
};
export function parseProductCSV(text: string) {
  const records = parse(text, {
    bom: true, skip_empty_lines: true, relax_column_count: true, info: true,
  }) as unknown as { record: string[]; info: { lines: number; empty_lines: number } }[];
  const headers = records.shift()?.record.map(h => h.trim());
  if (!headers || CSV_HEADERS.some(h => !headers.includes(h)) || new Set(headers).size !== headers.length) {
    throw new Error('CSV headers must match the downloadable template');
  }
  let nextLine = 2;
  let emptyLines = 0;
  return records.map(({ record, info }) => {
    const row = nextLine + info.empty_lines - emptyLines;
    emptyLines = info.empty_lines;
    nextLine = info.lines + 1;
    if (record.length !== headers.length) return { row, error: 'Incorrect number of columns', product: null };
    try {
      const values = Object.fromEntries(headers.map((h, i) => [h, record[i] ?? '']));
      const images = values.images.split('|').map(v => v.trim()).filter(Boolean);
      for (const image of images) z.string().url().refine(v => /^https?:\/\//i.test(v)).parse(image);
      return { row, error: null, product: {
        title: required(values.title, 'title'), slug: required(values.slug, 'slug'),
        category_slug: required(values.category_slug, 'category_slug'),
        brand: values.brand.trim() || null, sku: values.sku.trim() || null,
        price_cents: integer(values.price_cents, 'price_cents') as number,
        compare_at_cents: integer(values.compare_at_cents, 'compare_at_cents', true),
        stock: integer(values.stock, 'stock') as number,
        short_description: values.short_description.trim() || null, description: values.description,
        title_ar: values.title_ar, description_ar: values.description_ar, images,
        tags: values.tags.split('|').map(v => v.trim()).filter(Boolean),
      } };
    } catch (e) { return { row, error: e instanceof Error ? e.message : 'Invalid row', product: null }; }
  });
}

export async function importProductRows(text: string, store: {
  categoryId: (slug: string) => Promise<string | null>;
  productId: (slug: string) => Promise<string | null>;
  save: (product: NonNullable<ReturnType<typeof parseProductCSV>[number]['product']> & { id: string; category_id: string }) => Promise<void>;
}) {
  const summary = { imported: 0, updated: 0, skipped: 0, errors: [] as { row: number; message: string }[] };
  for (const entry of parseProductCSV(text)) {
    try {
      if (!entry.product) throw new Error(entry.error ?? 'Invalid row');
      const category_id = await store.categoryId(entry.product.category_slug);
      if (!category_id) throw new Error(`Unknown category_slug: ${entry.product.category_slug}`);
      const existing = await store.productId(entry.product.slug);
      await store.save({ ...entry.product, id: existing ?? `p-${crypto.randomUUID()}`, category_id });
      if (existing) summary.updated++; else summary.imported++;
    } catch (e) {
      summary.skipped++;
      summary.errors.push({ row: entry.row, message: e instanceof Error ? e.message : 'Unable to import row' });
    }
  }
  return summary;
}
