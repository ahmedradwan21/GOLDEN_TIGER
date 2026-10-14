import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchResultsClient } from '@/components/search/SearchResultsClient';

export const metadata: Metadata = {
  title: 'Search - The Golden Tiger',
  description: 'Search our catalog of premium products.',
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'relevance';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const minPrice = searchParams.minPrice ? parseInt(String(searchParams.minPrice), 10) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(String(searchParams.maxPrice), 10) : undefined;
  const minRating = searchParams.minRating ? parseInt(String(searchParams.minRating), 10) : undefined;
  const tags = searchParams.tags
    ? Array.isArray(searchParams.tags)
      ? searchParams.tags
      : [searchParams.tags]
    : [];

  return (
    <Suspense fallback={<div className="max-w-[1440px] mx-auto px-4 py-12 text-center text-muted">Loading search...</div>}>
      <SearchResultsClient
        q={q}
        category={category}
        sort={sort}
        page={page}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minRating={minRating}
        tags={tags}
      />
    </Suspense>
  );
}
