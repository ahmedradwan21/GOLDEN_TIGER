# Source maintenance rules

- Normalize untrusted product image data through `src/lib/product-images.ts` at data/API boundaries and in the gallery; a shared browser-safe helper prevents inconsistent image handling.
- Keep gallery selection safe when media shrinks and render an icon placeholder when no usable media remains; asynchronous product changes must not dereference missing media.
- Share password visibility behavior through a browser-only auth input; this keeps accessibility and directional layout consistent across customer forms.
- Return stable auth error codes from customer handlers and translate them through the existing locale dictionary; clients must not expose untranslated server or database errors.
- Rate limits are DB-backed via `src/lib/rate-limit.ts` (`rate_limit_hit` RPC through the service role), never in-memory Maps, because serverless instances do not share memory. Auth routes fail closed on DB errors and return 429 `RATE_LIMITED`; analytics tracking fails open. Customer login returns one generic `INVALID_CREDENTIALS` (401) for unknown email or wrong password, with a dummy bcrypt compare to equalize timing; emails are normalized (trim + lowercase) before every lookup, insert and comparison.
- Preserve this downloadable app's original framework and cookie authentication; it is not deployed by the Lovable preview.
- Catalog writes use authenticated admin API routes with the server-only db-admin client; CSV import shares the same boundary and validates each row before upserting by slug.
- Keep brands, categories and coupons in one reusable bilingual admin manager so field behavior and error states remain consistent.
- Public coupon reads project only display fields and exclude targeted and reward coupons; personalized reads derive the email from the verified session.
- The brands schema contract is id, slug, name_en, name_ar, logo_url, sort_order and is_active; the external database is authoritative and must match these fields.
- Homepage banner visibility, status and ordering come only from `src/lib/homepage-banners.ts` (higher `ad_priority` first); the slider, product form and `/admin/banners` share it so schedule rules cannot drift.
- Banner date inputs convert through the shared local-time helpers; raw ISO slicing shows UTC and shifts admin-entered times.
- Admin banner and product saves refresh the cached homepage through `revalidateHomepage()`; the homepage also re-reads every 60 seconds so scheduled starts and ends apply without a save.
- The announcement bar is one row read server-side (`/api/announcement`, `/api/admin/announcement`); the external table contract is `message_en`, `message_ar`, `is_active`, and the storefront never reads it with the browser client.
- `/admin/settings` writes store_settings (id=1, upsert) and shipping_methods only through admin API routes using db-admin; validation lives in browser-safe `src/lib/admin-settings.ts` so client and server agree.
- Coupon rules live in browser-safe `src/lib/coupon-discount.ts`; `/api/checkout/validate-coupon` previews them and order completion re-validates and redeems server-side, so the client discount is never trusted.
- `/admin/affiliates` reads and writes affiliates, their coupons and the earnings report only through admin API routes using db-admin; code generation, validation and commission math live in browser-safe `src/lib/affiliates.ts` so the page, routes and tests share one rule set.
