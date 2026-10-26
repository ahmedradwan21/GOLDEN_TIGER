'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package, Plus, Search, Pencil, Trash2, Loader2, AlertCircle, Sparkles, GalleryHorizontal, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { BannerStatusBadge } from '@/components/admin/BannerStatusBadge';
import { MAX_AD_PRIORITY, clampPriority, fromLocalInputValue, toLocalInputValue } from '@/lib/homepage-banners';
import { formatPrice } from '@/lib/pricing';
import { useI18n } from '@/context/I18nContext';
import { fmt } from '@/lib/admin-i18n';

interface Product {
  id: string;
  slug: string;
  title: string;
  title_ar?: string | null;
  description_ar?: string | null;
  brand: string | null;
  sku: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock: number;
  is_published: boolean;
  category_id: string;
  rating: number;
  review_count: number;
  tags: string[];
  description?: string;
  short_description?: string | null;
  features?: string[];
  images?: string[];
  video_urls?: string[];
  specifications?: unknown;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  is_sponsored?: boolean;
  is_homepage_banner?: boolean;
  ad_priority?: number;
  banner_image_url?: string | null;
  banner_headline?: string | null;
  banner_subtext?: string | null;
  ad_starts_at?: string | null;
  ad_ends_at?: string | null;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  name_ar?: string | null;
  parent_id: string | null;
}

