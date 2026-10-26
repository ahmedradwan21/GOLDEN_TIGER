import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { DEFAULT_PROGRAM_NAME } from '@/lib/loyalty-settings';

export const dynamic = 'force-dynamic';

// Public: the loyalty program name (single row, id=1). Falls back to defaults.
export async function GET() {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('loyalty_settings')
      .select('name_en,name_ar')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({
      settings: {
        name_en: data?.name_en?.trim() || DEFAULT_PROGRAM_NAME.name_en,
        name_ar: data?.name_ar?.trim() || DEFAULT_PROGRAM_NAME.name_ar,
      },
    });
  } catch {
    return NextResponse.json({ settings: DEFAULT_PROGRAM_NAME });
  }
}
