'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader as Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/ui/SafeImage';
import { useI18n } from '@/context/I18nContext';

interface Suggestion {
  title: string;
  slug: string;
  brand: string;
  image: string;
}

export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions ?? []);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        setOpen(false);
        router.push(`/product/${suggestions[activeIndex].slug}`);
      } else {
        submitSearch();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={submitSearch} role="search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t('nav.search')}
            className="w-full h-10 pl-10 pr-9 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
            aria-label={t('nav.search')}
            aria-expanded={open && suggestions.length > 0}
            aria-controls="search-suggestions"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin" />
          )}
          {!loading && query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted hover:text-text"
              aria-label={t('home.clearSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === activeIndex}>
              <Link
                href={`/product/${s.slug}`}
                onClick={() => {
                  setOpen(false);
                  setActiveIndex(-1);
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 transition-colors',
                  i === activeIndex ? 'bg-surface-elevated' : 'hover:bg-surface-elevated'
                )}
              >
                {s.image && (
                  <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden bg-surface-elevated">
                    <SafeImage src={s.image} alt={s.title} fill sizes="40px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text line-clamp-1">{s.title}</p>
                  {s.brand && <p className="text-xs text-muted">{s.brand}</p>}
                </div>
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={submitSearch}
              className="w-full px-3 py-2.5 text-sm text-gold hover:bg-surface-elevated border-t border-border font-medium"
            >
              {t('home.seeAllResults')} &ldquo;{query}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
