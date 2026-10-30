'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, Loader as Loader2, Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/context/I18nContext';
import { validateAffiliate, type AdminAffiliate } from '@/lib/affiliates';

interface Draft {
  id?: string;
  name: string;
  phone: string;
  email: string;
  commission_percent: string;
  notes: string;
  is_active: boolean;
}

const EMPTY_DRAFT: Draft = { name: '', phone: '', email: '', commission_percent: '10', notes: '', is_active: true };

const toDraft = (a: AdminAffiliate): Draft => ({
  id: a.id,
  name: a.name,
  phone: a.phone ?? '',
  email: a.email ?? '',
  commission_percent: String(a.commission_percent ?? 0),
  notes: a.notes ?? '',
  is_active: a.is_active,
});

export function CopyCodeButton({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t('admin.affiliates.copied'));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('admin.affiliates.copyFailed'));
    }
  }
  return (
    <Button size="icon" variant="ghost" onClick={copy} aria-label={t('admin.affiliates.copy')} className="h-7 w-7">
      {copied ? <Check className="w-3.5 h-3.5 text-gold" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

/** CRUD for affiliates. Creating one also creates its coupon on the server. */
export function AffiliatesCard({ onChange }: { onChange?: () => void }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<AdminAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/affiliates', { cache: 'no-store' });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || t('admin.affiliates.loadFailed'));
      setRows(data as AdminAffiliate[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.affiliates.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  async function send(method: 'POST' | 'PUT', body: object, key: string) {
    setBusy(key);
    setError('');
    try {
      const res = await fetch('/api/admin/affiliates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.common.saveFailed'));
      await load();
      onChange?.();
      return data as AdminAffiliate;
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.common.saveFailed');
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    const input = validateAffiliate({ ...draft, commission_percent: Number(draft.commission_percent) });
    if (!input || draft.commission_percent.trim() === '') {
      setError(t('admin.affiliates.invalid'));
      return;
    }
    const saved = await send(draft.id ? 'PUT' : 'POST', { ...input, id: draft.id }, 'draft');
    if (saved) {
      toast.success(draft.id ? t('admin.affiliates.saved') : `${t('admin.affiliates.created')} ${saved.coupon_code}`);
      setDraft(null);
    }
  }

  async function toggleActive(a: AdminAffiliate, v: boolean) {
    await send('PUT', { ...a, is_active: v }, a.id);
  }

  async function remove(a: AdminAffiliate) {
    if (!window.confirm(t('admin.affiliates.confirmDelete'))) return;
    setBusy(a.id);
    try {
      const res = await fetch(`/api/admin/affiliates?id=${encodeURIComponent(a.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.common.saveFailed'));
      toast.success(t('admin.affiliates.deleted'));
      await load();
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.common.saveFailed'));
    } finally {
      setBusy(null);
    }
  }

  const field = (key: 'name' | 'phone' | 'email' | 'commission_percent', label: string, type = 'text') => (
    <div className="space-y-1.5">
      <Label htmlFor={`aff-${key}`}>{label}</Label>
      <Input
        id={`aff-${key}`}
        type={type}
        dir={key === 'name' ? undefined : 'ltr'}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? 0 : undefined}
        max={type === 'number' ? 100 : undefined}
        maxLength={type === 'number' ? undefined : key === 'phone' ? 30 : 200}
        value={draft ? draft[key] : ''}
        onChange={(e) => setDraft((d) => (d ? { ...d, [key]: e.target.value } : d))}
        className="bg-background"
      />
    </div>
  );

  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-gold mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-text">{t('admin.affiliates.listTitle')}</h2>
            <p className="text-xs text-muted mt-0.5">{t('admin.affiliates.listSubtitle')}</p>
          </div>
        </div>
        {!draft && (
          <Button onClick={() => { setDraft({ ...EMPTY_DRAFT }); setError(''); }} className="gold-button gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            {t('admin.affiliates.add')}
          </Button>
        )}
      </div>

      {draft && (
        <div className="rounded-lg border border-gold/30 bg-background/50 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('name', t('admin.affiliates.name'))}
            {field('phone', t('admin.affiliates.phone'), 'tel')}
            {field('email', t('admin.affiliates.email'), 'email')}
            {field('commission_percent', t('admin.affiliates.commission'), 'number')}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aff-notes">{t('admin.affiliates.notes')}</Label>
            <Textarea
              id="aff-notes"
              maxLength={2000}
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft((d) => (d ? { ...d, notes: e.target.value } : d))}
              className="bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="aff-active"
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft((d) => (d ? { ...d, is_active: v } : d))}
            />
            <Label htmlFor="aff-active">{t('admin.affiliates.active')}</Label>
          </div>
          {!draft.id && <p className="text-xs text-muted">{t('admin.affiliates.codeNote')}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDraft(null); setError(''); }} className="gap-2">
              <X className="w-4 h-4" />
              {t('admin.common.cancel')}
            </Button>
            <Button onClick={saveDraft} disabled={busy === 'draft'} className="gold-button gap-2">
              {busy === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {draft.id ? t('admin.common.save') : t('admin.common.create')}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gold" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">{t('admin.affiliates.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-xs uppercase">
                <th className="text-start py-3 px-2">{t('admin.affiliates.name')}</th>
                <th className="text-start py-3 px-2">{t('admin.affiliates.phone')} / {t('admin.affiliates.email')}</th>
                <th className="text-start py-3 px-2">{t('admin.affiliates.code')}</th>
                <th className="text-end py-3 px-2">{t('admin.affiliates.commissionShort')}</th>
                <th className="text-start py-3 px-2">{t('admin.affiliates.notes')}</th>
                <th className="text-center py-3 px-2">{t('admin.affiliates.active')}</th>
                <th className="text-end py-3 px-2">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                  <td className={`py-3 px-2 font-medium whitespace-nowrap ${a.is_active ? 'text-text' : 'text-muted line-through'}`}>{a.name}</td>
                  <td className="py-3 px-2 text-muted text-xs leading-5">
                    <div className="whitespace-nowrap" dir="ltr">{a.phone || '—'}</div>
                    <div className="truncate max-w-[180px]" dir="ltr" title={a.email ?? ''}>{a.email || '—'}</div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <code className="text-gold font-mono text-xs bg-gold/10 border border-gold/30 rounded px-1.5 py-0.5" dir="ltr">{a.coupon_code}</code>
                      <CopyCodeButton code={a.coupon_code} />
                    </span>
                  </td>
                  <td className="py-3 px-2 text-end tabular-nums">{Number(a.commission_percent)}%</td>
                  <td className="py-3 px-2 text-muted max-w-[140px] truncate" title={a.notes ?? ''}>{a.notes || '—'}</td>
                  <td className="py-3 px-2 text-center">
                    <Switch
                      checked={a.is_active}
                      disabled={busy === a.id}
                      onCheckedChange={(v) => toggleActive(a, v)}
                      aria-label={t('admin.affiliates.active')}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex justify-end">
                      <Button size="icon" variant="ghost" onClick={() => { setDraft(toDraft(a)); setError(''); }} aria-label={t('admin.affiliates.edit')}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={busy === a.id}
                        onClick={() => remove(a)}
                        className="text-danger hover:bg-danger/10"
                        aria-label={t('admin.common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
