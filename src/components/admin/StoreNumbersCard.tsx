'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader as Loader2, Phone, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/context/I18nContext';
import type { StoreNumbers } from '@/lib/admin-settings';

const EMPTY: StoreNumbers = { whatsapp_number: '', vodafone_cash_number: '', instapay_handle: '' };

/** Edits the contact/payment numbers on store_settings (id=1). */
export function StoreNumbersCard() {
  const { t } = useI18n();
  const [form, setForm] = useState<StoreNumbers>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/store-settings', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error || t('admin.settings.loadFailed'));
        setForm(data as StoreNumbers);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('admin.settings.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.common.saveFailed'));
      setForm(data as StoreNumbers);
      toast.success(t('admin.settings.saved'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.common.saveFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: keyof StoreNumbers; label: string; placeholder: string }[] = [
    { key: 'whatsapp_number', label: t('admin.settings.whatsapp'), placeholder: '+201xxxxxxxxx' },
    { key: 'vodafone_cash_number', label: t('admin.settings.vodafone'), placeholder: '010xxxxxxxx' },
    { key: 'instapay_handle', label: t('admin.settings.instapay'), placeholder: 'name@instapay' },
  ];

  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-start gap-3">
        <Phone className="w-5 h-5 text-gold mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-semibold text-text">{t('admin.settings.numbersTitle')}</h2>
          <p className="text-xs text-muted mt-0.5">{t('admin.settings.numbersSubtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gold" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`store-${f.key}`}>{f.label}</Label>
              <Input
                id={`store-${f.key}`}
                dir="ltr"
                maxLength={f.key === 'instapay_handle' ? 100 : 30}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="bg-background"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || loading} className="gold-button gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('admin.common.save')}
        </Button>
      </div>
    </Card>
  );
}
