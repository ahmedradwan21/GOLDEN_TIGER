/*
# Atomic coupon redemption
redeem_coupon: increments uses_count only while uses remain; returns true when a row was updated.
release_coupon: undoes one redemption when an order fails after redeeming.
Only the service role (server) may call them.
*/
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE coupons
     SET uses_count = uses_count + 1, updated_at = now()
   WHERE code = p_code
     AND (max_uses IS NULL OR uses_count < max_uses);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_coupon(p_code text)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE coupons SET uses_count = GREATEST(uses_count - 1, 0), updated_at = now() WHERE code = p_code;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_coupon(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_coupon(text) TO service_role;
