import 'server-only';
import type { Product, SearchParams, SearchResponse, ProductCardData } from '@/types';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { ensureDatabaseConfigured } from '@/lib/env';
import { mapProductRow, type ProductRow } from './mappers';
import { normalizeProductImages } from '@/lib/product-images';

/**
 * Full-text search using Postgres trigram similarity (pg_trgm).
 * Falls back to ILIKE when pg_trgm functions are not available.
 *
 * Returns sponsored matches first (sorted by ad_priority), then organic
 * results sorted by relevance. Includes faceted aggregation for the sidebar.
 */

const PAGE_SIZE = 24;

export async function searchProducts(params: SearchParams): Promise<SearchResponse> {
  if (!isDatabaseConfigured()) {
    return emptyResponse();
  }
  ensureDatabaseConfigured();

  const q = (params.q ?? '').trim();
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const sort = params.sort ?? 'relevance';

  let baseQuery = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_published', true);

  if (q) {
    baseQuery = baseQuery.or(
      `title.ilike.%${q}%,brand.ilike.%${q}%,seo_keywords.ilike.%${q}%,short_description.ilike.%${q}%`
    );
  }

  if (params.category) {
    baseQuery = baseQuery.eq('category_id', params.category);
  }

  if (params.minPrice !== undefined) {
    baseQuery = baseQuery.gte('price_cents', params.minPrice);
  }
  if (params.maxPrice !== undefined) {
    baseQuery = baseQuery.lte('price_cents', params.maxPrice);
  }
  if (params.minRating !== undefined) {
    baseQuery = baseQuery.gte('rating', params.minRating);
  }
  if (params.tags && params.tags.length > 0) {
    baseQuery = baseQuery.overlaps('tags', params.tags);
  }

  switch (sort) {
    case 'price_asc':
      baseQuery = baseQuery.order('is_sponsored', { ascending: false }).order('price_cents', { ascending: true });
      break;
    case 'price_desc':
      baseQuery = baseQuery.order('is_sponsored', { ascending: false }).order('price_cents', { ascending: false });
      break;
    case 'rating':
      baseQuery = baseQuery.order('is_sponsored', { ascending: false }).order('rating', { ascending: false });
      break;
    case 'newest':
      baseQuery = baseQuery.order('is_sponsored', { ascending: false }).order('created_at', { ascending: false });
      break;
    default:
      baseQuery = baseQuery.order('is_sponsored', { ascending: false }).order('ad_priority', { ascending: false }).order('rating', { ascending: false });
      break;
  }

  const { data, error, count } = await baseQuery.range(offset, offset + PAGE_SIZE - 1);

  if (error || !data) {
    return emptyResponse();
  }

  const rows = data as ProductRow[];
  const allProducts = rows.map(mapProductRow);

  const sponsored = allProducts.filter((p) => p.isSponsored);
  const organic = allProducts.filter((p) => !p.isSponsored);

  const facets = await buildFacets(q, params);

  let didYouMean: string | undefined;
  if (q && allProducts.length === 0) {
    didYouMean = await suggestCorrection(q);
  }

  return {
    sponsored,
    organic,
    total: count ?? 0,
    facets,
    didYouMean,
  };
}

