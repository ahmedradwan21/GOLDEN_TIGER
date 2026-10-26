import 'server-only';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { supabaseAdmin } from '@/lib/db-admin';
import { couponAvailable } from '@/lib/admin-catalog';

export async function getActiveBrands() {
  if (!isDatabaseConfigured()) return [];
  const { data, error } = await supabase.from('brands').select('*').eq('is_active', true).order('sort_order');
  return error ? [] : data ?? [];
}
export async function getDisplayCoupons(email?: string) {
  let query = supabaseAdmin.from('coupons').select('id,code,title_en,title_ar,image_url,discount_type,value,max_uses,uses_count,expires_at,is_reward');
  query = email ? query.eq('customer_email', email) : query.is('customer_email', null).is('customer_phone', null).eq('is_reward', false);
  const { data, error } = await query.order('created_at', { ascending: false });
  return error ? [] : (data ?? []).filter(c => couponAvailable(c));
}
