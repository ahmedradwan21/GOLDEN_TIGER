import 'server-only';
import { supabaseAdmin } from '@/lib/db-admin';
import { brandSlug } from '@/lib/admin-catalog';

export async function ensureBrand(name: string | null | undefined) {
  if (!name?.trim()) return null;
  const slug = brandSlug(name);
  const found = await supabaseAdmin.from('brands').select('name_en').eq('slug', slug).maybeSingle();
  if (found.error) throw new Error(found.error.message);
  if (found.data) return found.data.name_en;
  const created = await supabaseAdmin.from('brands').upsert({ slug, name_en: name.trim(), name_ar: '', is_active: true }, { onConflict: 'slug', ignoreDuplicates: true });
  if (created.error) throw new Error(created.error.message);
  const saved = await supabaseAdmin.from('brands').select('name_en').eq('slug', slug).single();
  if (saved.error) throw new Error(saved.error.message);
  return saved.data.name_en;
}
