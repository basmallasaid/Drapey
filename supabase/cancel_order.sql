-- ============================================
-- CREATE cancel_order RPC function  (FIXED)
-- Safe to run multiple times (CREATE OR REPLACE).
--
-- === ROOT CAUSE OF PGRST202 (function not found) ===
-- This function must actually be created in the Supabase database
-- BEFORE the app can call it. Run this whole file in the Supabase
-- SQL Editor (https://supabase.com/dashboard/project/_/sql/new).
-- An RPC that "does not exist in the schema cache" almost always
-- means the SQL was never applied, or PostgREST's schema cache is
-- stale. The final "NOTIFY pgrst, 'reload schema'" statement below
-- refreshes that cache automatically when run from the SQL Editor.
--
-- === Security ===
-- The authenticated user is derived from auth.uid() and matched
-- against the caller-supplied p_user_id. A tampered p_user_id is
-- therefore rejected: the function only acts when p_user_id equals
-- the real authenticated session user, so nobody can cancel another
-- customer's order by changing the order ID or user ID in the request.
--
-- === Behaviour ===
-- * Atomic: order status update + stock restoration + status guard
--   all happen inside one transaction.
-- * Idempotent: only orders in 'pending'/'confirmed' can be cancelled,
--   so calling again on an already-cancelled/advanced order is a safe
--   no-op that returns FALSE and never double-restores stock.
-- ============================================

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_item RECORD;
BEGIN
  -- Do not trust the supplied p_user_id; only proceed if it matches the
  -- authenticated session user. Returns FALSE for any other caller.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Lock the order and verify it exists, belongs to this user, and is
  -- still in a cancellable state. FOR UPDATE keeps the check + update
  -- atomic against concurrent requests.
  SELECT status INTO v_status
  FROM public.orders
  WHERE id = p_order_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE; -- order does not exist or does not belong to this user
  END IF;

  -- Only cancel orders still in an early, cancellable state.
  -- Rejects already cancelled, shipped, delivered, preparing, etc.
  IF v_status NOT IN ('pending', 'confirmed') THEN
    RETURN FALSE;
  END IF;

  -- Mark the order as cancelled.
  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = p_order_id;

  -- Restore the exact quantity for every variant in the order.
  -- Because this runs inside the same transaction that flips the order
  -- to 'cancelled' (and only when it was still pending/confirmed), stock
  -- is restored exactly once even if cancellation is attempted again.
  FOR v_item IN
    SELECT product_variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity + v_item.quantity
    WHERE id = v_item.product_variant_id;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users (required for Supabase RPC calls)
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID, UUID) TO authenticated;

-- Refresh PostgREST schema cache so supabase.rpc('cancel_order', ...)
-- resolves immediately. Running from the Supabase SQL Editor applies this.
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION QUERIES (run after the above)
-- ============================================
-- 1) Confirm the function exists:
-- SELECT p.proname, pg_get_function_arguments(p.oid) AS args,
--        pg_get_function_result(p.oid) AS returns
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.pronamespace = n.oid
-- WHERE n.nspname = 'public' AND p.proname = 'cancel_order';
--
-- 2) Confirm the grant:
-- SELECT grantee, privilege_type
-- FROM information_schema.role_routine_grants
-- WHERE routine_name = 'cancel_order';
