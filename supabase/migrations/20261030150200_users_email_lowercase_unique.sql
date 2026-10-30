/*
# Lowercase users.email + unique index on lower(email)

Nothing is deleted.

- Rows whose lowercased email does NOT collide with another row are lowercased.
- Rows that collide case-insensitively (e.g. "Ali@x.com" and "ali@x.com") are
  left untouched, and the unique index is NOT created. A NOTICE is raised.
  Resolve the duplicates manually, then re-run this migration (it is idempotent).

-- List case-insensitive duplicates:
SELECT lower(email) AS email_lower,
       count(*)     AS n,
       array_agg(id    ORDER BY created_at) AS user_ids,
       array_agg(email ORDER BY created_at) AS emails
  FROM public.users
 GROUP BY lower(email)
HAVING count(*) > 1
 ORDER BY n DESC, email_lower;
*/

DO $$
DECLARE
  v_dup_groups integer;
BEGIN
  -- 1) Lowercase only rows that cannot collide (keeps the existing UNIQUE(email) happy).
  UPDATE public.users u
     SET email = lower(u.email)
   WHERE u.email <> lower(u.email)
     AND lower(u.email) IN (
       SELECT lower(email) FROM public.users
        GROUP BY lower(email)
       HAVING count(*) = 1
     );

  -- 2) Create the unique index only if there are no case-insensitive duplicates.
  SELECT count(*) INTO v_dup_groups
    FROM (
      SELECT 1 FROM public.users
       GROUP BY lower(email)
      HAVING count(*) > 1
    ) d;

  IF v_dup_groups > 0 THEN
    RAISE NOTICE 'users: % duplicate email group(s) (case-insensitive). Unique index users_email_lower_key NOT created. Run the query in this migration''s header to list them.', v_dup_groups;
  ELSE
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON public.users (lower(email))';
  END IF;
END;
$$;
