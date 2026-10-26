# Homepage content management (v15)

## Homepage banners
- Product form (Inventory → edit/add): new **Homepage Banner** section with on/off switch, priority, start/end dates, banner image URL, headline, subtext, a live slide preview and a Live / Scheduled / Expired / Unpublished badge. Sponsored search placement keeps its own switch.
- Creating a product now saves banner fields too (before, only edits saved them). An end date before the start date is rejected with a translated message.
- Date pickers now show and save the admin's local time (previously they displayed UTC, shifting times by the timezone offset).
- New page `/admin/banners` (sidebar: "Homepage Banners"): every product with `is_homepage_banner = true`, with thumbnail, status, schedule, drag-and-drop or up/down ordering, a priority number box, Save order, edit (opens the product form directly), view, and remove-from-slider (the product itself is kept).
- Ordering: higher `ad_priority` shows first (the existing convention, also used by sponsored search). Dragging assigns N…1 from top to bottom.
- Homepage slider shows only published products where `is_homepage_banner = true` AND (`ad_starts_at` is null or <= now) AND (`ad_ends_at` is null or >= now), ordered by `ad_priority`, up to 10. The built-in stock slides were removed; with no live banners the slider is hidden. The whole slide links to `/product/<slug>`.
- The homepage refreshes immediately after banner/product saves and at least every 60 seconds, so schedules take effect on time. Before, the homepage was built once and not refreshed.

## Announcement bar
- Why it was not showing: the storefront code looked for columns that are not in the table (`is_enabled`, a row with id `main`, colours, link, schedule), so it always hid itself. It also read the table from the browser, where access rules can block it.
- Now: the bar reads the single row on the server (`/api/announcement`), uses `message_en`, `message_ar`, `is_active`, shows `message_ar` in Arabic (English when the Arabic text is empty), sits above the header and has an X button. Closing is remembered per message, so a new message shows again.
- Admin: an "Announcement bar" card on the dashboard (`/admin`) with both messages and the active switch. `/admin/announcement` shows the same card. Saves go through an admin-only route using the service-role key.

## Verification
- New tests: `src/lib/homepage-banners.test.ts`, `src/lib/announcement.test.ts`. All existing tests still pass (run one file at a time, as before).
- Type check and `next build` pass.
- Browser-tested against a stand-in database: bar above the header, close button, Arabic message, dashboard card save, `/admin/banners` reorder and save, product form save with a schedule, and the homepage showing only live banners in priority order with each slide opening its product.
- Not tested against the real database. The announcement save updates the existing row by its `id` column.
