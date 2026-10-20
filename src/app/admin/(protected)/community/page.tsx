'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader as Loader2, Save, Share2, ExternalLink, Trash2, Plus } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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

interface NewLinkForm {
  platform: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  url: string;
  sort_order: number;
}

const EMPTY_FORM: NewLinkForm = {
  platform: '',
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
  url: '',
  sort_order: 0,
};

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring';
const textareaClass =
  'w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-text focus-ring resize-y';

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

async function parseErrorResponse(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.error === 'string' ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export default function AdminCommunityPage() {
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [links, setLinks] = useState<EditableLink[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<NewLinkForm>(EMPTY_FORM);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/community-links', { cache: 'no-store' });
      if (!res.ok) {
        setError(await parseErrorResponse(res, 'Failed to load channels'));
        return;
      }
      const data = await res.json();
      setLinks(((data.links ?? []) as CommunityLink[]).map(toEditable));
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

  function updateFormField<K extends keyof NewLinkForm>(field: K, value: NewLinkForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(link: EditableLink) {
    setSavingId(link.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/community-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_en: link.name_en.trim(),
          name_ar: link.name_ar.trim(),
          description_en: link.description_en.trim(),
          description_ar: link.description_ar.trim(),
          url: link.url.trim(),
          is_visible: link.is_visible,
          sort_order: link.sort_order,
        }),
      });

      if (!res.ok) {
        const msg = await parseErrorResponse(res, 'Failed to save channel');
        setError(msg);
        toast.error(msg);
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

  async function handleDelete(link: EditableLink) {
    const confirmed = window.confirm(
      isRtl
        ? `حذف قناة ${link.name_ar} نهائياً؟`
        : `Permanently delete channel ${link.name_en}?`,
    );
    if (!confirmed) return;

    setDeletingId(link.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/community-links/${link.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const msg = await parseErrorResponse(res, 'Failed to delete channel');
        setError(msg);
        toast.error(msg);
        return;
      }

      setLinks((prev) => prev.filter((item) => item.id !== link.id));
      toast.success(
        isRtl ? `تم حذف قناة ${link.name_ar}` : `Deleted channel ${link.name_en}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete channel';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/admin/community-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform.trim(),
          name_en: form.name_en.trim(),
          name_ar: form.name_ar.trim(),
          description_en: form.description_en.trim(),
          description_ar: form.description_ar.trim(),
          url: form.url.trim(),
          sort_order: form.sort_order,
        }),
      });

      if (!res.ok) {
        const msg = await parseErrorResponse(res, 'Failed to add channel');
        setError(msg);
        toast.error(msg);
        return;
      }

      const data = await res.json();
      setLinks((prev) =>
        [...prev, toEditable(data.link as CommunityLink)].sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      );
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      toast.success(
        isRtl ? `تمت إضافة قناة ${form.name_ar}` : `Added channel ${form.name_en}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add channel';
      setError(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
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

      {/* Add channel */}
      <div className={cn('flex', isRtl && 'flex-row-reverse')}>
        <Button
          onClick={() => setShowAddForm((prev) => !prev)}
          variant="outline"
          className="border-gold/40 text-gold hover:bg-gold/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showAddForm
            ? isRtl
              ? 'إلغاء الإضافة'
              : 'Cancel'
            : isRtl
              ? 'إضافة قناة جديدة'
              : 'Add new channel'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-surface border-border p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold/10 text-gold">
              <Share2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-text">
              {isRtl ? 'قناة جديدة' : 'New channel'}
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {isRtl ? 'المنصة (مثل: telegram)' : 'Platform (e.g. telegram)'}
                </label>
                <input
                  type="text"
                  required
                  value={form.platform}
                  onChange={(e) => updateFormField('platform', e.target.value)}
                  dir="ltr"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {isRtl ? 'ترتيب العرض' : 'Sort order'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => updateFormField('sort_order', Number(e.target.value))}
                  dir="ltr"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {isRtl ? 'الاسم (إنجليزي)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={form.name_en}
                  onChange={(e) => updateFormField('name_en', e.target.value)}
                  dir="ltr"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={form.name_ar}
                  onChange={(e) => updateFormField('name_ar', e.target.value)}
                  dir="rtl"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {isRtl ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => updateFormField('description_en', e.target.value)}
                  rows={3}
                  dir="ltr"
                  className={textareaClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {isRtl ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  value={form.description_ar}
                  onChange={(e) => updateFormField('description_ar', e.target.value)}
                  rows={3}
                  dir="rtl"
                  className={textareaClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {isRtl ? 'الرابط' : 'Link URL'}
              </label>
              <input
                type="url"
                required
                placeholder="https://"
                value={form.url}
                onChange={(e) => updateFormField('url', e.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </div>

            <div className={cn('flex', isRtl && 'flex-row-reverse')}>
              <Button type="submit" disabled={adding} className="gold-button">
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {adding
                  ? isRtl
                    ? 'جارٍ الإضافة...'
                    : 'Adding...'
                  : isRtl
                    ? 'إضافة القناة'
                    : 'Add channel'}
              </Button>
            </div>
          </form>
        </Card>
      )}

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
                    className={inputClass}
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
                    className={inputClass}
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
                    className={textareaClass}
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
                    className={textareaClass}
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
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Actions per channel */}
              <div
                className={cn(
                  'flex items-center gap-3',
                  isRtl && 'flex-row-reverse',
                )}
              >
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
                <Button
                  onClick={() => handleDelete(link)}
                  disabled={deletingId === link.id}
                  variant="outline"
                  className="border-danger/40 text-danger hover:bg-danger/10"
                >
                  {deletingId === link.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {isRtl ? 'حذف القناة' : 'Delete channel'}
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
