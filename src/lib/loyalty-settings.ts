export interface LoyaltySettings {
  name_en: string;
  name_ar: string;
}

/** Shown whenever loyalty_settings is empty or unreachable. */
export const DEFAULT_PROGRAM_NAME: LoyaltySettings = {
  name_en: 'Golden Rewards',
  name_ar: 'المكافآت الذهبية',
};

/** Arabic name when locale is ar and present, otherwise English; falls back to defaults. */
export function localizedProgramName(settings: Partial<LoyaltySettings> | null | undefined, locale: string): string {
  const en = settings?.name_en?.trim() || DEFAULT_PROGRAM_NAME.name_en;
  const ar = settings?.name_ar?.trim() || DEFAULT_PROGRAM_NAME.name_ar;
  return locale === 'ar' ? ar : en;
}

/** Whitelists and coerces writable columns from a request body. */
export function sanitizeSettingsInput(body: Record<string, unknown>): LoyaltySettings {
  return {
    name_en: body.name_en == null ? '' : String(body.name_en).trim(),
    name_ar: body.name_ar == null ? '' : String(body.name_ar).trim(),
  };
}
