'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader as Loader2, Pencil, Plus, Save, Trash2, Truck, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/context/I18nContext';
import type { AdminShippingMethod, ShippingMethodInput } from '@/lib/admin-settings';

interface Draft {
  id?: string;
  name_en: string;
  name_ar: string;
  price: string; // EGP, converted to cents on save
  eta_en: string;
  eta_ar: string;
  sort_order: string;
  is_active: boolean;
}

const EMPTY_DRAFT: Draft = { name_en: '', name_ar: '', price: '0', eta_en: '', eta_ar: '', sort_order: '0', is_active: true };

function toDraft(m: AdminShippingMethod): Draft {
  return {
    id: m.id,
    name_en: m.name_en,
    name_ar: m.name_ar ?? '',
    price: String((m.price_cents ?? 0) / 100),
    eta_en: m.eta_en ?? '',
    eta_ar: m.eta_ar ?? '',
    sort_order: String(m.sort_order ?? 0),
    is_active: m.is_active,
  };
}

/** CRUD for shipping_methods rows. */
export function ShippingMethodsCard() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<AdminShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/shipping-methods', { cache: 'no-store' });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || t('admin.settings.loadFailed'));
      setRows(data as AdminShippingMethod[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.settings.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  async function send(method: 'POST' | 'PUT', body: object, key: string) {
    setBusy(key);
    setError('');
    try {
      const res = await fetch('/api/admin/shipping-methods', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.common.saveFailed'));
      await load();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.common.saveFailed');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    const price = Number(draft.price);
    const sort = Number(draft.sort_order);
    if (!draft.name_en.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(sort)) {
      setError(t('admin.shipping.invalid'));
      return;
    }
    const body: ShippingMethodInput & { id?: string } = {
      id: draft.id,
      name_en: draft.name_en,
      name_ar: draft.name_ar || null,
      price_cents: Math.round(price * 100),
      eta_en: draft.eta_en || null,
      eta_ar: draft.eta_ar || null,
      sort_order: sort,
      is_active: draft.is_active,
    };
    const ok = await send(draft.id ? 'PUT' : 'POST', body, 'draft');
    if (ok) {
      toast.success(t('admin.shipping.saved'));
      setDraft(null);
    }
  }

  async function toggleActive(m: AdminShippingMethod, v: boolean) {
    await send('PUT', { ...m, is_active: v }, m.id);
  }

  async function remove(m: AdminShippingMethod) {
    if (!window.confirm(t('admin.shipping.confirmDelete'))) return;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/admin/shipping-methods?id=${encodeURIComponent(m.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.common.saveFailed'));
      toast.success(t('admin.shipping.deleted'));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.common.saveFailed'));
    } finally {
      setBusy(null);
    }
  }

  const fmt = (cents: number) =>
    cents === 0 ? t('admin.shipping.free') : `${(cents / 100).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-EG')} ${t('admin.shipping.currency')}`;

  const field = (key: keyof Draft, label: string, opts: { dir?: 'ltr' | 'rtl'; type?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`ship-${key}`}>{label}</Label>
      <Input
        id={`ship-${key}`}
        dir={opts.dir}
        type={opts.type ?? 'text'}
        step={key === 'price' ? '0.01' : undefined}
        min={key === 'price' ? 0 : undefined}
        maxLength={opts.type ? undefined : 120}
        value={draft ? (draft[key] as string) : ''}
        onChange={(e) => setDraft((d) => (d ? { ...d, [key]: e.target.value } : d))}
        className="bg-background"
      />
    </div>
  );

  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-gold mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-text">{t('admin.shipping.title')}</h2>
            <p className="text-xs text-muted mt-0.5">{t('admin.shipping.subtitle')}</p>
          </div>
        </div>
        {!draft && (
          <Button
            onClick={() => setDraft({ ...EMPTY_DRAFT, sort_order: String((rows.at(-1)?.sort_order ?? 0) + 1) })}
            className="gold-button gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('admin.shipping.add')}
          </Button>
        )}
      </div>

      {draft && (
        <div className="rounded-lg border border-gold/30 bg-background/50 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('name_en', t('admin.shipping.nameEn'), { dir: 'ltr' })}
            {field('name_ar', t('admin.shipping.nameAr'), { dir: 'rtl' })}
            {field('eta_en', t('admin.shipping.etaEn'), { dir: 'ltr' })}
            {field('eta_ar', t('admin.shipping.etaAr'), { dir: 'rtl' })}
            {field('price', t('admin.shipping.price'), { type: 'number' })}
            {field('sort_order', t('admin.shipping.sortOrder'), { type: 'number' })}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="ship-active"
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft((d) => (d ? { ...d, is_active: v } : d))}
            />
            <Label htmlFor="ship-active">{t('admin.shipping.active')}</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDraft(null); setError(''); }} className="gap-2">
              <X className="w-4 h-4" />
              {t('admin.common.cancel')}
            </Button>
            <Button onClick={saveDraft} disabled={busy === 'draft'} className="gold-button gap-2">
              {busy === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('admin.common.save')}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gold" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">{t('admin.shipping.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((m) => {
            const name = locale === 'ar' && m.name_ar ? m.name_ar : m.name_en;
            const eta = locale === 'ar' && m.eta_ar ? m.eta_ar : m.eta_en;
            return (
              <li key={m.id} className="flex items-center gap-4 py-3">
                <span className="w-8 text-xs text-muted tabular-nums">#{m.sort_order}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${m.is_active ? 'text-text' : 'text-muted line-through'}`}>{name}</p>
                  <p className="text-xs text-muted truncate">{eta || '—'}</p>
                </div>
                <span className="text-sm text-gold font-medium whitespace-nowrap">{fmt(m.price_cents)}</span>
                <Switch
                  checked={m.is_active}
                  disabled={busy === m.id}
                  onCheckedChange={(v) => toggleActive(m, v)}
                  aria-label={t('admin.shipping.active')}
                />
                <Button size="icon" variant="ghost" onClick={() => setDraft(toDraft(m))} aria-label={t('admin.shipping.edit')}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy === m.id}
                  onClick={() => remove(m)}
                  className="text-danger hover:bg-danger/10"
                  aria-label={t('admin.common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
