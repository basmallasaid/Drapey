-- ============================================
-- FIX CHECKOUT RLS — Idempotent migration
-- Safe to run multiple times.
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================

-- ============================================
-- 1. ORDERS — drop any existing INSERT policies
-- ============================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON orders', pol.policyname);
    RAISE NOTICE 'Dropped INSERT policy: %', pol.policyname;
  END LOOP;
END $$;

-- Create the correct INSERT policy
CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. ORDER ITEMS — drop any existing INSERT policies
-- ============================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_items'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON order_items', pol.policyname);
    RAISE NOTICE 'Dropped INSERT policy: %', pol.policyname;
  END LOOP;
END $$;

-- Create the correct INSERT policy
CREATE POLICY "Users can create order items for own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. Verify — run this query after to confirm
-- ============================================
-- SELECT
--   schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('orders', 'order_items')
--   AND cmd = 'INSERT';
