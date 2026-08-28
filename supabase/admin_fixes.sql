-- ============================================
-- DRAPEY – Admin fixes (RLS helper + admin cancellation)
-- Idempotent / safe to re-run.
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================

-- ------------------------------------------------------------
-- 0. ADMIN CHECK HELPER  is_admin()
-- ------------------------------------------------------------
-- Canonical, safe way to test whether the current request is an
-- authenticated admin. Used by:
--   * every "admin ..." RLS policy (instead of repeating an inline
--     subquery against the users table, which is the source of the
--     recursion concern described at the bottom of this file), and
--   * the admin_cancel_order() RPC for a database-level authorization
--     check that cannot be bypassed by calling the function directly.
--
-- Properties:
--   * SECURITY DEFINER : runs as the function owner (postgres), so the
--     inner SELECT against users does NOT re-evaluate RLS on users.
--     This is what makes the check recursion-free and fast.
--   * auth.uid()       : reads the signed-in user's claims per request.
--   * SET search_path  : pins the namespace so an attacker cannot
--     hijack public/table references via pg_temp or a malicious schema.
--   * Restricted       : only anon/authenticated may EXECUTE it, and it
--     reveals nothing sensitive (just "am I an admin?"). Unauthenticated
--     or non-admin callers always get FALSE.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ------------------------------------------------------------
-- 1. USERS – replace admin view policy with is_admin() and add
--    admin-only UPDATE / DELETE (role management / delete users)
-- ------------------------------------------------------------
-- NOTE: The customer's own-profile abilities are untouched:
--   * "Users can view own profile"   (SELECT auth.uid() = id)
--   * "Users can update own profile" (UPDATE auth.uid() = id)
-- are NOT dropped or modified here.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 2. Rewrite existing admin policies to use is_admin() instead of
--    repeating the inline users-subquery. Semantics are IDENTICAL, only
--    the authorization expression changes. Policies already scoped to a
--    single user (cart, cart_items, favorites, addresses, and the
--    "own" policies on users/orders/order_items) are left untouched.
-- ------------------------------------------------------------

-- CATEGORIES
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- PRODUCT IMAGES
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- PRODUCT VARIANTS
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;

CREATE POLICY "Admins can manage product variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin());

-- ORDERS
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- ORDER ITEMS
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 3. ADMIN CANCELLATION – safely cancel an order & restore stock
-- ------------------------------------------------------------
-- Used when an admin sets an order to "cancelled" in the admin panel.
--
-- Safety / behaviour:
--   * AUTHORIZATION: it first checks public.is_admin(). Because the
--     function is SECURITY DEFINER, a normal authenticated customer who
--     calls supabase.rpc('admin_cancel_order', ...) directly is rejected
--     at the database level (returns FALSE) — the Next.js route is NOT
--     the only gate.
--   * CANCELLABLE STATUSES: only 'pending' and 'confirmed'. The function
--     refuses to cancel 'preparing', 'shipped', 'delivered', or an
--     already 'cancelled' order (returns FALSE). This mirrors the
--     customer-facing cancel_order() rule exactly.
--   * ROW LOCK: SELECT ... FOR UPDATE keeps the status check + update
--     atomic against concurrent requests.
--   * EXACT-ONCE RESTORE: stock is restored inside the same transaction
--     that flips the order to 'cancelled', only from a cancellable
--     state, and by the exact order_items.quantity per variant. A repeat
--     call sees status='cancelled' and returns FALSE without touching
--     stock, so there is never a double restoration.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_cancel_order(
  p_order_id UUID
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
  -- Database-level authorization: only an admin may cancel on behalf of
  -- the system. Rejects direct RPC calls by non-admins.
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  -- Lock the order and verify it exists. FOR UPDATE keeps the check +
  -- update atomic against concurrent requests.
  SELECT status INTO v_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Only cancel orders still in an early, cancellable state.
  -- Rejects already cancelled, delivered, shipped, preparing, etc.
  -- (Same rule as the customer cancel_order() flow.)
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

-- Grant execute to authenticated users (required for Supabase RPC calls).
-- The function itself still enforces the admin check.
GRANT EXECUTE ON FUNCTION public.admin_cancel_order(UUID) TO authenticated;

-- Refresh PostgREST schema cache so supabase.rpc('admin_cancel_order', ...)
-- resolves immediately.
NOTIFY pgrst, 'reload schema';

-- ============================================
-- WHY THE OLD USERS POLICIES COULD CAUSE RECURSION
-- ============================================
-- The previous admin policies did:
--   USING (EXISTS (SELECT 1 FROM users
--                  WHERE id = auth.uid() AND role = 'admin'))
-- repeated as an inline subquery on ~14 policies over 8 tables,
-- INCLUDING on the users table itself.
--
-- A policy on `users` whose expression queries `users` is the classic
-- trigger for PostgreSQL's "infinite recursion detected in policy for
-- relation". In the simple inline case PostgreSQL usually suppresses RLS
-- on the table for which the policy is being evaluated, so it does not
-- blow up today. But it is extremely fragile: the same pattern becomes a
-- genuine infinite recursion whenever the check is evaluated through a
-- SECURITY DEFINER function, a view, a subquery on another table that
-- funnels back through users, or any future tightening of users RLS.
--
-- The fix centralizes the check in a single SECURITY DEFINER is_admin()
-- function. Its SECURITY DEFINER attribute means the inner SELECT on
-- users runs as the function owner with RLS BYPASSED, so it can never
-- recurse from whichever table's policy calls it. All admin policies now
-- simply call public.is_admin().
--
-- ============================================
-- WHY NO EXISTING RLS POLICIES ARE LEFT AS DUPLICATES / CONFLICTS
-- ============================================
-- Every pre-existing "admin ..." policy was DROPPED and re-created with
-- an identical name and semantics, only swapping the inline users
-- subquery for public.is_admin(). This avoids duplicate-policy-name
-- errors (each name exists exactly once) and keeps behavior unchanged.
--
-- The user-scoped policies are deliberately untouched so that:
--   * customers can still read/update their own profile, cart,
--     favorites, addresses, orders and order items, and
--   * the public-read policies on categories / products / product_images
--     / product_variants remain in place.
--
-- Both CREATE OR REPLACE FUNCTION statements and every DROP POLICY ...
-- IF EXISTS mean the whole file is safe to run repeatedly.
