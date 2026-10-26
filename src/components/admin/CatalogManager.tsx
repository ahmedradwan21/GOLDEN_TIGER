'use client';
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useI18n } from '@/context/I18nContext';
import { brandSlug } from '@/lib/admin-catalog';
import { fmt } from '@/lib/admin-i18n';
import { SafeImage } from '@/components/ui/SafeImage';

type Kind = 'brands' | 'categories' | 'coupons';
type Row = { id?: string; [key: string]: string | number | boolean | null | undefined };
type Field = { key: string; label: string; type?: 'number' | 'url' | 'email' | 'datetime-local' | 'switch' | 'discount'; optional?: boolean };
const fields: Record<Kind, Field[]> = {
  brands: [{ key:'name_en',label:'nameEn' }, { key:'name_ar',label:'nameAr',optional:true }, { key:'slug',label:'slug' }, { key:'logo_url',label:'logo',type:'url',optional:true }, { key:'sort_order',label:'sort',type:'number' }, { key:'is_active',label:'active',type:'switch' }],
  categories: [{ key:'name',label:'nameEn' }, { key:'name_ar',label:'nameAr',optional:true }, { key:'slug',label:'slug' }, { key:'image_url',label:'image',type:'url',optional:true }, { key:'sort_order',label:'sort',type:'number' }],
  coupons: [{ key:'code',label:'code' }, { key:'title_en',label:'titleEn',optional:true }, { key:'title_ar',label:'titleAr',optional:true }, { key:'discount_type',label:'discountType',type:'discount' }, { key:'value',label:'value',type:'number' }, { key:'max_uses',label:'maxUses',type:'number',optional:true }, { key:'expires_at',label:'expiry',type:'datetime-local',optional:true }, { key:'image_url',label:'image',type:'url',optional:true }, { key:'is_reward',label:'reward',type:'switch' }, { key:'customer_email',label:'email',type:'email',optional:true }],
};
const empty: Record<Kind, Row> = {
  brands: { name_en:'',name_ar:'',slug:'',logo_url:null,sort_order:0,is_active:true },
  categories: { name:'',name_ar:'',slug:'',image_url:null,parent_id:null,sort_order:0 },
  coupons: { code:'',title_en:'',title_ar:'',discount_type:'percentage',value:0,max_uses:null,expires_at:null,image_url:null,is_reward:false,customer_email:null },
};
export function CatalogManager({ kind }: { kind: Kind }) {
  const { t, dir, locale } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`/api/admin/${kind}`); if (!res.ok) throw new Error(); setRows(await res.json()); }
    catch { setError('admin.catalog.loadFailed'); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { load(); }, [load]);
  function edit(row: Row) {
    const copy = { ...row };
    if (copy.expires_at) {
      const date = new Date(String(copy.expires_at));
      copy.expires_at = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    }
    setError(''); setDraft(copy);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!draft) return; setBusy(true); setError('');
    try {
      const body = { ...draft };
      if (kind === 'coupons' && body.expires_at) body.expires_at = new Date(String(body.expires_at)).toISOString();
      const res = await fetch(`/api/admin/${kind}`, { method: draft.id ? 'PATCH' : 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setDraft(null); await load();
    } catch { setError('admin.common.saveFailed'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting?.id) return; setBusy(true); setError('');
    try {
      const res = await fetch(`/api/admin/${kind}?id=${encodeURIComponent(deleting.id)}`, { method:'DELETE' });
      if (res.status === 409) { setError('admin.catalog.attached'); return; }
      if (!res.ok) throw new Error();
      setDeleting(null); await load();
    } catch { setError('admin.catalog.deleteFailed'); }
    finally { setBusy(false); }
  }
  const visible = rows.filter(row => Object.values(row).some(value => String(value ?? '').toLowerCase().includes(search.toLowerCase())));
  return <div className="space-y-6" dir={dir}>
    <div className="flex flex-wrap justify-between items-center gap-4"><h1 className="font-heading text-3xl font-bold">{t(`admin.nav.${kind}`)}</h1><Button onClick={() => edit(empty[kind])} className="gold-button"><Plus className="h-4 w-4 me-2"/>{t('admin.common.add')}</Button></div>
    {error && <p role="alert" className="text-danger">{t(error)}</p>}
    <Input aria-label={t('admin.catalog.search')} placeholder={t('admin.catalog.search')} className="max-w-md" value={search} onChange={e => setSearch(e.target.value)}/>
    {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="overflow-x-auto border border-border rounded-lg"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-surface">
      {fields[kind].map(field => <th key={field.key} className="text-start p-3 whitespace-nowrap">{t(`admin.catalog.${field.label}`)}</th>)}
      {kind === 'categories' && <th className="text-start p-3">{t('admin.catalog.products')}</th>}
      {kind === 'coupons' && <th className="text-start p-3">{t('admin.catalog.uses')}</th>}
      <th className="p-3">{t('admin.common.actions')}</th></tr></thead><tbody>
      {visible.map(row => <tr key={row.id} className="border-b border-border">
        {fields[kind].map(field => <td key={field.key} className="p-3 max-w-56 break-words">{field.type === 'switch' ? (row[field.key] ? t('admin.catalog.yes') : t('admin.catalog.no')) : field.type === 'discount' ? t(`admin.catalog.${row[field.key]}`) : field.type === 'url' ? row[field.key] ? <SafeImage src={String(row[field.key])} alt={String(row.name_en ?? row.title_en ?? row.name ?? '')} width={64} height={40} className="object-contain"/> : '—' : field.type === 'datetime-local' && row[field.key] ? new Date(String(row[field.key])).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US') : String(row[field.key] ?? '—')}</td>)}
        {kind === 'categories' && <td className="p-3">{row.products_count}</td>}{kind === 'coupons' && <td className="p-3">{row.uses_count ?? 0}</td>}
        <td className="p-3"><div className="flex"><Button size="icon" variant="ghost" title={t('admin.catalog.edit')} aria-label={t('admin.catalog.edit')} onClick={() => edit(row)}><Pencil className="h-4 w-4"/></Button><Button size="icon" variant="ghost" title={t('admin.common.delete')} aria-label={t('admin.common.delete')} onClick={() => {setError('');setDeleting(row);}}><Trash2 className="h-4 w-4"/></Button></div></td>
      </tr>)}{visible.length === 0 && <tr><td colSpan={fields[kind].length + 3} className="p-8 text-center text-muted">{t('admin.catalog.empty')}</td></tr>}</tbody></table></div>}
    <Dialog open={!!draft} onOpenChange={open => { if (!open && !busy) setDraft(null); }}><DialogContent dir={dir} className="bg-surface max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{t(draft?.id ? 'admin.catalog.edit' : 'admin.common.add')} — {t(`admin.nav.${kind}`)}</DialogTitle></DialogHeader>
      {draft && <form onSubmit={save} className="space-y-4">{error && <p role="alert" className="text-danger">{t(error)}</p>}<div className="grid sm:grid-cols-2 gap-4">{fields[kind].map(field => <div key={field.key} className="space-y-2"><Label htmlFor={field.key}>{t(`admin.catalog.${field.label}`)} {field.optional && t('admin.common.optional')}</Label>
        {field.type === 'switch' ? <Switch id={field.key} checked={!!draft[field.key]} onCheckedChange={value => setDraft({...draft,[field.key]:value})}/> : field.type === 'discount' ? <select id={field.key} className="w-full bg-background border border-border rounded-md h-10 px-3" value={String(draft[field.key])} onChange={e => setDraft({...draft,[field.key]:e.target.value})}><option value="percentage">{t('admin.catalog.percentage')}</option><option value="fixed">{t('admin.catalog.fixed')}</option></select> : <Input id={field.key} type={field.type ?? 'text'} required={!field.optional} min={field.type === 'number' && field.key !== 'sort_order' ? (field.key === 'max_uses' ? 1 : 0) : undefined} max={field.key === 'value' && draft.discount_type === 'percentage' ? 100 : undefined} step={field.type === 'number' ? 1 : undefined} dir={field.key.endsWith('_ar') ? 'rtl' : undefined} value={String(draft[field.key] ?? '')} onChange={e => {
          const value = field.type === 'number' ? (e.target.value === '' && field.optional ? null : Number(e.target.value)) : e.target.value || (field.optional && !field.key.endsWith('_ar') && !field.key.startsWith('title_') ? null : '');
          const next = {...draft,[field.key]:value};
          if ((field.key === 'name_en' || field.key === 'name') && !draft.id && (!draft.slug || draft.slug === brandSlug(String(draft[field.key] ?? '')))) next.slug = brandSlug(String(value ?? ''));
          setDraft(next);
        }}/>}</div>)}</div>
      {kind === 'coupons' && <p className="text-xs text-muted">{t('admin.catalog.valueNote')}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)}>{t('admin.common.cancel')}</Button><Button type="submit" disabled={busy} className="gold-button">{busy && <Loader2 className="h-4 w-4 me-2 animate-spin"/>}{t('admin.common.save')}</Button></DialogFooter></form>}
    </DialogContent></Dialog>
    <Dialog open={!!deleting} onOpenChange={open => {if (!open && !busy) setDeleting(null);}}><DialogContent dir={dir} className="bg-surface"><DialogHeader><DialogTitle>{t('admin.common.delete')}</DialogTitle></DialogHeader><p>{t('admin.catalog.deleteConfirm')}</p>{kind === 'categories' && Number(deleting?.products_count) > 0 && <p className="text-danger">{fmt(t('admin.catalog.attachedCount'),{n:Number(deleting?.products_count)})}</p>}{error && <p role="alert" className="text-danger">{t(error)}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>{t('admin.common.cancel')}</Button><Button variant="destructive" disabled={busy || (kind === 'categories' && Number(deleting?.products_count) > 0)} onClick={remove}>{t('admin.common.delete')}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
