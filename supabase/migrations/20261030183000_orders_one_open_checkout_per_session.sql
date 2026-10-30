-- One open (CHECKOUT_STARTED, no order_number) order per session_id.
-- 1) Keep the newest open order per session; delete older duplicates (items first).
CREATE TEMP TABLE _dup_open_orders AS
SELECT id FROM (
  SELECT id,
         row_number() OVER (
           PARTITION BY session_id
           ORDER BY checkout_started_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.orders
  WHERE status = 'CHECKOUT_STARTED' AND order_number IS NULL AND session_id IS NOT NULL
) r
WHERE rn > 1;

DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM _dup_open_orders);
DELETE FROM public.orders WHERE id IN (SELECT id FROM _dup_open_orders);
DROP TABLE _dup_open_orders;

-- 2) Enforce it going forward (race-safe /api/checkout/start).
CREATE UNIQUE INDEX IF NOT EXISTS orders_one_open_checkout_per_session
  ON public.orders (session_id)
  WHERE status = 'CHECKOUT_STARTED' AND order_number IS NULL;
