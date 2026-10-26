# Source maintenance rules

- Normalize untrusted product image data through `src/lib/product-images.ts` at data/API boundaries and in the gallery; a shared browser-safe helper prevents inconsistent image handling.
- Keep gallery selection safe when media shrinks and render an icon placeholder when no usable media remains; asynchronous product changes must not dereference missing media.
- Share password visibility behavior through a browser-only auth input; this keeps accessibility and directional layout consistent across customer forms.
- Return stable auth error codes from customer handlers and translate them through the existing locale dictionary; clients must not expose untranslated server or database errors.
- Preserve existing authentication throttling in place; customer routes in this source currently have no limiter, and the admin limiter remains unchanged.
- Preserve this downloadable app's original framework and cookie authentication; it is not deployed by the Lovable preview.
- Catalog writes use authenticated admin API routes with the server-only db-admin client; CSV import shares the same boundary and validates each row before upserting by slug.
- Keep brands, categories and coupons in one reusable bilingual admin manager so field behavior and error states remain consistent.
- Public coupon reads project only display fields and exclude targeted and reward coupons; personalized reads derive the email from the verified session.
- The brands schema contract is id, slug, name_en, name_ar, logo_url, sort_order and is_active; the external database is authoritative and must match these fields.
- Homepage banner visibility, status and ordering come only from `src/lib/homepage-banners.ts` (higher `ad_priority` first); the slider, product form and `/admin/banners` share it so schedule rules cannot drift.
- Banner date inputs convert through the shared local-time helpers; raw ISO slicing shows UTC and shifts admin-entered times.
- Admin banner and product saves refresh the cached homepage through `revalidateHomepage()`; the homepage also re-reads every 60 seconds so scheduled starts and ends apply without a save.
- The announcement bar is one row read server-side (`/api/announcement`, `/api/admin/announcement`); the external table contract is `message_en`, `message_ar`, `is_active`, and the storefront never reads it with the browser client.
