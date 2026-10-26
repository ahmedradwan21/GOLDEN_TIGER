import 'server-only';
import type { Category, Product, HeroSlide } from '@/types';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { ensureDatabaseConfigured } from '@/lib/env';
import { mapCategoryRow, mapProductRow, type CategoryRow, type ProductRow } from './mappers';
import { normalizeProductImages } from '@/lib/product-images';
import { selectLiveBanners } from '@/lib/homepage-banners';

export async function getCategoryTree(): Promise<Category[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { console.error('[getCategoryTree] Supabase error:', error.message); return []; }
  if (!data) return [];
  const rows = data as CategoryRow[];
  const roots = rows.filter((c) => !c.parent_id);
  return roots.map((r) => mapCategoryRow(r, rows));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isDatabaseConfigured()) return null;
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) { console.error('[getCategoryBySlug] Supabase error:', error.message); return null; }
  if (!data) return null;
  const cat = data as CategoryRow;

  const { data: allCats } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return mapCategoryRow(cat, (allCats as CategoryRow[]) ?? []);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .filter('tags', 'cs', '"{""bestseller""}"')
    .order('rating', { ascending: false })
    .limit(8);

  if (error) { console.error('[getFeaturedProducts] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!cat) return [];

  const { data: subcats } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', cat.id);

  const categoryIds = [cat.id, ...((subcats ?? []).map((s: { id: string }) => s.id))];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('category_id', categoryIds)
    .eq('is_published', true)
    .order('is_sponsored', { ascending: false })
    .order('ad_priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) { console.error('[getProductsByCategory] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isDatabaseConfigured()) return null;
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) { console.error('[getProductBySlug] Supabase error:', error.message); return null; }
  if (!data) return null;
  return mapProductRow(data as ProductRow);
}

export async function getRelatedProducts(productId: string): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data: product } = await supabase
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .maybeSingle();
  if (!product) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', productId)
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .limit(8);

  if (error) { console.error('[getRelatedProducts] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

const BANNER_FALLBACK_IMAGE =
  'https://images.pexels.com/photos/16387546/pexels-photo-16387546.jpeg?auto=compress&cs=tinysrgb&h=800&w=1600';
const MAX_HERO_SLIDES = 10;

/**
 * Homepage hero slides. Only products with is_homepage_banner = true whose
 * schedule is live (ad_starts_at null or <= now, ad_ends_at null or >= now),
 * ordered by ad_priority (highest first). Each slide links to its product.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .eq('is_homepage_banner', true)
      .order('ad_priority', { ascending: false });

    if (error) {
      console.error('[getHeroSlides] Supabase error:', error.message);
      return [];
    }

    const live = selectLiveBanners((data ?? []) as ProductRow[], new Date()).slice(0, MAX_HERO_SLIDES);

    return live.map((p) => ({
      id: `banner-${p.id}`,
      image:
        p.banner_image_url ||
        normalizeProductImages(p.images)[0]?.replace('h=600&w=600', 'h=800&w=1600') ||
        BANNER_FALLBACK_IMAGE,
      headline: p.banner_headline || p.title,
      headlineAr: p.banner_headline ? null : p.title_ar || null,
      subcopy: p.banner_subtext || p.short_description || p.brand || '',
      ctaText: 'Shop Now',
      ctaHref: `/product/${p.slug}`,
      sponsored: true,
      productId: p.id,
    }));
  } catch (err) {
    console.error('[getHeroSlides] failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getHomepageRelatedProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .limit(12);

  if (error) { console.error('[getHomepageRelatedProducts] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getAllProductSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('slug')
    .eq('is_published', true);

  if (error) { console.error('[getAllProductSlugs] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as { slug: string }[]).map((p) => p.slug);
}

export async function getDealsOfTheDay(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .filter('tags', 'cs', '"{""deal""}"')
    .order('rating', { ascending: false })
    .limit(8);

  if (error) { console.error('[getDealsOfTheDay] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}
