/*
# Add SEO and inventory columns to products

## What this migration does
Adds columns needed for admin inventory management: SKU, short description, and SEO fields.

## Modified Tables
1. `products` — adds 5 new columns:
   - sku (text, nullable, unique): stock keeping unit
   - short_description (text, nullable): brief product summary
   - seo_title (text, nullable): meta page title
   - seo_description (text, nullable): meta description
   - seo_keywords (text, nullable): comma-separated SEO keywords

## Security
- No security changes; existing RLS policies remain in effect.

## Important Notes
- All new columns are nullable so existing rows are unaffected.
- sku has a unique constraint for product identification.
*/

CREATE TABLE IF NOT EXISTS products_seo_temp (id text);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
    ALTER TABLE products ADD COLUMN sku text;
    ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'short_description') THEN
    ALTER TABLE products ADD COLUMN short_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'seo_title') THEN
    ALTER TABLE products ADD COLUMN seo_title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'seo_description') THEN
    ALTER TABLE products ADD COLUMN seo_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'seo_keywords') THEN
    ALTER TABLE products ADD COLUMN seo_keywords text;
  END IF;
END $$;
DROP TABLE IF EXISTS products_seo_temp;
