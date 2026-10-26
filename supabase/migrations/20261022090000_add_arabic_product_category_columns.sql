/*
  Ensure bilingual columns exist for categories and products.
  Safe to run when they already exist. Empty string means "not translated" and
  the storefront falls back to the English value.
*/
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ar text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS title_ar text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar text NOT NULL DEFAULT '';
