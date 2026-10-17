'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader as Loader2, Save, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentData {
  id: string;
  page_key: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  updated_at: string;
}

const PAGE_KEYS = [
  { key: 'our_story', labelKey: 'admin.content.ourStory' },
  { key: 'privacy', labelKey: 'admin.content.privacy' },
  { key: 'terms', labelKey: 'admin.content.terms' },
];

export default function AdminContentPage() {
  const { t, dir } = useI18n();
  const [selectedKey, setSelectedKey] = useState('our_story');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/site-content?pageKey=${selectedKey}`);
      if (res.ok) {
        const data = await res.json();
        const c: ContentData | null = data.content;
        setTitleEn(c?.title_en ?? '');
        setTitleAr(c?.title_ar ?? '');
        setBodyEn(c?.body_en ?? '');
        setBodyAr(c?.body_ar ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageKey: selectedKey, titleEn, titleAr, bodyEn, bodyAr }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t('admin.content.error'));
        setSaving(false);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t('admin.content.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t('admin.content.title')}</h1>
        <p className="text-muted mt-1">{t('admin.content.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PAGE_KEYS.map((pg) => (
          <button
            key={pg.key}
            onClick={() => setSelectedKey(pg.key)}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              selectedKey === pg.key
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-muted hover:text-text border border-border'
            )}
          >
            <FileText className="w-4 h-4" />
            {t(pg.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : (
        <Card className="bg-surface border-border p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.content.titleEn')}</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                maxLength={500}
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.content.titleAr')}</label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                maxLength={500}
                dir="rtl"
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.content.bodyEn')}</label>
            <textarea
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              rows={10}
              className="w-full p-3 rounded-lg bg-background border border-border text-sm text-text focus-ring resize-y font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.content.bodyAr')}</label>
            <textarea
              value={bodyAr}
              onChange={(e) => setBodyAr(e.target.value)}
              rows={10}
              dir="rtl"
              className="w-full p-3 rounded-lg bg-background border border-border text-sm text-text focus-ring resize-y font-mono"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">{t('admin.content.saved')}</p>}

          <div className={cn('flex', dir === 'rtl' && 'flex-row-reverse')}>
            <Button onClick={handleSave} disabled={saving} className="gold-button">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? t('admin.content.saving') : t('admin.content.save')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