export default function AdminInventoryPage() {
  const { t, locale } = useI18n();
  const [brands, setBrands] = useState<{id:string;name_en:string;name_ar?:string|null}[]>([]);
  const [newBrand, setNewBrand] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(false);
  const [importSummary, setImportSummary] = useState<{imported:number;updated:number;skipped:number;errors:{row:number;message:string}[]} | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Open a product directly when linked from /admin/banners (?edit=<id>).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('edit');
    if (!id) return;
    fetch(`/api/admin/products/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((full) => {
        if (!full) return;
        setNewBrand(false);
        setSaveError('');
        setIsEditing(true);
        setEditProduct(full);
        setIsDialogOpen(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch('/api/admin/categories');
      if (res.ok) setCategories(await res.json());
    }
    loadCategories();
    fetch('/api/admin/brands').then(r => r.ok ? r.json() : []).then(setBrands).catch(() => {});
  }, []);

  async function handleEdit(product: Product) {
    setNewBrand(false);
    setSaveError('');
    setIsEditing(true);
    setEditProduct(product);
    setIsDialogOpen(true);
    // Load the full product (description, Arabic fields, etc.) — the list only has summary columns.
    try {
      const res = await fetch(`/api/admin/products/${product.id}`);
      if (res.ok) {
        const full = await res.json();
        setEditProduct((cur) => (cur && cur.id === product.id ? { ...cur, ...full } : cur));
      }
    } catch {
      // keep summary data
    }
  }

  function handleCreate() {
    setNewBrand(false);
    setSaveError('');
    setIsEditing(false);
    setEditProduct({
      id: '',
      slug: '',
      title: '',
      title_ar: '',
      description_ar: '',
      brand: null,
      sku: null,
      price_cents: 0,
      compare_at_cents: null,
      stock: 0,
      is_published: true,
      category_id: categories[0]?.id ?? '',
      rating: 0,
      review_count: 0,
      tags: [],
      description: '',
      features: [],
      images: [],
      video_urls: [],
      specifications: null,
      is_sponsored: false,
      is_homepage_banner: false,
      ad_priority: 0,
      banner_image_url: null,
      banner_headline: null,
      banner_subtext: null,
      ad_starts_at: null,
      ad_ends_at: null,
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!editProduct) return;
    setSaving(true);
    try {
      const body = {
        ...editProduct,
        features: editProduct.features ?? [],
        images: editProduct.images ?? [],
        video_urls: editProduct.video_urls ?? [],
        tags: editProduct.tags ?? [],
        price_cents: Number(editProduct.price_cents),
        compare_at_cents: editProduct.compare_at_cents ? Number(editProduct.compare_at_cents) : null,
        stock: Number(editProduct.stock),
      };

      const isEdit = isEditing && !!editProduct.id;
      const url = isEdit ? `/api/admin/products/${editProduct.id}` : '/api/admin/products';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditProduct(null);
        setSaveError('');
        loadProducts();
        fetch('/api/admin/brands').then(r => r.ok ? r.json() : []).then(setBrands).catch(() => {});
      } else {
        const data = await res.json().catch(() => null);
        const code = typeof data?.error === 'string' ? data.error : '';
        const key = `admin.banner.error.${code}`;
        const translated = code ? t(key) : '';
        setSaveError(translated && translated !== key ? translated : code || t('admin.common.saveFailed'));
      }
    } catch {
      setSaveError(t('admin.common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      loadProducts();
    } catch {
      // ignore
    }
  }

  async function handleImport() {
    if (!csvFile) return;
    setImporting(true); setImportError(false); setImportSummary(null);
    try {
      const form = new FormData(); form.set('file', csvFile);
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: form });
      if (!res.ok) throw new Error();
      setImportSummary(await res.json());
      setPage(1); await loadProducts();
      fetch('/api/admin/brands').then(r => r.ok ? r.json() : []).then(setBrands).catch(() => {});
    } catch { setImportError(true); }
    finally { setImporting(false); }
  }

  function updateField<K extends keyof Product>(field: K, value: Product[K]) {
    if (editProduct) setEditProduct({ ...editProduct, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t('admin.inventory.title')}</h1>
          <p className="text-muted mt-1">{fmt(t('admin.inventory.count'), { n: total })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { setImportOpen(true);setImportSummary(null);setImportError(false);setCsvFile(null); }}>{t('admin.import.button')}</Button>
        <Button onClick={handleCreate} className="gold-button">
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.inventory.add')}
        </Button>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={open => {if (!importing) setImportOpen(open);}}>
        <DialogContent className="bg-surface max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{t('admin.import.button')}</DialogTitle></DialogHeader>
          <Button variant="outline" asChild><a href="/api/admin/products/import" download>{t('admin.import.template')}</a></Button>
          <Label htmlFor="csv-upload">{t('admin.import.file')}</Label><Input id="csv-upload" type="file" accept=".csv,text/csv" disabled={importing} onChange={e => setCsvFile(e.target.files?.[0] ?? null)}/>
          {importError && <p role="alert" className="text-danger">{t('admin.import.failed')}</p>}
          {importSummary && <div role="status"><p>{fmt(t('admin.import.summary'),{imported:importSummary.imported,updated:importSummary.updated,skipped:importSummary.skipped})}</p><ul className="mt-3 space-y-2 text-sm text-danger">{importSummary.errors.map((error,i) => <li key={i}>{fmt(t('admin.import.row'),{row:error.row})}: {error.message}</li>)}</ul></div>}
          <DialogFooter><Button variant="outline" disabled={importing} onClick={() => setImportOpen(false)}>{t('admin.common.cancel')}</Button><Button className="gold-button" disabled={!csvFile || importing} onClick={handleImport}>{importing && <Loader2 className="h-4 w-4 me-2 animate-spin"/>}{t('admin.import.upload')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder={t('admin.inventory.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-surface"
        />
      </div>

      {/* Products table */}
      <Card className="bg-surface border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Package className="w-12 h-12 mb-3" />
            <p>{t('admin.inventory.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase">
                  <th className="text-left py-3 px-4">{t('admin.inventory.colProduct')}</th>
                  <th className="text-left py-3 px-4">{t('admin.inventory.colSku')}</th>
                  <th className="text-right py-3 px-4">{t('admin.inventory.colPrice')}</th>
                  <th className="text-right py-3 px-4">{t('admin.inventory.colStock')}</th>
                  <th className="text-center py-3 px-4">{t('admin.common.status')}</th>
                  <th className="text-right py-3 px-4">{t('admin.common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-text">{p.title}</div>
                      <div className="text-xs text-muted">{p.brand ?? t('admin.inventory.noBrand')}</div>
                    </td>
                    <td className="py-3 px-4 text-muted">{p.sku ?? '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-semibold text-gold">{formatPrice(p.price_cents)}</div>
                      {p.compare_at_cents && (
                        <div className="text-xs text-muted line-through">{formatPrice(p.compare_at_cents)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        p.stock === 0 ? 'text-danger' : p.stock < 10 ? 'text-tiger-orange' : 'text-text'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={p.is_published ? 'default' : 'secondary'} className={p.is_published ? 'bg-green-500/20 text-green-400' : ''}>
                        {p.is_published ? t('admin.inventory.live') : t('admin.inventory.hidden')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-muted hover:text-gold transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-2 text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted">{fmt(t('admin.common.page'), { page, total: totalPages })}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                {t('admin.common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('admin.common.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-surface border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? t('admin.inventory.edit') : t('admin.inventory.new')}</DialogTitle>
          </DialogHeader>

          {editProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.product.title')}</Label>
                  <Input
                    value={editProduct.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.product.slug')}</Label>
                  <Input
                    value={editProduct.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.titleAr')} <span className="text-xs text-muted">{t('admin.common.optional')}</span></Label>
                <Input
                  dir="rtl"
                  value={editProduct.title_ar ?? ''}
                  onChange={(e) => updateField('title_ar', e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted">{t('admin.product.arabicNote')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.product.brand')}</Label>
                  <Select value={newBrand ? '__new' : editProduct.brand || '__none'} onValueChange={value => { setNewBrand(value === '__new');updateField('brand', value === '__new' || value === '__none' ? null : value); }}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder={t('admin.import.selectBrand')}/></SelectTrigger>
                    <SelectContent><SelectItem value="__none">{t('admin.import.none')}</SelectItem>
                      {editProduct.brand && !brands.some(b => b.name_en === editProduct.brand) && !newBrand && <SelectItem value={editProduct.brand}>{editProduct.brand}</SelectItem>}
                      {brands.map(b => <SelectItem key={b.id} value={b.name_en}>{locale === 'ar' && b.name_ar?.trim() ? b.name_ar : b.name_en}</SelectItem>)}
                      <SelectItem value="__new">{t('admin.import.addBrand')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {newBrand && <Input aria-label={t('admin.import.newBrand')} placeholder={t('admin.import.newBrand')} value={editProduct.brand ?? ''} onChange={e => updateField('brand', e.target.value || null)}/> }
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.product.sku')}</Label>
                  <Input
                    value={editProduct.sku ?? ''}
                    onChange={(e) => updateField('sku', e.target.value || null)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.category')}</Label>
                <Select
                  value={editProduct.category_id}
                  onValueChange={(v) => updateField('category_id', v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t('admin.product.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{locale === 'ar' && c.name_ar?.trim() ? c.name_ar : c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.product.price')}</Label>
                  <Input
                    type="number"
                    value={editProduct.price_cents}
                    onChange={(e) => updateField('price_cents', Number(e.target.value))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.product.compareAt')}</Label>
                  <Input
                    type="number"
                    value={editProduct.compare_at_cents ?? ''}
                    onChange={(e) => updateField('compare_at_cents', e.target.value ? Number(e.target.value) : null)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.product.stock')}</Label>
                  <Input
                    type="number"
                    value={editProduct.stock}
                    onChange={(e) => updateField('stock', Number(e.target.value))}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.shortDescription')}</Label>
                <Input
                  value={editProduct.short_description ?? ''}
                  onChange={(e) => updateField('short_description', e.target.value || null)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.description')}</Label>
                <Textarea
                  value={editProduct.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.descriptionAr')} <span className="text-xs text-muted">{t('admin.common.optional')}</span></Label>
                <Textarea
                  dir="rtl"
                  value={editProduct.description_ar ?? ''}
                  onChange={(e) => updateField('description_ar', e.target.value)}
                  rows={4}
                  className="bg-background"
                />
                <p className="text-xs text-muted">{t('admin.product.arabicNote')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.tags')}</Label>
                <Input
                  value={(editProduct.tags ?? []).join(', ')}
                  onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.features')}</Label>
                <Textarea
                  value={(editProduct.features ?? []).join('\n')}
                  onChange={(e) => updateField('features', e.target.value.split('\n').map(f => f.trim()).filter(Boolean))}
                  rows={4}
                  placeholder={t('admin.product.featuresPlaceholder')}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.images')}</Label>
                <Textarea
                  value={(editProduct.images ?? []).join('\n')}
                  onChange={(e) => updateField('images', e.target.value.split('\n').map(u => u.trim()).filter(Boolean))}
                  rows={4}
                  placeholder={'https://images.pexels.com/...\nhttps://images.pexels.com/...'}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.videos')}</Label>
                <Textarea
                  value={(editProduct.video_urls ?? []).join('\n')}
                  onChange={(e) => updateField('video_urls', e.target.value.split('\n').map(u => u.trim()).filter(Boolean))}
                  rows={2}
                  placeholder={'https://www.youtube.com/watch?v=...'}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.seoTitle')}</Label>
                <Input
                  value={editProduct.seo_title ?? ''}
                  onChange={(e) => updateField('seo_title', e.target.value || null)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.seoDescription')}</Label>
                <Textarea
                  value={editProduct.seo_description ?? ''}
                  onChange={(e) => updateField('seo_description', e.target.value || null)}
                  rows={2}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.product.seoKeywords')}</Label>
                <Textarea
                  value={editProduct.seo_keywords ?? ''}
                  onChange={(e) => updateField('seo_keywords', e.target.value || null)}
                  rows={2}
                  placeholder={'keyword1, keyword2, keyword3'}
                  className="bg-background"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t('admin.product.published')}</Label>
                <Switch
                  checked={editProduct.is_published}
                  onCheckedChange={(v) => updateField('is_published', v)}
                />
              </div>

              {/* Sponsored search placement */}
              <div className="border border-border rounded-lg p-4 bg-background/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-gold mt-0.5" />
                    <div>
                      <Label>{t('admin.product.sponsored')}</Label>
                      <p className="text-xs text-muted mt-0.5">{t('admin.product.sponsoredDesc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={editProduct.is_sponsored ?? false}
                    onCheckedChange={(v) => updateField('is_sponsored', v)}
                  />
                </div>
              </div>

              {/* Homepage Banner */}
              <section className="border border-gold/30 rounded-lg p-4 space-y-4 bg-background/50" aria-labelledby="homepage-banner-heading">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <GalleryHorizontal className="w-4 h-4 text-gold mt-0.5" />
                    <div>
                      <h3 id="homepage-banner-heading" className="text-sm font-semibold text-gold">{t('admin.banner.section')}</h3>
                      <p className="text-xs text-muted mt-0.5">{t('admin.product.homepageBannerDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {editProduct.is_homepage_banner && (
                      <BannerStatusBadge row={editProduct} isPublished={editProduct.is_published} />
                    )}
                    <Switch
                      checked={editProduct.is_homepage_banner ?? false}
                      onCheckedChange={(v) => updateField('is_homepage_banner', v)}
                      aria-label={t('admin.banner.section')}
                    />
                  </div>
                </div>

                {(editProduct.is_homepage_banner || editProduct.is_sponsored) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t('admin.banner.priority')}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={MAX_AD_PRIORITY}
                        value={editProduct.ad_priority ?? 0}
                        onChange={(e) => updateField('ad_priority', clampPriority(e.target.value))}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted">{t('admin.product.adPriorityDesc')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.banner.startsAt')}</Label>
                      <Input
                        type="datetime-local"
                        value={toLocalInputValue(editProduct.ad_starts_at)}
                        onChange={(e) => updateField('ad_starts_at', fromLocalInputValue(e.target.value))}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted">{t('admin.banner.startsHint')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.banner.endsAt')}</Label>
                      <Input
                        type="datetime-local"
                        value={toLocalInputValue(editProduct.ad_ends_at)}
                        min={toLocalInputValue(editProduct.ad_starts_at) || undefined}
                        onChange={(e) => updateField('ad_ends_at', fromLocalInputValue(e.target.value))}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted">{t('admin.banner.endsHint')}</p>
                    </div>
                  </div>
                )}

                {editProduct.is_homepage_banner && (
                  <>
                    <div className="space-y-2">
                      <Label>{t('admin.product.bannerImage')}</Label>
                      <Input
                        value={editProduct.banner_image_url ?? ''}
                        onChange={(e) => updateField('banner_image_url', e.target.value || null)}
                        className="bg-background"
                        placeholder={t('admin.product.bannerImagePh')}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.product.bannerHeadline')}</Label>
                      <Input
                        value={editProduct.banner_headline ?? ''}
                        onChange={(e) => updateField('banner_headline', e.target.value || null)}
                        className="bg-background"
                        placeholder={t('admin.product.bannerHeadlinePh')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.product.bannerSubtext')}</Label>
                      <Textarea
                        value={editProduct.banner_subtext ?? ''}
                        onChange={(e) => updateField('banner_subtext', e.target.value || null)}
                        className="bg-background min-h-[64px]"
                        placeholder={t('admin.product.bannerSubtextPh')}
                      />
                    </div>

                    {/* Live preview of the slide */}
                    <div className="space-y-2">
                      <Label>{t('admin.banner.preview')}</Label>
                      <div className="relative aspect-[16/6] overflow-hidden rounded-md bg-surface-elevated">
                        {(editProduct.banner_image_url || editProduct.images?.[0]) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editProduct.banner_image_url || editProduct.images?.[0]}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted">
                            <ImageOff className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        <div className="absolute bottom-0 start-0 p-4 max-w-[80%]">
                          <p className="font-heading text-lg font-bold text-text leading-tight line-clamp-2">
                            {editProduct.banner_headline || editProduct.title || t('admin.banner.previewHeadline')}
                          </p>
                          {(editProduct.banner_subtext || editProduct.short_description) && (
                            <p className="text-xs text-muted mt-1 line-clamp-2">
                              {editProduct.banner_subtext || editProduct.short_description}
                            </p>
                          )}
                        </div>
                      </div>
                      {!editProduct.is_published && (
                        <p className="text-xs text-danger">{t('admin.banner.unpublishedHint')}</p>
                      )}
                      <Link href="/admin/banners" className="inline-block text-xs text-gold hover:underline">
                        {t('admin.banner.manageAll')}
                      </Link>
                    </div>
                  </>
                )}
              </section>
            </div>
          )}

          {saveError && (
            <p className="text-sm text-danger flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {saveError}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('admin.common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="gold-button">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger" />
              {t('admin.inventory.deleteTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted py-4">{t('admin.inventory.deleteConfirm')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('admin.common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('admin.common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
