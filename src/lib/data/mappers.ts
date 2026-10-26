import type { Category, Product } from '@/types';
import { normalizeProductImages } from '@/lib/product-images';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  name_ar?: string | null;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
}

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  title_ar?: string | null;
  brand: string | null;
  description: string;
  description_ar?: string | null;
  features: string[];
  specifications: Record<string, string> | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock: number;
  images?: unknown;
  video_urls?: unknown;
  rating: number;
  review_count: number;
  tags: string[];
  is_published: boolean;
  category_id: string;
  sku: string | null;
  short_description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  is_sponsored?: boolean;
  is_homepage_banner?: boolean;
  ad_priority?: number;
  banner_image_url?: string | null;
  banner_headline?: string | null;
  banner_subtext?: string | null;
  ad_starts_at?: string | null;
  ad_ends_at?: string | null;
}

export function mapCategoryRow(cat: CategoryRow, allCats: CategoryRow[]): Category {
  const children = allCats
    .filter((c) => c.parent_id === cat.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    nameAr: cat.name_ar ?? '',
    parentId: cat.parent_id,
    image: cat.image_url ?? '',
    subcategories: children.map((child) => ({
      id: child.id,
      slug: child.slug,
      name: child.name,
      nameAr: child.name_ar ?? '',
      parentId: child.parent_id,
      image: child.image_url ?? '',
      subcategories: [],
    })),
  };
}

export function mapProductRow(p: ProductRow): Product {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    titleAr: p.title_ar ?? '',
    brand: p.brand ?? '',
    price: p.price_cents,
    compareAtPrice: p.compare_at_cents ?? undefined,
    rating: p.rating,
    reviewCount: p.review_count,
    stock: p.stock,
    images: normalizeProductImages(p.images),
    videoUrls: normalizeProductImages(p.video_urls),
    features: p.features,
    description: p.description,
    descriptionAr: p.description_ar ?? '',
    specifications: (p.specifications as Record<string, string>) ?? {},
    tags: p.tags,
    categoryId: p.category_id,
    subcategoryId: p.category_id,
    isSponsored: p.is_sponsored ?? false,
    isHomepageBanner: p.is_homepage_banner ?? false,
    adPriority: p.ad_priority ?? 0,
    bannerImageUrl: p.banner_image_url ?? null,
    bannerHeadline: p.banner_headline ?? null,
    bannerSubtext: p.banner_subtext ?? null,
    adStartsAt: p.ad_starts_at ?? null,
    adEndsAt: p.ad_ends_at ?? null,
  };
}

export type { CategoryRow, ProductRow };
