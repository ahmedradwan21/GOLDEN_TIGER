'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Award, ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LoyaltyTier } from '@/lib/loyalty-tiers';
import { DEFAULT_PROGRAM_NAME, localizedProgramName, type LoyaltySettings } from '@/lib/loyalty-settings';
import { useI18n } from '@/context/I18nContext';
import { fmt } from '@/lib/admin-i18n';

const NAME_PRESETS: LoyaltySettings[] = [
  { name_en: 'Golden Rewards', name_ar: 'المكافآت الذهبية' },
  { name_en: 'Tiger Rewards', name_ar: 'مكافآت النمر' },
  { name_en: 'Loyalty Rewards', name_ar: 'مكافآت الولاء' },
  { name_en: 'Rewards Program', name_ar: 'برنامج المكافآت' },
  { name_en: 'Points & Rewards', name_ar: 'النقاط والمكافآت' },
  { name_en: 'VIP Rewards', name_ar: 'مكافآت النخبة' },
];

type Draft = Omit<LoyaltyTier, 'id'> & { id?: string };

const EMPTY: Draft = {
  name_en: '', name_ar: '', description_en: '', description_ar: '',
  discount_percentage: 10, free_shipping: false, points_required: 500, sort_order: 0, is_active: true,
};

async function api(method: string, body?: unknown, query = '') {
  const res = await fetch(`/api/admin/loyalty-tiers${query}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

export default function AdminLoyaltyTiersPage() {
  const { locale, t: tr } = useI18n();
  const [tiers, setTiers] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [newTier, setNewTier] = useState<Draft | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings>({ ...DEFAULT_PROGRAM_NAME });
  const [settingsBusy, setSettingsBusy] = useState(false);

  async function load() {
    try {
      const data = await api('GET');
      setTiers(data.tiers ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr('admin.tiers.loadFailed'));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch('/api/admin/loyalty-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) {
          setSettings({
            name_en: d.settings.name_en || DEFAULT_PROGRAM_NAME.name_en,
            name_ar: d.settings.name_ar || DEFAULT_PROGRAM_NAME.name_ar,
          });
        }
      })
      .catch(() => {});
  }, []);

  async function saveSettings() {
    setSettingsBusy(true);
    try {
      const res = await fetch('/api/admin/loyalty-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? tr('admin.common.saveFailed'));
      setSettings(data.settings);
      toast.success(tr('admin.tiers.nameSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr('admin.common.saveFailed'));
    } finally {
      setSettingsBusy(false);
    }
  }

  const patchLocal = (id: string, patch: Partial<Draft>) =>
    setTiers((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  async function save(tier: Draft) {
    setBusy(tier.id!);
    try {
      const { tier: saved } = await api('PATCH', tier);
      patchLocal(tier.id!, saved);
      toast.success(tr('admin.tiers.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr('admin.common.saveFailed'));
    } finally {
      setBusy(null);
    }
  }

  async function toggle(tier: Draft, key: 'is_active' | 'free_shipping', value: boolean) {
    patchLocal(tier.id!, { [key]: value });
    try {
      await api('PATCH', { id: tier.id, [key]: value });
    } catch (e) {
      patchLocal(tier.id!, { [key]: !value });
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  }

  async function remove(tier: Draft) {
    if (!confirm(fmt(tr('admin.tiers.deleteConfirm'), { name: locale === 'ar' && tier.name_ar ? tier.name_ar : tier.name_en }))) return;
    setBusy(tier.id!);
    try {
      await api('DELETE', undefined, `?id=${encodeURIComponent(tier.id!)}`);
      setTiers((list) => list.filter((t) => t.id !== tier.id));
      toast.success(tr('admin.tiers.deleted'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= tiers.length) return;
    const list = [...tiers];
    [list[index], list[other]] = [list[other], list[index]];
    const renumbered = list.map((t, i) => ({ ...t, sort_order: (i + 1) * 10 }));
    setTiers(renumbered);
    try {
      await Promise.all(
        renumbered.map((t) => api('PATCH', { id: t.id, sort_order: t.sort_order }))
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reorder failed');
      load();
    }
  }

  async function create() {
    if (!newTier) return;
    setBusy('new');
    try {
      const { tier } = await api('POST', newTier);
      setTiers((list) => [...list, tier].sort((a, b) => a.sort_order - b.sort_order));
      setNewTier(null);
      toast.success(tr('admin.tiers.added'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(null);
    }
  }

  const textCell = (t: Draft, key: keyof Draft, set: (p: Partial<Draft>) => void, dir?: 'rtl') => (
    <Input
      dir={dir}
      value={(t[key] as string | null) ?? ''}
      onChange={(e) => set({ [key]: e.target.value } as Partial<Draft>)}
      className="min-w-[140px] h-8 text-sm"
    />
  );
  const numCell = (t: Draft, key: keyof Draft, set: (p: Partial<Draft>) => void) => (
    <Input
      type="number"
      value={Number(t[key] ?? 0)}
      onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<Draft>)}
      className="w-24 h-8 text-sm"
    />
  );

  const renderRow = (t: Draft, set: (p: Partial<Draft>) => void, actions: ReactNode) => (
    <>
      <TableCell>{textCell(t, 'name_en', set)}</TableCell>
      <TableCell>{textCell(t, 'name_ar', set, 'rtl')}</TableCell>
      <TableCell>{textCell(t, 'description_en', set)}</TableCell>
      <TableCell>{textCell(t, 'description_ar', set, 'rtl')}</TableCell>
      <TableCell>{numCell(t, 'discount_percentage', set)}</TableCell>
      <TableCell>
        <Switch checked={t.free_shipping} onCheckedChange={(v) => (t.id ? toggle(t, 'free_shipping', v) : set({ free_shipping: v }))} />
      </TableCell>
      <TableCell>{numCell(t, 'points_required', set)}</TableCell>
      <TableCell>{numCell(t, 'sort_order', set)}</TableCell>
      <TableCell>
        <Switch checked={t.is_active} onCheckedChange={(v) => (t.id ? toggle(t, 'is_active', v) : set({ is_active: v }))} />
      </TableCell>
      <TableCell className="whitespace-nowrap">{actions}</TableCell>
    </>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Award className="w-7 h-7 text-gold" />
            {localizedProgramName(settings, locale)}
          </h1>
          <p className="text-muted mt-1">{tr('admin.tiers.subtitle')}</p>
        </div>
        <Button
          className="gold-button"
          disabled={!!newTier}
          onClick={() => setNewTier({ ...EMPTY, sort_order: ((tiers.at(-1)?.sort_order ?? 0) + 10) })}
        >
          <Plus className="w-4 h-4 me-1" /> {tr('admin.tiers.add')}
        </Button>
      </div>

      <Card className="bg-surface border-border p-5 space-y-4">
        <h2 className="font-heading text-lg font-bold">{tr('admin.tiers.programName')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted">{tr('admin.tiers.englishName')}</label>
            <Input
              value={settings.name_en}
              onChange={(e) => setSettings((s) => ({ ...s, name_en: e.target.value }))}
              placeholder={DEFAULT_PROGRAM_NAME.name_en}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted">{tr('admin.tiers.arabicName')}</label>
            <Input
              dir="rtl"
              value={settings.name_ar}
              onChange={(e) => setSettings((s) => ({ ...s, name_ar: e.target.value }))}
              placeholder={DEFAULT_PROGRAM_NAME.name_ar}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {NAME_PRESETS.map((p) => (
            <Button
              key={p.name_en}
              size="sm"
              variant="outline"
              onClick={() => setSettings({ ...p })}
            >
              {p.name_en} / {p.name_ar}
            </Button>
          ))}
        </div>
        <div>
          <Button className="gold-button" disabled={settingsBusy || !settings.name_en.trim()} onClick={saveSettings}>
            {settingsBusy ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}
            {tr('admin.common.save')}
          </Button>
        </div>
      </Card>

      <Card className="bg-surface border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tr('admin.tiers.colNameEn')}</TableHead>
              <TableHead>{tr('admin.tiers.colNameAr')}</TableHead>
              <TableHead>{tr('admin.tiers.colDescEn')}</TableHead>
              <TableHead>{tr('admin.tiers.colDescAr')}</TableHead>
              <TableHead>{tr('admin.tiers.colDiscount')}</TableHead>
              <TableHead>{tr('admin.tiers.colFreeShipping')}</TableHead>
              <TableHead>{tr('admin.tiers.colPoints')}</TableHead>
              <TableHead>{tr('admin.tiers.colSort')}</TableHead>
              <TableHead>{tr('admin.tiers.colActive')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((t, i) => (
              <TableRow key={t.id}>
                {renderRow(t, (p) => patchLocal(t.id!, p), (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={tr('admin.common.moveUp')}><ArrowUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={i === tiers.length - 1} onClick={() => move(i, 1)} aria-label={tr('admin.common.moveDown')}><ArrowDown className="w-4 h-4" /></Button>
                    <Button size="sm" disabled={busy === t.id} onClick={() => save(t)}>
                      {busy === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" disabled={busy === t.id} onClick={() => remove(t)} aria-label={tr('admin.common.delete')} className="text-danger">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </TableRow>
            ))}
            {newTier && (
              <TableRow className="bg-gold/5">
                {renderRow(newTier, (p) => setNewTier((d) => (d ? { ...d, ...p } : d)), (
                  <div className="flex items-center gap-1">
                    <Button size="sm" className="gold-button" disabled={busy === 'new'} onClick={create}>
                      {busy === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : tr('admin.common.create')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setNewTier(null)}>{tr('admin.common.cancel')}</Button>
                  </div>
                ))}
              </TableRow>
            )}
            {tiers.length === 0 && !newTier && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted py-10">{tr('admin.tiers.empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
