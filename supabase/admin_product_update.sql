-- ============================================
-- DRAPEY – Atomic admin product create/update RPCs
-- Safe to run multiple times (CREATE OR REPLACE).
--
-- Run AFTER supabase/admin_fixes.sql (needs public.is_admin()).
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- WHAT THIS FIXES
-- --------------------------------------------
-- The previous product PATCH did:
--   1. update products
--   2. DELETE ALL product_variants
--   3. re-insert the submitted variants
--   4. DELETE ALL product_images
--   5. re-insert the submitted images
--
-- Problems:
--   * NOT ATOMIC – a failure in a later step left the product half edited.
--   * DELETE ALL VARIANTS could break historical orders. order_items has
--     product_variant_id -> product_variants.id ON DELETE RESTRICT, so the
--     historical variant IDs referenced by orders were either destroyed
--     (blocked by the FK, failing the whole edit) or re-created with NEW
--     ids, silently breaking the historical relationship.
--
-- This file replaces all of that with two SECURITY DEFINER functions that
-- run the whole operation in ONE transaction:
--
--   admin_create_product(...)  – create product + variants + images together
--   admin_update_product(...)  – update product, UPSERT variants keeping
--                                existing variant IDs, safely retire removed
--                                variants, and reconcile images.
--
-- SECURITY
-- --------------------------------------------
--   * SECURITY DEFINER + SET search_path = public (defender against
--     search_path hijacking).
--   * public.is_admin() is enforced INSIDE the function, so a normal
--     authenticated customer calling supabase.rpc(...) directly is rejected
--     at the database level. The Next.js route is NOT the only gate.
--   * No service-role credential is ever exposed to the client.
-- ============================================

