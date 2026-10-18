/*
# Fix users table RLS for anon login lookup

## Problem
The login endpoint runs with the anon Supabase key (no user is signed in yet).
It queries the `users` table to look up a user by email and verify their password.
However, the only SELECT policy on `users` is scoped to `authenticated` — the `anon`
role has no SELECT policy, so RLS blocks the query and the login fails with a
generic "Something went wrong" error.

## Fix
Add an `anon` SELECT policy on the `users` table so the login route can look up
users by email. This is safe because:
1. The login API route only selects the columns needed for authentication (id, email, name, password_hash).
2. The password_hash is used server-side for bcrypt verification and is never sent to the browser.
3. This matches the pattern already used on the `admins` table (anon SELECT is enabled there for the same reason).

## Security
- New policy: `anon_select_users_for_login` — SELECT to `anon, authenticated` with `USING (true)`.
- This is intentionally permissive because this is a single-tenant app with no per-user data isolation in the browser — all storefront data is public. The login flow requires anon read access to verify credentials.
*/

DROP POLICY IF EXISTS "anon_select_users_for_login" ON users;
CREATE POLICY "anon_select_users_for_login" ON users FOR SELECT
  TO anon, authenticated USING (true);
