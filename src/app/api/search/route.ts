import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/data/search';
import type { SearchParams } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') as SearchParams['sort'] ?? 'relevance';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;
  const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!, 10) : undefined;
  const tagsParam = searchParams.getAll('tags');
  const tags = tagsParam.length > 0 ? tagsParam : undefined;

  try {
    const results = await searchProducts({
      q,
      category: category || undefined,
      sort,
      page,
      minPrice,
      maxPrice,
      minRating,
      tags,
    });
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({
      sponsored: [],
      organic: [],
      total: 0,
      facets: { categories: [], tags: [], priceRange: { min: 0, max: 0 }, ratings: [] },
    });
  }
}
