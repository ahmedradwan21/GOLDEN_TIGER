# FIXES — GOLDEN_TIGER security & bugfix pass (2026-10-19)

## 1. Community links (social_community_links) — rebuilt
- **New API routes** (server-side, admin-only):
  - `src/app/api/admin/community-links/route.ts` — `GET` list, `POST` create (zod-validated; `409` on duplicate platform; URL must start with `http(s)://`).
  - `src/app/api/admin/community-links/[id]/route.ts` — `PATCH` update, `DELETE` remove.
- All routes verify `getAdminSession()` first and use the **service-role client** (`supabaseAdmin`) — the browser no longer touches Supabase directly.
- `src/app/admin/(protected)/community/page.tsx` rewritten to call these APIs via `fetch`, and now supports **adding** a channel (platform, name_en, name_ar, description_en, description_ar, url, sort_order) and **deleting** one — design/UI unchanged.

## 2. Security
- Deleted leaked `.env.local` (live Supabase keys + JWT secret) — **rotate those keys in Supabase**.
- `.env.example` now ships with empty values only.
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix and is only referenced server-side (`src/lib/db.ts`).
- **Rate limiting** (in-memory, 10 req/min/IP): `/api/auth/login`, `/api/auth/register`. `/api/admin/auth/login` already had stricter limiting (5/15min per IP + per email) — kept.
- `/api/auth/register`: now uses `supabaseAdmin` for both the duplicate-email check and insert (anon write was revoked by the lockdown migration); bcrypt hashing, zod validation and session cookie were already correct.
- `/api/admin/auth/login`: switched from anon client to `supabaseAdmin` for the `admins` lookup.
- All existing `/api/admin/*` routes were audited — every one already checks `getAdminSession()`.
- Removed required `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `src/lib/env.ts` (hardcoded-env admin auth is gone; admins live in the DB).
- **Same bug as community links found & fixed in the announcement bar admin**: `src/app/admin/(protected)/announcement/page.tsx` wrote via anon client → new protected API `src/app/api/admin/announcement/route.ts` (GET/PUT, zod-validated, upsert by id `main`), page converted to `fetch`.
- Deleted `supabase/migrations_old/` and `supabase/.temp/`.

## 3. i18n (ar/en)
- Verified working: `html lang`/`dir` flip on toggle, persisted in `localStorage`, only `en`/`ar` exist. No missing dict keys (community page uses inline bilingual strings, consistent with its original style).

## 4. Admin auth
- Admin login reads from `admins` table with `supabaseAdmin` + bcrypt compare + `gt_admin` JWT cookie (8h).
- `admin/(protected)/layout.tsx` redirects to `/admin/login` when `getAdminSession()` is null; `AdminShell` unchanged.

## Not changed (per request)
- Design, storefront pages/components, existing migrations in `supabase/migrations/`.
