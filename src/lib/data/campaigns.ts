import 'server-only';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { ensureDatabaseConfigured } from '@/lib/env';
import type { Campaign } from '@/types';

interface CampaignRow {
  id: string;
  type: string;
  is_active: boolean;
  title: string;
  description: string | null;
  discount_percentage: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapCampaignRow(r: CampaignRow): Campaign {
  return {
    id: r.id,
    type: r.type as Campaign['type'],
    isActive: r.is_active,
    title: r.title,
    description: r.description,
    discountPercentage: r.discount_percentage,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
  };
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as CampaignRow[]).map(mapCampaignRow);
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  const all = await getAllCampaigns();
  return all.filter((c) => c.isActive);
}

export async function updateCampaign(
  type: string,
  updates: { isActive?: boolean; discountPercentage?: number; startsAt?: string | null; endsAt?: string | null }
): Promise<Campaign | null> {
  if (!isDatabaseConfigured()) return null;
  ensureDatabaseConfigured();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.discountPercentage !== undefined) updateData.discount_percentage = updates.discountPercentage;
  if (updates.startsAt !== undefined) updateData.starts_at = updates.startsAt;
  if (updates.endsAt !== undefined) updateData.ends_at = updates.endsAt;

  const { data, error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('type', type)
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return mapCampaignRow(data as CampaignRow);
}
