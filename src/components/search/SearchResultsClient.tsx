'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { SearchBox } from '@/components/layout/SearchBox';
import { Star, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResponse } from '@/types';
import { useI18n } from '@/context/I18nContext';

interface SearchResultsClientProps {
  q: string;
  category: string;
  sort: string;
  page: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags: string[];
}

const PAGE_SIZE = 24;
const SORT_LABELS: Record<string, string> = {
  relevance: 'Relevance',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  rating: 'Top Rated',
  newest: 'Newest',
};

export function SearchResultsClient({
  q: initialQ,
  category: initialCategory,
  sort: initialSort,
  page: initialPage,
  minPrice,
  maxPrice,
  minRating,
  tags,
}: SearchResultsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    minPrice ?? 0,
    maxPrice ?? 50000,
  ]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (initialQ) params.set('q', initialQ);
    if (initialCategory) params.set('category', initialCategory);
    params.set('sort', initialSort);
    params.set('page', String(initialPage));
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    if (minRating !== undefined) params.set('minRating', String(minRating));
    if (tags.length > 0) tags.forEach((t) => params.append('tags', t));

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [initialQ, initialCategory, initialSort, initialPage, minPrice, maxPrice, minRating, tags]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function updateFilter(key: string, value?: string, action: 'set' | 'toggle' = 'set') {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'tags' && action === 'toggle') {
      const current = params.getAll('tags');
      if (current.includes(value!)) {
        params.delete('tags');
        current.filter((t) => t !== value).forEach((t) => params.append('tags', t));
      } else {
        params.append('tags', value!);
      }
    } else if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key !== 'page') params.delete('page');
    router.push(`/search?${params.toString()}`);
  }

  function clearAllFilters() {
    const params = new URLSearchParams();
    if (initialQ) params.set('q', initialQ);
    router.push(`/search?${params.toString()}`);
  }

  const hasActiveFilters =
    initialCategory || minPrice !== undefined || maxPrice !== undefined || minRating !== undefined || tags.length > 0;

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = initialPage;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-2">
          {initialQ ? `Results for "${initialQ}"` : 'Search Products'}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xl">
            <SearchBox />
          </div>
        </div>
      </div>

      {data?.didYouMean && (
        <p className="text-sm text-muted mb-4">
          Did you mean{' '}
          <button
            onClick={() => updateFilter('q', data.didYouMean)}
            className="text-gold font-medium hover:underline"
          >
            {data.didYouMean}
          </button>
          ?
        </p>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterSidebar
            data={data}
            category={initialCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            minRating={minRating}
            tags={tags}
            localPriceRange={localPriceRange}
            setLocalPriceRange={setLocalPriceRange}
            updateFilter={updateFilter}
            clearAllFilters={clearAllFilters}
            hasActiveFilters={!!hasActiveFilters}
          />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <p className="text-sm text-muted">
              {loading ? 'Loading...' : `${data?.total ?? 0} results`}
              {data && data.sponsored.length > 0 && (
                <span className="text-gold ml-1">({data.sponsored.length} sponsored)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm text-text"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-muted hidden sm:inline">
                  Sort:
                </label>
                <select
                  id="sort"
                  value={initialSort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="h-9 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text focus-ring cursor-pointer"
                >
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {initialCategory && (
                <FilterChip label={`Category: ${initialCategory}`} onRemove={() => updateFilter('category')} />
              )}
              {minPrice !== undefined && (
                <FilterChip label={`Min: $${(minPrice / 100).toFixed(0)}`} onRemove={() => updateFilter('minPrice')} />
              )}
              {maxPrice !== undefined && (
                <FilterChip label={`Max: $${(maxPrice / 100).toFixed(0)}`} onRemove={() => updateFilter('maxPrice')} />
              )}
              {minRating !== undefined && (
                <FilterChip label={`${minRating}+ stars`} onRemove={() => updateFilter('minRating')} />
              )}
              {tags.map((t) => (
                <FilterChip key={t} label={t} onRemove={() => updateFilter('tags', t, 'toggle')} />
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted hover:text-danger underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Results grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-xl border border-border animate-pulse h-72" />
              ))}
            </div>
          ) : data && (data.sponsored.length + data.organic.length) > 0 ? (
            <>
              {/* Sponsored section */}
              {data.sponsored.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-2">Sponsored Results</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {data.sponsored.map((p) => (
                      <ProductCard key={p.id} product={p} sponsored source="search" />
                    ))}
                  </div>
                </div>
              )}
              {/* Organic results */}
              {data.organic.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {data.organic.map((p) => (
                    <ProductCard key={p.id} product={p} source="search" />
                  ))}
                </div>
              )}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {currentPage > 1 && (
                    <button
                      onClick={() => updateFilter('page', String(currentPage - 1))}
                      className="h-9 px-3 rounded-lg border border-border text-sm text-text hover:bg-surface-elevated"
                    >
                      Previous
                    </button>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && arr[idx - 1] !== p - 1;
                      return (
                        <span key={p} className="flex items-center gap-1">
                          {showEllipsis && <span className="text-muted px-1">...</span>}
                          <button
                            onClick={() => updateFilter('page', String(p))}
                            className={cn(
                              'h-9 min-w-[2.25rem] px-2 rounded-lg text-sm font-medium transition-colors',
                              p === currentPage
                                ? 'bg-gold text-background'
                                : 'border border-border text-text hover:bg-surface-elevated'
                            )}
                          >
                            {p}
                          </button>
                        </span>
                      );
                    })}
                  {currentPage < totalPages && (
                    <button
                      onClick={() => updateFilter('page', String(currentPage + 1))}
                      className="h-9 px-3 rounded-lg border border-border text-sm text-text hover:bg-surface-elevated"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg font-medium text-text mb-2">No results found</p>
              <p className="text-sm text-muted">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-surface border-r border-border overflow-y-auto p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-surface-elevated"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar
              data={data}
              category={initialCategory}
              minPrice={minPrice}
              maxPrice={maxPrice}
              minRating={minRating}
              tags={tags}
              localPriceRange={localPriceRange}
              setLocalPriceRange={setLocalPriceRange}
              updateFilter={updateFilter}
              clearAllFilters={clearAllFilters}
              hasActiveFilters={!!hasActiveFilters}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-surface-elevated border border-border text-xs text-text">
      {label}
      <button onClick={onRemove} className="text-muted hover:text-danger" aria-label={`Remove ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

interface FilterSidebarProps {
  data: SearchResponse | null;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags: string[];
  localPriceRange: [number, number];
  setLocalPriceRange: (r: [number, number]) => void;
  updateFilter: (key: string, value?: string, action?: 'set' | 'toggle') => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterSidebar({
  data,
  category,
  minPrice,
  maxPrice,
  minRating,
  tags,
  localPriceRange,
  setLocalPriceRange,
  updateFilter,
  clearAllFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  const { locale } = useI18n();
  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="text-xs text-muted hover:text-danger underline"
        >
          Clear all filters
        </button>
      )}

      {/* Category facet */}
      {data && data.facets.categories.length > 0 && (
        <FilterSection title="Category">
          <ul className="space-y-1.5">
            {data.facets.categories.map((c) => (
              <li key={c.slug}>
                <button
                  onClick={() => updateFilter('category', c.slug === category ? '' : c.slug)}
                  className={cn(
                    'flex items-center justify-between w-full text-sm py-1 text-left transition-colors',
                    c.slug === category ? 'text-gold font-medium' : 'text-muted hover:text-text'
                  )}
                >
                  <span dir="auto">{locale === 'ar' && c.nameAr?.trim() ? c.nameAr : c.name}</span>
                  <span className="text-xs text-muted/70">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Price facet */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localPriceRange[0] ? (localPriceRange[0] / 100).toFixed(0) : ''}
              onChange={(e) => setLocalPriceRange([Math.round(parseFloat(e.target.value) * 100) || 0, localPriceRange[1]])}
              className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-xs text-text"
            />
            <span className="text-muted text-xs">to</span>
            <input
              type="number"
              placeholder="Max"
              value={localPriceRange[1] ? (localPriceRange[1] / 100).toFixed(0) : ''}
              onChange={(e) => setLocalPriceRange([localPriceRange[0], Math.round(parseFloat(e.target.value) * 100) || 0])}
              className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-xs text-text"
            />
          </div>
          <button
            onClick={() => {
              updateFilter('minPrice', localPriceRange[0] > 0 ? String(localPriceRange[0]) : '');
              updateFilter('maxPrice', localPriceRange[1] > 0 ? String(localPriceRange[1]) : '');
            }}
            className="w-full h-8 rounded-lg gold-button text-xs font-medium"
          >
            Apply Price
          </button>
        </div>
      </FilterSection>

      {/* Rating facet */}
      {data && data.facets.ratings.length > 0 && (
        <FilterSection title="Rating">
          <ul className="space-y-1.5">
            {data.facets.ratings.map((r) => (
              <li key={r.min}>
                <button
                  onClick={() => updateFilter('minRating', r.min === minRating ? '' : String(r.min))}
                  className={cn(
                    'flex items-center justify-between w-full text-sm py-1 text-left transition-colors',
                    r.min === minRating ? 'text-gold font-medium' : 'text-muted hover:text-text'
                  )}
                >
                  <span className="flex items-center gap-1">
                    {Array.from({ length: r.min }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                    ))}
                    <span className="ml-1">&amp; up</span>
                  </span>
                  <span className="text-xs text-muted/70">{r.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Tags facet */}
      {data && data.facets.tags.length > 0 && (
        <FilterSection title="Popular Tags">
          <div className="flex flex-wrap gap-1.5">
            {data.facets.tags.map((t) => (
              <button
                key={t.tag}
                onClick={() => updateFilter('tags', t.tag, 'toggle')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  tags.includes(t.tag)
                    ? 'bg-gold text-background border-gold'
                    : 'border-border text-muted hover:text-text hover:border-gold/40'
                )}
              >
                {t.tag} ({t.count})
              </button>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text mb-3">{title}</h3>
      {children}
    </div>
  );
}