async function buildFacets(q: string, params: SearchParams): Promise<SearchResponse['facets']> {
  if (!isDatabaseConfigured()) {
    return { categories: [], tags: [], priceRange: { min: 0, max: 0 }, ratings: [] };
  }

  let facetQuery = supabase
    .from('products')
    .select('category_id, tags, price_cents, rating')
    .eq('is_published', true);

  if (q) {
    facetQuery = facetQuery.or(
      `title.ilike.%${q}%,brand.ilike.%${q}%,seo_keywords.ilike.%${q}%,short_description.ilike.%${q}%`
    );
  }
  if (params.category) {
    facetQuery = facetQuery.eq('category_id', params.category);
  }
  if (params.minPrice !== undefined) {
    facetQuery = facetQuery.gte('price_cents', params.minPrice);
  }
  if (params.maxPrice !== undefined) {
    facetQuery = facetQuery.lte('price_cents', params.maxPrice);
  }
  if (params.minRating !== undefined) {
    facetQuery = facetQuery.gte('rating', params.minRating);
  }

  const { data: facetRows, error: facetError } = await facetQuery;

  if (facetError || !facetRows) {
    return { categories: [], tags: [], priceRange: { min: 0, max: 0 }, ratings: [] };
  }

  const catCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const ratingCounts: Record<number, number> = { 4: 0, 3: 0, 2: 0, 1: 0 };
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const row of facetRows as { category_id: string; tags: string[]; price_cents: number; rating: number }[]) {
    catCounts[row.category_id] = (catCounts[row.category_id] ?? 0) + 1;
    if (row.tags) {
      for (const t of row.tags) {
        tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
    }
    if (row.rating >= 4) ratingCounts[4]++;
    else if (row.rating >= 3) ratingCounts[3]++;
    else if (row.rating >= 2) ratingCounts[2]++;
    else ratingCounts[1]++;

    if (row.price_cents < minPrice) minPrice = row.price_cents;
    if (row.price_cents > maxPrice) maxPrice = row.price_cents;
  }

  const categoryIds = Object.keys(catCounts);
  let categoryNameMap: Record<string, { slug: string; name: string; nameAr: string }> = {};
  if (categoryIds.length > 0) {
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds);
    categoryNameMap = Object.fromEntries(
      (catData ?? []).map((c: { id: string; slug: string; name: string; name_ar?: string | null }) => [c.id, { slug: c.slug, name: c.name, nameAr: c.name_ar ?? '' }])
    );
  }

  return {
    categories: Object.entries(catCounts)
      .map(([id, c]) => ({
        slug: categoryNameMap[id]?.slug ?? id,
        name: categoryNameMap[id]?.name ?? id,
        nameAr: categoryNameMap[id]?.nameAr ?? '',
        count: c,
      }))
      .sort((a, b) => b.count - a.count),
    tags: Object.entries(tagCounts)
      .map(([tag, c]) => ({ tag, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice,
    },
    ratings: [
      { min: 4, count: ratingCounts[4] },
      { min: 3, count: ratingCounts[3] },
      { min: 2, count: ratingCounts[2] },
      { min: 1, count: ratingCounts[1] },
    ].filter((r) => r.count > 0),
  };
}

async function suggestCorrection(q: string): Promise<string | undefined> {
  if (!isDatabaseConfigured()) return undefined;

  const { data, error } = await (supabase as unknown as {
    rpc(fn: string, params: Record<string, unknown>): { select: (cols: string) => { data: unknown[] | null; error: unknown } };
  }).rpc('similarity_search', {
    query_text: q,
    match_count: 1,
  }).select('title');

  if (error || !data || data.length === 0) return undefined;
  const row = data[0] as { title: string };
  return row.title;
}

function emptyResponse(): SearchResponse {
  return {
    sponsored: [],
    organic: [],
    total: 0,
    facets: { categories: [], tags: [], priceRange: { min: 0, max: 0 }, ratings: [] },
  };
}

/**
 * Lightweight suggestion endpoint for the header autocomplete combobox.
 * Returns up to 8 product title suggestions matching the query.
 */
export async function getSuggestions(q: string): Promise<{ title: string; slug: string; brand: string; image: string }[]> {
  if (!isDatabaseConfigured() || !q.trim()) return [];
  ensureDatabaseConfigured();

  const trimmed = q.trim();
  const { data, error } = await supabase
    .from('products')
    .select('title, slug, brand, images')
    .eq('is_published', true)
    .or(`title.ilike.%${trimmed}%,brand.ilike.%${trimmed}%,seo_keywords.ilike.%${trimmed}%`)
    .order('is_sponsored', { ascending: false })
    .order('ad_priority', { ascending: false })
    .order('rating', { ascending: false })
    .limit(8);

  if (error || !data) return [];

  return (data as { title: string; slug: string; brand: string | null; images: string[] | null }[]).map((d) => ({
    title: d.title,
    slug: d.slug,
    brand: d.brand ?? '',
    image: normalizeProductImages(d.images)[0] ?? '',
  }));
}

export type { ProductCardData };
