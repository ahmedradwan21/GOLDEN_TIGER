# Admin power-up (v14)

## Included
- Import CSV on `/admin/inventory`, with authenticated template download, server-side parsing and slug upserts. Summaries report successful inserts, updates and skipped rows. Row numbers refer to physical CSV lines, including quoted multiline descriptions. Files are limited to 5 MB. Prices and stock must be non-negative integer values. Unknown category slugs are skipped.
- `/admin/brands`: English/Arabic name, slug, logo URL, sort order and active status. Product forms load this list; a newly typed brand is created when saving the product. The homepage reads active brands in sort order and links to catalog searches.
- `/admin/categories`: add/edit/delete, Arabic names, images and sort order. Categories with attached products cannot be deleted until those products are reassigned.
- `/admin/coupons`: add/edit/delete, bilingual titles, percentage/fixed discounts, value, maximum uses, expiry, banner URL, reward flag and optional target email. Fixed values retain the existing cents convention. Public coupon display excludes targeted/reward coupons. Account coupons are scoped to the signed-in customer's email. Expired or exhausted coupons are not displayed.
- All new admin writes use `supabaseAdmin` from `db-admin.ts`, after verifying the existing admin session. No migrations or seed data were added.
- New controls follow the existing English/Arabic dictionary and English fallback.

## External schema contract
The supplied source did not include the existing brands table definition. This version expects:
`brands(id, slug, name_en, name_ar, logo_url, sort_order, is_active)` with a unique slug and a default-generated id. Homepage reads require public SELECT access to active brands. Coupon columns `title_en`, `title_ar`, `image_url` and category `name_ar` must already exist, as requested.

## Verification
- Local tests cover CSV multipart upload, parsing and upsert summaries, integer values, Arabic fields, API admin guards, attached-product deletion prevention, coupon privacy and expiry/usage filtering.
- Existing localization, product image and authentication tests were run in separate processes to avoid their global mock collisions.
- Source type checking uses the native TypeScript checker with `--target es2017 --types bun,node --noUncheckedSideEffectImports false` because that checker no longer accepts the project's legacy ES5 target.
- The external database and hosted site were not accessible here. Live admin saves, storefront reads, and complete customer flows remain unverified; this archive is not deployed to the Lovable preview.