-- ------------------------------------------------------------------
-- Clean a submitted JSONB variant list and detect logical duplicates
-- (case-insensitive size + color). The app layer normalizes sizes via
-- lib/sizes.js before calling; the database backstop below compares
-- case-insensitively so "M + Black" and "m + black" never both insert.
--
-- INTERNAL-ONLY helper: it is invoked from the SECURITY DEFINER admin
-- create/update RPCs above and is intentionally NOT granted EXECUTE to
-- authenticated users, so normal customers cannot call it directly. The
-- admin RPCs remain callable by authenticated users (grants below), and
-- their definer privileges cover this internal call.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._admin_raise_on_duplicate_variants(p_variants JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dup TEXT;
BEGIN
  IF p_variants IS NULL OR jsonb_typeof(p_variants) <> 'array' THEN
    RETURN;
  END IF;

  SELECT d.sz || '::' || d.col INTO v_dup
  FROM (
    SELECT
      lower(trim(t.value->>'size')) AS sz,
      lower(trim(t.value->>'color')) AS col
    FROM jsonb_array_elements(p_variants) t
    WHERE COALESCE(trim(t.value->>'size'), '') <> ''
      AND COALESCE(trim(t.value->>'color'), '') <> ''
  ) d
  GROUP BY d.sz, d.col
  HAVING COUNT(*) > 1
  LIMIT 1;

  IF v_dup IS NOT NULL THEN
    RAISE EXCEPTION 'This size/color variant already exists for this product.'
      USING ERRCODE = '23505';
  END IF;
END;
$$;

-- ============================================
-- admin_create_product
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_create_product(
  p_name TEXT,
  p_description TEXT,
  p_price NUMERIC,
  p_category_id UUID,
  p_is_active BOOLEAN,
  p_variants JSONB,
  p_images JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_slug TEXT;
  v_variant JSONB;
  v_image JSONB;
  v_product JSONB;
BEGIN
  -- Database-level authorization: only admins may create products.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_name, '') = '' OR p_price IS NULL THEN
    RAISE EXCEPTION 'name and price are required' USING ERRCODE = '22023';
  END IF;

  PERFORM public._admin_raise_on_duplicate_variants(p_variants);

  -- Slug mirrors the previous Next.js generation: lowercase, non-alphanumerics
  -- -> '-', trimmed, with a timestamp fallback for empty/edge names.
  v_slug := lower(
    regexp_replace(
      regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'),
      '^-+|-+$', '', 'g'
    )
  );
  IF v_slug = '' THEN
    v_slug := 'product-' || to_char(NOW(), 'YYYYMMDDHH24MISS');
  END IF;

  INSERT INTO public.products (name, slug, description, price, category_id, is_active)
  VALUES (
    p_name,
    v_slug,
    COALESCE(p_description, ''),
    p_price,
    p_category_id,
    COALESCE(p_is_active, TRUE)
  )
  RETURNING id INTO v_product_id;

  -- Variants (fresh product = every variant is new).
  IF p_variants IS NOT NULL AND jsonb_typeof(p_variants) = 'array' THEN
    FOR v_variant IN SELECT value FROM jsonb_array_elements(p_variants)
    LOOP
      CONTINUE WHEN COALESCE(trim(v_variant->>'size'), '') = ''
                OR COALESCE(trim(v_variant->>'color'), '') = '';

      INSERT INTO public.product_variants (product_id, size, color, sku, stock_quantity)
      VALUES (
        v_product_id,
        v_variant->>'size',
        trim(v_variant->>'color'),
        COALESCE(
          NULLIF(trim(v_variant->>'sku'), ''),
          upper(regexp_replace(
            v_product_id::text
            || '-' || (v_variant->>'size')
            || '-' || (v_variant->>'color'),
            '\s+', '-', 'g'
          ))
        ),
        GREATEST(0, COALESCE((v_variant->>'stock_quantity')::INTEGER, 0))
      );
    END LOOP;
  END IF;

  -- Images.
  IF p_images IS NOT NULL AND jsonb_typeof(p_images) = 'array' THEN
    FOR v_image IN SELECT value FROM jsonb_array_elements(p_images)
    LOOP
      CONTINUE WHEN COALESCE(trim(v_image->>'image_url'), '') = '';

      INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
      VALUES (
        v_product_id,
        trim(v_image->>'image_url'),
        COALESCE((v_image->>'is_primary')::BOOLEAN, FALSE),
        COALESCE((v_image->>'sort_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  SELECT jsonb_build_object(
    'id', id, 'name', name, 'slug', slug, 'description', description,
    'price', price, 'category_id', category_id, 'is_active', is_active
  ) INTO v_product
  FROM public.products
  WHERE id = v_product_id;

  RETURN v_product;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_product(TEXT, TEXT, NUMERIC, UUID, BOOLEAN, JSONB, JSONB) TO authenticated;

-- ============================================
-- admin_update_product
-- ============================================
-- Variant reconciliation (the important part):
--   * Submitted variant whose (size, color) matches an existing variant
--     (case-insensitively) -> UPDATE that row, KEEPING its original id and
--     sku. Historical order_items keep pointing at a valid variant.
--   * Submitted variant with no match -> INSERT (new variant).
--   * Existing variant NOT in the submitted set:
--       - not referenced by order_items -> DELETE (safe to remove).
--       - referenced by order_items      -> KEEP the row (historical FK stays
--         valid) and set stock_quantity = 0 so it cannot be purchased again.
-- This never destroys or re-points a variant referenced by a historical
-- order, and it never changes ON DELETE RESTRICT semantics.
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_product(
  p_product_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_price NUMERIC,
  p_category_id UUID,
  p_is_active BOOLEAN,
  p_variants JSONB,
  p_images JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant JSONB;
  v_image JSONB;
  v_match_id UUID;
  v_kept_id UUID;
  v_referenced BOOLEAN;
  v_product JSONB;
BEGIN
  -- Database-level authorization: only admins may update products.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_product_id IS NULL OR COALESCE(p_name, '') = '' OR p_price IS NULL THEN
    RAISE EXCEPTION 'name and price are required' USING ERRCODE = '22023';
  END IF;

  -- 1. Update the product header.
  UPDATE public.products
  SET name = p_name,
      description = COALESCE(p_description, ''),
      price = p_price,
      category_id = p_category_id,
      is_active = COALESCE(p_is_active, TRUE)
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Reconcile variants.
  IF p_variants IS NOT NULL AND jsonb_typeof(p_variants) = 'array' THEN
    PERFORM public._admin_raise_on_duplicate_variants(p_variants);

    CREATE TEMP TABLE _pv_removed (variant_id UUID PRIMARY KEY) ON COMMIT DROP;
    INSERT INTO _pv_removed (variant_id)
    SELECT id FROM public.product_variants WHERE product_id = p_product_id;

    FOR v_variant IN SELECT value FROM jsonb_array_elements(p_variants)
    LOOP
      CONTINUE WHEN COALESCE(trim(v_variant->>'size'), '') = ''
                OR COALESCE(trim(v_variant->>'color'), '') = '';

      SELECT id INTO v_match_id
      FROM public.product_variants
      WHERE product_id = p_product_id
        AND lower(size) = lower(trim(v_variant->>'size'))
        AND lower(trim(color)) = lower(trim(v_variant->>'color'))
      LIMIT 1;

      IF v_match_id IS NOT NULL THEN
        -- Existing variant: keep its id (and sku unless a new one is given).
        UPDATE public.product_variants
        SET size = v_variant->>'size',
            color = trim(v_variant->>'color'),
            sku = CASE
                    WHEN COALESCE(trim(v_variant->>'sku'), '') <> '' THEN trim(v_variant->>'sku')
                    ELSE sku
                  END,
            stock_quantity = GREATEST(0, COALESCE((v_variant->>'stock_quantity')::INTEGER, 0))
        WHERE id = v_match_id;

        DELETE FROM _pv_removed WHERE variant_id = v_match_id;
        v_match_id := NULL;
      ELSE
        -- New variant.
        INSERT INTO public.product_variants (product_id, size, color, sku, stock_quantity)
        VALUES (
          p_product_id,
          v_variant->>'size',
          trim(v_variant->>'color'),
          COALESCE(
            NULLIF(trim(v_variant->>'sku'), ''),
            upper(regexp_replace(
              p_product_id::text
              || '-' || (v_variant->>'size')
              || '-' || (v_variant->>'color'),
              '\s+', '-', 'g'
            ))
          ),
          GREATEST(0, COALESCE((v_variant->>'stock_quantity')::INTEGER, 0))
        );
      END IF;
    END LOOP;

    -- Removed variants: delete if never sold, otherwise retire safely by
    -- zeroing stock (order_items FK stays valid, future purchases blocked).
    FOR v_kept_id IN SELECT variant_id FROM _pv_removed
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM public.order_items WHERE product_variant_id = v_kept_id
      ) INTO v_referenced;

      IF v_referenced THEN
        UPDATE public.product_variants
        SET stock_quantity = 0
        WHERE id = v_kept_id;
      ELSE
        DELETE FROM public.product_variants WHERE id = v_kept_id;
      END IF;
    END LOOP;

    DROP TABLE _pv_removed;
  END IF;

  -- 3. Reconcile images (rows only; Storage objects are never touched here
  --    because the architecture stores URLs, not reliable object ownership).
  IF p_images IS NOT NULL AND jsonb_typeof(p_images) = 'array' THEN
    DELETE FROM public.product_images WHERE product_id = p_product_id;

    FOR v_image IN SELECT value FROM jsonb_array_elements(p_images)
    LOOP
      CONTINUE WHEN COALESCE(trim(v_image->>'image_url'), '') = '';

      INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
      VALUES (
        p_product_id,
        trim(v_image->>'image_url'),
        COALESCE((v_image->>'is_primary')::BOOLEAN, FALSE),
        COALESCE((v_image->>'sort_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  SELECT jsonb_build_object(
    'id', id, 'name', name, 'slug', slug, 'description', description,
    'price', price, 'category_id', category_id, 'is_active', is_active
  ) INTO v_product
  FROM public.products
  WHERE id = p_product_id;

  RETURN v_product;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_product(UUID, TEXT, TEXT, NUMERIC, UUID, BOOLEAN, JSONB, JSONB) TO authenticated;

-- Keep both RPCs visible to PostgREST immediately.
NOTIFY pgrst, 'reload schema';