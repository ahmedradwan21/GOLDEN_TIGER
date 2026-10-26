'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader as Loader2, Megaphone, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/context/I18nContext';
import { EMPTY_ANNOUNCEMENT, type AnnouncementSettings } from '@/lib/announcement';

/** Dashboard card editing the single announcement_bar_settings row. */
export function AnnouncementSettingsCard() {
  const { t } = useI18n();
  const [form, setForm] = useState<AnnouncementSettings>({ ...EMPTY_ANNOUNCEMENT });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/announcement', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error || t('admin.announcement.loadFailed'));
        setForm(data as AnnouncementSettings);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('admin.announcement.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t('admin.common.saveFailed'));
      setForm(data as AnnouncementSettings);
      toast.success(t('admin.announcement.saved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('admin.common.saveFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Megaphone className="w-5 h-5 text-gold mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-text">{t('admin.announcement.title')}</h2>
            <p className="text-xs text-muted mt-0.5">{t('admin.announcement.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Label htmlFor="announcement-active" className="text-xs text-muted">
            {form.is_active ? t('admin.announcement.on') : t('admin.announcement.off')}
          </Label>
          <Switch
            id="announcement-active"
            checked={form.is_active}
            disabled={loading}
            onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            aria-label={t('admin.announcement.active')}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="announcement-en">{t('admin.announcement.messageEn')}</Label>
            <Input
              id="announcement-en"
              dir="ltr"
              maxLength={300}
              value={form.message_en}
              onChange={(e) => setForm((f) => ({ ...f, message_en: e.target.value }))}
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="announcement-ar">{t('admin.announcement.messageAr')}</Label>
            <Input
              id="announcement-ar"
              dir="rtl"
              maxLength={300}
              value={form.message_ar}
              onChange={(e) => setForm((f) => ({ ...f, message_ar: e.target.value }))}
              className="bg-background"
            />
          </div>
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
