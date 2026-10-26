'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
  ExternalLink,
  Trash2,
  Loader as Loader2,
  Save,
  ImageOff,
  GalleryHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BannerStatusBadge } from '@/components/admin/BannerStatusBadge';
import { useI18n } from '@/context/I18nContext';
import { fmt } from '@/lib/admin-i18n';
import { cn } from '@/lib/utils';
import {
  MAX_AD_PRIORITY,
  clampPriority,
  getBannerStatus,
  prioritiesFromOrder,
  sortByPriority,
} from '@/lib/homepage-banners';

interface BannerRow {
  id: string;
  slug: string;
  title: string;
  title_ar?: string | null;
  images: string[];
  is_published: boolean;
  is_homepage_banner: boolean;
  ad_priority: number | null;
  banner_image_url: string | null;
  banner_headline: string | null;
  banner_subtext: string | null;
  ad_starts_at: string | null;
  ad_ends_at: string | null;
}

export default function AdminBannersPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/banners', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.banners.loadFailed'));
      setRows(data as BannerRow[]);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.banners.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  function applyOrder(next: BannerRow[]) {
    const priorities = new Map(prioritiesFromOrder(next.map((r) => r.id)).map((p) => [p.id, p.ad_priority]));
    setRows(next.map((r) => ({ ...r, ad_priority: priorities.get(r.id) ?? 0 })));
    setDirty(true);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    applyOrder(next);
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = rows.findIndex((r) => r.id === dragId);
    const to = rows.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    applyOrder(next);
  }

  function setPriority(id: string, value: string) {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ad_priority: clampPriority(value) } : r)));
    setDirty(true);
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priorities: rows.map((r) => ({ id: r.id, ad_priority: r.ad_priority ?? 0 })) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.common.saveFailed'));
      toast.success(t('admin.banners.saved'));
      setRows((cur) => sortByPriority(cur));
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: BannerRow) {
    if (!window.confirm(t('admin.banners.removeConfirm'))) return;
    const res = await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remove: row.id }),
    });
    if (res.ok) {
      setRows((cur) => cur.filter((r) => r.id !== row.id));
      toast.success(t('admin.banners.removed'));
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || t('admin.common.saveFailed'));
    }
  }

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;

  const liveCount = rows.filter((r) => r.is_published && getBannerStatus(r) === 'live').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t('admin.banners.title')}</h1>
          <p className="text-muted mt-1">{t('admin.banners.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory">
            <Button variant="outline">{t('admin.banners.addFromProducts')}</Button>
          </Link>
          <Button onClick={saveOrder} disabled={!dirty || saving} className="gold-button gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('admin.banners.saveOrder')}
          </Button>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <p className="text-sm text-muted">
          {fmt(t('admin.banners.summary'), { live: liveCount, total: rows.length })} · {t('admin.banners.dragHint')}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : error ? (
        <Card className="bg-surface border-border p-8 text-center">
          <p className="text-danger text-sm">{error}</p>
          <Button variant="outline" className="mt-4" onClick={load}>
            {t('admin.banners.retry')}
          </Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="bg-surface border-border p-12 text-center space-y-3">
          <GalleryHorizontal className="w-10 h-10 text-gold mx-auto" />
          <p className="font-semibold">{t('admin.banners.empty')}</p>
          <p className="text-sm text-muted max-w-md mx-auto">{t('admin.banners.emptyHint')}</p>
        </Card>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, index) => {
            const image = row.banner_image_url || row.images?.[0] || '';
            const headline = row.banner_headline || (locale === 'ar' && row.title_ar ? row.title_ar : row.title);
            const starts = formatDate(row.ad_starts_at);
            const ends = formatDate(row.ad_ends_at);
            return (
              <li
                key={row.id}
                draggable
                onDragStart={(e) => {
                  setDragId(row.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverId(row.id);
                }}
                onDragLeave={() => setOverId((cur) => (cur === row.id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOn(row.id);
                  setDragId(null);
                  setOverId(null);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={cn(
                  'flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 rounded-lg border bg-surface p-3 transition-all',
                  overId === row.id && dragId !== row.id ? 'border-gold ring-1 ring-gold/40' : 'border-border',
                  dragId === row.id && 'opacity-50'
                )}
              >
                <div className="flex flex-col items-center gap-1 text-muted">
                  <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" aria-hidden />
                  <span className="text-xs font-semibold tabular-nums">{index + 1}</span>
                </div>

                <div className="relative h-16 w-28 sm:h-20 sm:w-36 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <ImageOff className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text truncate">{headline}</p>
                    <BannerStatusBadge row={row} isPublished={row.is_published} />
                  </div>
                  {row.banner_headline && <p className="text-xs text-muted truncate">{row.title}</p>}
                  <p className="text-xs text-muted">
                    {starts || ends
                      ? `${starts ? fmt(t('admin.banners.from'), { date: starts }) : t('admin.banners.fromNow')} · ${
                          ends ? fmt(t('admin.banners.until'), { date: ends }) : t('admin.banners.noEnd')
                        }`
                      : t('admin.banners.always')}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <label className="text-[10px] uppercase tracking-wide text-muted" htmlFor={`prio-${row.id}`}>
                    {t('admin.banners.priority')}
                  </label>
                  <Input
                    id={`prio-${row.id}`}
                    type="number"
                    min={0}
                    max={MAX_AD_PRIORITY}
                    value={row.ad_priority ?? 0}
                    onChange={(e) => setPriority(row.id, e.target.value)}
                    onBlur={() => setRows((cur) => sortByPriority(cur))}
                    className="h-9 w-20 bg-background text-center tabular-nums"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={t('admin.common.moveUp')}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => move(index, 1)}
                    disabled={index === rows.length - 1}
                    aria-label={t('admin.common.moveDown')}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/admin/inventory?edit=${encodeURIComponent(row.id)}`} aria-label={t('admin.banners.edit')}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={t('admin.banners.edit')}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <a href={`/product/${row.slug}`} target="_blank" rel="noreferrer" aria-label={t('admin.banners.view')}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={t('admin.banners.view')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-danger hover:text-danger"
                    onClick={() => remove(row)}
                    title={t('admin.banners.remove')}
                    aria-label={t('admin.banners.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
