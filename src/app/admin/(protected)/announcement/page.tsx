'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader as Loader2, Save, Megaphone } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type AnnouncementBarRow = Database['public']['Tables']['announcement_bar_settings']['Row'];

const DEFAULT_BG = '#0B0B0F';
const DEFAULT_TEXT = '#F5F1E6';

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminAnnouncementPage() {
  const { dir } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [isEnabled, setIsEnabled] = useState(true);
  const [messageEn, setMessageEn] = useState('');
  const [messageAr, setMessageAr] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BG);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcement', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Failed to load settings');
        return;
      }

      const payload = await res.json();
      const row: AnnouncementBarRow | null = payload.settings ?? null;
      if (row) {
        setIsEnabled(row.is_enabled);
        setMessageEn(row.message_en ?? '');
        setMessageAr(row.message_ar ?? '');
        setLinkUrl(row.link_url ?? '');
        setBackgroundColor(row.background_color ?? DEFAULT_BG);
        setTextColor(row.text_color ?? DEFAULT_TEXT);
        setStartsAt(toDatetimeLocal(row.starts_at));
        setEndsAt(toDatetimeLocal(row.ends_at));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        is_enabled: isEnabled,
        message_en: messageEn.trim(),
        message_ar: messageAr.trim(),
        link_url: linkUrl.trim() || null,
        background_color: backgroundColor,
        text_color: textColor,
        starts_at: fromDatetimeLocal(startsAt),
        ends_at: fromDatetimeLocal(endsAt),
      };

      const res = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error ?? 'Failed to save settings';
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        dir === 'rtl' ? 'تم حفظ إعدادات شريط الإعلانات' : 'Announcement bar settings saved'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">
          إعدادات شحن وشريط الإعلانات العلوي
        </h1>
        <p className="text-muted mt-1" dir={dir === 'rtl' ? 'rtl' : 'ltr'}>
          {dir === 'rtl'
            ? 'تحكم في الشريط الإعلاني العلوي: الرسالة، الألوان، الرابط، وجدولة العرض.'
            : 'Control the top announcement bar: message, colors, link, and scheduling.'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : (
        <Card className="bg-surface border-border p-6 space-y-6">
          {/* Enable toggle */}
          <div className={cn('flex items-center justify-between gap-4', dir === 'rtl' && 'flex-row-reverse')}>
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-semibold text-text">
                  {dir === 'rtl' ? 'تفعيل الشريط' : 'Enable announcement bar'}
                </p>
                <p className="text-xs text-muted">
                  {dir === 'rtl' ? 'إظهار أو إخفاء الشريط على الواجهة' : 'Show or hide the bar on the storefront'}
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              aria-label={dir === 'rtl' ? 'تفعيل الشريط' : 'Enable bar'}
            />
          </div>

          <div className="h-px bg-border" />

          {/* Messages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {dir === 'rtl' ? 'الرسالة (إنجليزي)' : 'Message (English)'}
              </label>
              <input
                type="text"
                value={messageEn}
                onChange={(e) => setMessageEn(e.target.value)}
                maxLength={300}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {dir === 'rtl' ? 'الرسالة (عربي)' : 'Message (Arabic)'}
              </label>
              <input
                type="text"
                value={messageAr}
                onChange={(e) => setMessageAr(e.target.value)}
                maxLength={300}
                dir="rtl"
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
              />
            </div>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              {dir === 'rtl' ? 'رابط النقر (اختياري)' : 'Click-through link (optional)'}
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/deals-of-the-day"
              dir="ltr"
              className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
            />
            <p className="text-xs text-muted mt-1">
              {dir === 'rtl'
                ? 'اتركه فارغاً لشريط غير قابل للنقر. استخدم رابطاً داخلياً مثل /deals-of-the-day أو رابطاً خارجياً.'
                : 'Leave blank for a non-clickable bar. Use an internal path like /deals-of-the-day or a full URL.'}
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {dir === 'rtl' ? 'لون الخلفية' : 'Background color'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-border bg-background cursor-pointer p-1"
                  aria-label={dir === 'rtl' ? 'لون الخلفية' : 'Background color picker'}
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  dir="ltr"
                  className="flex-1 h-10 px-3 rounded-lg bg-background border border-border text-sm font-mono text-text focus-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {dir === 'rtl' ? 'لون النص' : 'Text color'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-border bg-background cursor-pointer p-1"
                  aria-label={dir === 'rtl' ? 'لون النص' : 'Text color picker'}
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  dir="ltr"
                  className="flex-1 h-10 px-3 rounded-lg bg-background border border-border text-sm font-mono text-text focus-ring"
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              {dir === 'rtl' ? 'معاينة' : 'Live preview'}
            </label>
            <div
              className="rounded-lg px-4 py-2.5 text-center text-sm font-medium"
              style={{ backgroundColor, color: textColor }}
            >
              <span dir={dir === 'rtl' ? 'rtl' : 'ltr'}>
                {(dir === 'rtl' ? messageAr : messageEn) || (dir === 'rtl' ? 'الرسالة هنا' : 'Your message here')}
              </span>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {dir === 'rtl' ? 'تاريخ ووقت البدء (اختياري)' : 'Start date & time (optional)'}
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {dir === 'rtl' ? 'تاريخ ووقت الانتهاء (اختياري)' : 'End date & time (optional)'}
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            {dir === 'rtl'
              ? 'اترك الحقول فارغة لعرض الشريط دائماً (طالما أنه مفعّل).'
              : 'Leave both fields blank to always show the bar (while enabled).'}
          </p>

          {error && (
            <p className="text-sm text-danger" dir={dir === 'rtl' ? 'rtl' : 'ltr'}>
              {error}
            </p>
          )}

          <div className={cn('flex', dir === 'rtl' && 'flex-row-reverse')}>
            <Button onClick={handleSave} disabled={saving} className="gold-button">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving
                ? dir === 'rtl' ? 'جارٍ الحفظ...' : 'Saving...'
                : dir === 'rtl' ? 'حفظ الإعدادات' : 'Save settings'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
