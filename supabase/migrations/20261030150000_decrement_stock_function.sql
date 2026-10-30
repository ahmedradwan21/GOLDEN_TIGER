/*
# decrement_stock(p_id text, qty integer) -> boolean

Atomic stock decrement used by /api/checkout/[orderId]/complete via
supabaseAdmin.rpc('decrement_stock', { p_id, qty }).

- Single conditional UPDATE: row is only changed when stock >= qty, so two
  concurrent checkouts can never push stock below zero.
- Returns true if a row was updated, false otherwise (not found / not enough stock).
- qty must be > 0 (a zero/negative qty would otherwise increase stock); returns false.
- SECURITY DEFINER, fixed search_path, executable by service_role only.
*/

CREATE OR REPLACE FUNCTION public.decrement_stock(p_id text, qty integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF qty IS NULL OR qty <= 0 THEN
    RETURN false;
  END IF;

  UPDATE public.products
     SET stock = stock - qty
   WHERE id = p_id
     AND stock >= qty;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(text, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(text, integer) TO service_role;
