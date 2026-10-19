'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader as Loader2, Save, Share2, ExternalLink } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/db';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type CommunityLink = Database['public']['Tables']['social_community_links']['Row'];

interface EditableLink {
  id: string;
  platform: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  url: string;
  is_visible: boolean;
  sort_order: number;
}

function toEditable(row: CommunityLink): EditableLink {
  return {
    id: row.id,
    platform: row.platform,
    name_en: row.name_en,
    name_ar: row.name_ar,
    description_en: row.description_en,
    description_ar: row.description_ar,
    url: row.url,
    is_visible: row.is_visible,
    sort_order: row.sort_order,
  };
}

export default function AdminCommunityPage() {
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [links, setLinks] = useState<EditableLink[]>([]);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase
        .from('social_community_links')
        .select('*')
        .order('sort_order', { ascending: true });

      if (loadError) {
        setError(loadError.message);
        return;
      }
      setLinks((data ?? []).map(toEditable));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  function updateField<K extends keyof EditableLink>(
    id: string,
    field: K,
    value: EditableLink[K],
  ) {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)),
    );
  }

  async function handleSave(link: EditableLink) {
    setSavingId(link.id);
    setError('');
    try {
      const payload = {
        name_en: link.name_en.trim(),
        name_ar: link.name_ar.trim(),
        description_en: link.description_en.trim(),
        description_ar: link.description_ar.trim(),
        url: link.url.trim(),
        is_visible: link.is_visible,
        sort_order: link.sort_order,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('social_community_links')
        .update(payload)
        .eq('id', link.id);

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
        return;
      }

      toast.success(
        isRtl
          ? `تم حفظ قناة ${link.name_ar}`
          : `Saved channel ${link.name_en}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save channel';
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">
          إدارة قنوات التواصل والعروض
        </h1>
        <p
          className="text-muted mt-1"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {isRtl
            ? 'تحكم في أسماء القنوات، الأوصاف، الروابط، وظهور كل قناة على صفحة المجتمع.'
            : 'Manage channel names, descriptions, links, and visibility on the community page.'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : links.length === 0 ? (
        <Card className="bg-surface border-border p-10 text-center">
          <Share2 className="w-10 h-10 mx-auto text-muted mb-3" />
          <p className="text-muted">
            {isRtl
              ? 'لا توجد قنوات في قاعدة البيانات.'
              : 'No channels found in the database.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {links.map((link) => (
            <Card
              key={link.id}
              className="bg-surface border-border p-6 space-y-5"
            >
              {/* Header: platform + visibility toggle */}
              <div
                className={cn(
                  'flex items-center justify-between gap-4',
                  isRtl && 'flex-row-reverse',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold/10 text-gold">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text capitalize">
                      {link.platform}
                    </p>
                    <p className="text-xs text-muted" dir="ltr">
                      {link.url}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2',
                    isRtl && 'flex-row-reverse',
                  )}
                >
                  <span className="text-xs font-medium text-muted">
                    {isRtl ? 'ظاهر' : 'Visible'}
                  </span>
                  <Switch
                    checked={link.is_visible}
                    onCheckedChange={(checked) =>
                      updateField(link.id, 'is_visible', checked)
                    }
                    aria-label={isRtl ? 'ظهور القناة' : 'Channel visibility'}
                  />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {isRtl ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={link.name_en}
                    onChange={(e) => updateField(link.id, 'name_en', e.target.value)}
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={link.name_ar}
                    onChange={(e) => updateField(link.id, 'name_ar', e.target.value)}
                    dir="rtl"
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {isRtl ? 'الوصف (إنجليزي)' : 'Description (English)'}
                  </label>
                  <textarea
                    value={link.description_en}
                    onChange={(e) =>
                      updateField(link.id, 'description_en', e.target.value)
                    }
                    rows={3}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-text focus-ring resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {isRtl ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </label>
                  <textarea
                    value={link.description_ar}
                    onChange={(e) =>
                      updateField(link.id, 'description_ar', e.target.value)
                    }
                    rows={3}
                    dir="rtl"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-text focus-ring resize-y"
                  />
                </div>
              </div>

              {/* URL + sort order */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-5">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {isRtl ? 'الرابط' : 'Link URL'}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateField(link.id, 'url', e.target.value)}
                      dir="ltr"
                      className="w-full h-10 px-3 pr-10 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                    />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-1/2 -translate-y-1/2 right-2 text-muted hover:text-gold"
                      aria-label={isRtl ? 'فتح الرابط' : 'Open link'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    {isRtl ? 'ترتيب العرض' : 'Sort order'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={link.sort_order}
                    onChange={(e) =>
                      updateField(link.id, 'sort_order', Number(e.target.value))
                    }
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                  />
                </div>
              </div>

              {/* Save button per channel */}
              <div className={cn('flex', isRtl && 'flex-row-reverse')}>
                <Button
                  onClick={() => handleSave(link)}
                  disabled={savingId === link.id}
                  className="gold-button"
                >
                  {savingId === link.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {savingId === link.id
                    ? isRtl
                      ? 'جارٍ الحفظ...'
                      : 'Saving...'
                    : isRtl
                      ? 'حفظ القناة'
                      : 'Save channel'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-danger" dir={isRtl ? 'rtl' : 'ltr'}>
          {error}
        </p>
      )}
    </div>
  );
}
