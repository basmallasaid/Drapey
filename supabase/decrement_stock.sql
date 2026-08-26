-- ============================================
-- CREATE decrement_stock RPC function
-- Safe to run multiple times (CREATE OR REPLACE).
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================

CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id
    AND stock_quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id
      USING ERRCODE = 'insufficient_stock';
  END IF;
END;
$$;

-- Grant execute to authenticated users (required for Supabase RPC calls)
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO authenticated;

-- Refresh PostgREST schema cache so supabase.rpc() finds it immediately
NOTIFY pgrst, 'reload schema';

-- Verify: run this query to confirm the function exists
-- SELECT
--   p.proname AS function_name,
--   pg_get_function_arguments(p.oid) AS arguments,
--   pg_get_function_result(p.oid) AS return_type,
--   p.prosecdef AS security_definer
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname = 'decrement_stock';
