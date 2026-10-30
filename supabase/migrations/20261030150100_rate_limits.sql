/*
# rate_limits table + rate_limit_hit(p_key, p_limit, p_window_seconds) -> boolean

- rate_limits: one row per key (e.g. 'login:ip:1.2.3.4'). RLS enabled with NO
  policies, and no anon/authenticated privileges -> only service_role can reach it.
- rate_limit_hit: records one hit atomically (INSERT ... ON CONFLICT DO UPDATE,
  row-locked by Postgres). If the window expired, the counter resets to 1 and a
  new window starts.
  Returns TRUE  = request allowed (count within p_limit)
          FALSE = limit exceeded (block the request)
- Executable by service_role only.
*/

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key      text PRIMARY KEY,
  count    integer NOT NULL,
  reset_at timestamptz NOT NULL
);

REVOKE ALL ON public.rate_limits FROM PUBLIC;
REVOKE ALL ON public.rate_limits FROM anon;
REVOKE ALL ON public.rate_limits FROM authenticated;
GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies.

CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON public.rate_limits (reset_at);

CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_key IS NULL OR p_limit IS NULL OR p_limit < 0
     OR p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'rate_limit_hit: invalid arguments';
  END IF;

  INSERT INTO public.rate_limits AS r (key, count, reset_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
                  WHEN r.reset_at <= now() THEN 1
                  ELSE LEAST(r.count + 1, p_limit + 1)   -- cap: avoids unbounded growth
                END,
        reset_at = CASE
                     WHEN r.reset_at <= now() THEN now() + make_interval(secs => p_window_seconds)
                     ELSE r.reset_at
                   END
  RETURNING r.count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;

-- Optional cleanup (run manually or from a cron):
--   DELETE FROM public.rate_limits WHERE reset_at < now() - interval '1 day';
