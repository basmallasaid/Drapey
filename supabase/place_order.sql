-- ============================================
-- DRAPEY – Atomic checkout
-- Safe to run multiple times (CREATE OR REPLACE).
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- WHAT THIS FIXES
-- --------------------------------------------
-- The previous checkout did 5 separate requests from Next.js:
--   1. insert order
--   2. insert order_items
--   3. decrement_stock per line item
--   4. clear cart
--   5. send email
-- A failure in any step after step 1 left a broken order (or a double
-- charge of stock if a retry repeated a step). Nothing was atomic.
--
-- This file:
--   * Creates public.place_order(...) – the ENTIRE checkout runs in ONE
--     POSTGRES TRANSACTION. If anything fails, stock never moves and no
--     order is created.
--   * Disables public.decrement_stock for direct client calls. Previously
--     ANY authenticated user could call it with arbitrary ids/quantities to
--     mutate inventory. Stock is only ever adjusted now through place_order
--     (and the admin variant editors in admin_product_update.sql).
--
-- SECURITY
-- --------------------------------------------
--   * SECURITY DEFINER + SET search_path = public (defender against
--     search_path hijacking).
--   * auth.uid() inside the function identifies the REAL caller, so a user
--     can only ever place an order against their OWN cart.
--   * product.active is checked, stock is checked AND decremented atomically
--     with a guarded UPDATE (stock_quantity >= q protects against race
--     conditions where two checkouts race for the last unit).
--   * No service-role credential is exposed to the client.
-- ============================================

CREATE OR REPLACE FUNCTION public.place_order(
  p_address JSONB,
  p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_cart_id UUID;
  v_item RECORD;
  v_order_id UUID;
  v_email    TEXT;
  v_subtotal NUMERIC(10,2) := 0;
  v_shipping NUMERIC(10,2) := 0;
  v_total    NUMERIC(10,2) := 0;
BEGIN
  -- The caller must be signed in.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  -- Validate the address payload (mirrors the checkout form requirements).
  IF p_address IS NULL
     OR COALESCE(p_address->>'full_name', '') = ''
     OR COALESCE(p_address->>'phone', '') = ''
     OR COALESCE(p_address->>'governorate', '') = ''
     OR COALESCE(p_address->>'city', '') = ''
     OR COALESCE(p_address->>'street', '') = '' THEN
    RAISE EXCEPTION 'Missing required address fields' USING ERRCODE = '22023';
  END IF;

  -- The user's email for the receipt (read from public.users, which is
  -- populated by the sign-up trigger).
  SELECT email INTO v_email FROM public.users WHERE id = v_user_id;

  -- 1. Read the user's cart, locking the row for the lifetime of this
  --    transaction. FOR UPDATE makes the cart a serialization point: if the
  --    same user submits checkout twice concurrently, the second statement
  --    waits here until the first transaction commits, so both transactions
  --    never read and process the same cart (and its stock) simultaneously.
  --    The guarded stock UPDATE below remains the final protection against
  --    overselling across different users/variants.
  SELECT id INTO v_cart_id
  FROM public.cart
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'CART_EMPTY:' USING ERRCODE = '22023';
  END IF;

  -- 2. Validate every line and compute the subtotal. Products are checked
  --    as active, stock is checked against the CURRENT snapshot.
  CREATE TEMP TABLE _checkout_items ON COMMIT DROP AS
  SELECT
    ci.product_variant_id,
    ci.quantity,
    pv.size,
    pv.color,
    pv.stock_quantity,
    p.name             AS product_name,
    p.price            AS unit_price,
    p.is_active        AS product_active
  FROM public.cart_items ci
  JOIN public.product_variants pv ON pv.id = ci.product_variant_id
  JOIN public.products p          ON p.id = pv.product_id
  WHERE ci.cart_id = v_cart_id;

  IF NOT EXISTS (SELECT 1 FROM _checkout_items) THEN
    DROP TABLE _checkout_items;
    RAISE EXCEPTION 'CART_EMPTY:' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT * FROM _checkout_items
  LOOP
    IF NOT v_item.product_active THEN
      DROP TABLE _checkout_items;
      RAISE EXCEPTION 'UNAVAILABLE:%', v_item.product_name
        USING ERRCODE = 'P0001';
    END IF;

    IF v_item.stock_quantity < v_item.quantity THEN
      DROP TABLE _checkout_items;
      RAISE EXCEPTION 'NO_STOCK:%|%|%|%',
        v_item.product_name, v_item.size, v_item.color, v_item.stock_quantity
        USING ERRCODE = 'P0001';
    END IF;

    v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);
  END LOOP;

  -- 3. Shipping mirrors lib/constants.js:
  --      FREE_SHIPPING_THRESHOLD = 100, SHIPPING_FEE = 10.
  --    Keep in sync with the customer-facing calculateShipping().
  IF v_subtotal >= 100 THEN
    v_shipping := 0;
  ELSE
    v_shipping := 10;
  END IF;
  v_total := v_subtotal + v_shipping;

  -- 4. Insert the order header.
  INSERT INTO public.orders (
    user_id, status, subtotal, shipping_fee, discount, total_amount,
    customer_name, customer_email, customer_phone,
    governorate, city, area, street, building, floor, apartment, notes
  ) VALUES (
    v_user_id, 'pending', v_subtotal, v_shipping, 0, v_total,
    p_address->>'full_name', COALESCE(v_email, ''), p_address->>'phone',
    p_address->>'governorate', p_address->>'city',
    COALESCE(p_address->>'area', ''), p_address->>'street',
    COALESCE(p_address->>'building', ''),
    COALESCE(p_address->>'floor', ''),
    COALESCE(p_address->>'apartment', ''),
    COALESCE(p_notes, '')
  )
  RETURNING id INTO v_order_id;

  -- 5. Insert the line items.
  INSERT INTO public.order_items (
    order_id, product_variant_id, product_name, size, color,
    quantity, unit_price, total_price
  )
  SELECT
    v_order_id, product_variant_id, product_name, size, color,
    quantity, unit_price, unit_price * quantity
  FROM _checkout_items;

  -- 6. Deduct stock with a guarded UPDATE per line. If two checkouts race
  --    for the last unit, one of them finds 0 rows here and the whole
  --    transaction rolls back (their order disappears, stock is restored).
  FOR v_item IN SELECT * FROM _checkout_items
  LOOP
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_item.product_variant_id
      AND stock_quantity >= v_item.quantity;

    IF NOT FOUND THEN
      DROP TABLE _checkout_items;
      RAISE EXCEPTION 'NO_STOCK:%|%|%|%',
        v_item.product_name, v_item.size, v_item.color, 0
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  -- 7. Clear the cart now that the order is fully committed.
  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;

  DROP TABLE _checkout_items;

  RETURN jsonb_build_object('order_id', v_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(JSONB, TEXT) TO authenticated;

-- ============================================
-- Disable the old, unsafe decrement_stock RPC for direct calls.
-- Nothing in the app calls it anymore (checkout is atomic now); inventory is
-- only mutated by place_order and the admin product editors. An admin can
-- still restore a function later by re-running supabase/decrement_stock.sql.
-- ============================================
REVOKE ALL ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM authenticated;

-- Refresh PostgREST schema cache so place_order is immediately callable.
NOTIFY pgrst, 'reload schema';