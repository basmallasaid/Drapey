-- ============================================
-- DRAPEY – Seed Data
-- Run AFTER schema.sql + rls_policies.sql
-- ============================================

-- ────────────────────────────────────────────
-- CATEGORIES
-- ────────────────────────────────────────────
INSERT INTO categories (id, name, slug, description, image_url) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'T-Shirts',   't-shirts',   'Essential tees for everyday wear.',         '/categories/t-shirts.jpg'),
  ('c0000002-0000-0000-0000-000000000002', 'Hoodies',    'hoodies',    'Comfortable hoodies for cooler days.',       '/categories/hoodies.jpg'),
  ('c0000003-0000-0000-0000-000000000003', 'Pants',      'pants',      'Trousers, joggers and denim.',               '/categories/pants.jpg'),
  ('c0000004-0000-0000-0000-000000000004', 'Jackets',    'jackets',    'Outerwear for every season.',                '/categories/jackets.jpg'),
  ('c0000005-0000-0000-0000-000000000005', 'Accessories','accessories','Hats, bags and finishing touches.',          '/categories/accessories.jpg');

-- ────────────────────────────────────────────
-- PRODUCTS
-- ────────────────────────────────────────────
-- T-Shirts
INSERT INTO products (id, category_id, name, slug, description, price, is_active) VALUES
  ('p0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'Oversized Tee', 'oversized-tee',
   'A relaxed-fit tee crafted from 100 % organic cotton. Dropped shoulders, boxy silhouette.', 29.99, TRUE),
  ('p0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001',
   'Classic Crew Neck', 'classic-crew-neck',
   'Timeless crew-neck tee in a regular fit. Soft hand-feel, pre-shrunk fabric.', 24.99, TRUE),
  ('p0000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001',
   'Pocket Tee', 'pocket-tee',
   'Minimalist tee with a single chest pocket. Perfect layering piece.', 27.99, TRUE);

-- Hoodies
INSERT INTO products (id, category_id, name, slug, description, price, is_active) VALUES
  ('p0000004-0000-0000-0000-000000000004', 'c0000002-0000-0000-0000-000000000002',
   'Pullover Hoodie', 'pullover-hoodie',
   'Heavyweight 380 gsm fleece hoodie. Kangaroo pocket, adjustable hood.', 59.99, TRUE),
  ('p0000005-0000-0000-0000-000000000005', 'c0000002-0000-0000-0000-000000000002',
   'Zip-Up Hoodie', 'zip-up-hoodie',
   'Full-zip hoodie in brushed fleece. Ribbed cuffs and hem.', 64.99, TRUE);

-- Pants
INSERT INTO products (id, category_id, name, slug, description, price, is_active) VALUES
  ('p0000006-0000-0000-0000-000000000006', 'c0000003-0000-0000-0000-000000000003',
   'Cargo Jogger', 'cargo-jogger',
   'Tapered jogger with side cargo pockets. Elastic waist and cuffs.', 49.99, TRUE),
  ('p0000007-0000-0000-0000-000000000007', 'c0000003-0000-0000-0000-000000000003',
   'Straight Denim', 'straight-denim',
   'Classic straight-leg jeans in rigid indigo denim. 12 oz weight.', 54.99, TRUE);

-- Jackets
INSERT INTO products (id, category_id, name, slug, description, price, is_active) VALUES
  ('p0000008-0000-0000-0000-000000000008', 'c0000004-0000-0000-0000-000000000004',
   ' bomber Jacket', 'bomber-jacket',
   'Lightweight nylon bomber with satin lining. Ribbed collar, cuffs, hem.', 89.99, TRUE),
  ('p0000009-0000-0000-0000-000000000009', 'c0000004-0000-0000-0000-000000000004',
   'Denim Jacket', 'denim-jacket',
   'Washed denim jacket with button front. Classic trucker style.', 79.99, TRUE);

-- Accessories
INSERT INTO products (id, category_id, name, slug, description, price, is_active) VALUES
  ('p0000010-0000-0000-0000-000000000010', 'c0000005-0000-0000-0000-000000000005',
   'Logo Cap', 'logo-cap',
   'Adjustable cotton twill cap with embroidered logo.', 19.99, TRUE),
  ('p0000011-0000-0000-0000-000000000011', 'c0000005-0000-0000-0000-000000000005',
   'Canvas Tote', 'canvas-tote',
   'Heavy-duty canvas tote bag with interior pocket.', 22.99, TRUE);

-- ────────────────────────────────────────────
-- PRODUCT IMAGES  (placeholder Supabase Storage paths)
-- ────────────────────────────────────────────
-- Oversized Tee
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000001-0000-0000-0000-000000000001', '/products/oversized-tee-front.jpg',  TRUE,  0),
  ('p0000001-0000-0000-0000-000000000001', '/products/oversized-tee-back.jpg',   FALSE, 1);

-- Classic Crew Neck
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000002-0000-0000-0000-000000000002', '/products/crew-neck-front.jpg',  TRUE,  0),
  ('p0000002-0000-0000-0000-000000000002', '/products/crew-neck-detail.jpg', FALSE, 1);

-- Pocket Tee
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000003-0000-0000-0000-000000000003', '/products/pocket-tee-front.jpg', TRUE, 0);

-- Pullover Hoodie
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000004-0000-0000-0000-000000000004', '/products/hoodie-front.jpg',  TRUE,  0),
  ('p0000004-0000-0000-0000-000000000004', '/products/hoodie-back.jpg',   FALSE, 1);

-- Zip-Up Hoodie
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000005-0000-0000-0000-000000000005', '/products/zip-hoodie-front.jpg', TRUE, 0);

-- Cargo Jogger
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000006-0000-0000-0000-000000000006', '/products/cargo-jogger-front.jpg', TRUE,  0),
  ('p0000006-0000-0000-0000-000000000006', '/products/cargo-jogger-side.jpg',  FALSE, 1);

-- Straight Denim
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000007-0000-0000-0000-000000000007', '/products/denim-front.jpg', TRUE, 0);

-- Bomber Jacket
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000008-0000-0000-0000-000000000008', '/products/bomber-front.jpg',  TRUE,  0),
  ('p0000008-0000-0000-0000-000000000008', '/products/bomber-back.jpg',   FALSE, 1);

-- Denim Jacket
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000009-0000-0000-0000-000000000009', '/products/denim-jacket-front.jpg', TRUE, 0);

-- Logo Cap
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000010-0000-0000-0000-000000000010', '/products/cap-front.jpg', TRUE, 0);

-- Canvas Tote
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  ('p0000011-0000-0000-0000-000000000011', '/products/tote-front.jpg', TRUE, 0);

-- ────────────────────────────────────────────
-- PRODUCT VARIANTS
-- ────────────────────────────────────────────
-- Oversized Tee  (Black, White × S, M, L, XL)
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000001-0000-0000-0000-000000000001', 'S',  'Black', 'OT-BLK-S',  20),
  ('p0000001-0000-0000-0000-000000000001', 'M',  'Black', 'OT-BLK-M',  30),
  ('p0000001-0000-0000-0000-000000000001', 'L',  'Black', 'OT-BLK-L',  25),
  ('p0000001-0000-0000-0000-000000000001', 'XL', 'Black', 'OT-BLK-XL', 15),
  ('p0000001-0000-0000-0000-000000000001', 'S',  'White', 'OT-WHT-S',  20),
  ('p0000001-0000-0000-0000-000000000001', 'M',  'White', 'OT-WHT-M',  30),
  ('p0000001-0000-0000-0000-000000000001', 'L',  'White', 'OT-WHT-L',  25),
  ('p0000001-0000-0000-0000-000000000001', 'XL', 'White', 'OT-WHT-XL', 10);

-- Classic Crew Neck
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000002-0000-0000-0000-000000000002', 'S',  'Grey',  'CC-GREY-S',  25),
  ('p0000002-0000-0000-0000-000000000002', 'M',  'Grey',  'CC-GREY-M',  30),
  ('p0000002-0000-0000-0000-000000000002', 'L',  'Grey',  'CC-GREY-L',  20),
  ('p0000002-0000-0000-0000-000000000002', 'S',  'Black', 'CC-BLK-S',   25),
  ('p0000002-0000-0000-0000-000000000002', 'M',  'Black', 'CC-BLK-M',   30),
  ('p0000002-0000-0000-0000-000000000002', 'L',  'Black', 'CC-BLK-L',   20);

-- Pocket Tee
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000003-0000-0000-0000-000000000003', 'S',  'Navy',  'PT-NVY-S',  15),
  ('p0000003-0000-0000-0000-000000000003', 'M',  'Navy',  'PT-NVY-M',  20),
  ('p0000003-0000-0000-0000-000000000003', 'L',  'Navy',  'PT-NVY-L',  15);

-- Pullover Hoodie
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000004-0000-0000-0000-000000000004', 'S',  'Black', 'PH-BLK-S',  20),
  ('p0000004-0000-0000-0000-000000000004', 'M',  'Black', 'PH-BLK-M',  25),
  ('p0000004-0000-0000-0000-000000000004', 'L',  'Black', 'PH-BLK-L',  25),
  ('p0000004-0000-0000-0000-000000000004', 'XL', 'Black', 'PH-BLK-XL', 15),
  ('p0000004-0000-0000-0000-000000000004', 'M',  'Grey',  'PH-GREY-M', 20);

-- Zip-Up Hoodie
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000005-0000-0000-0000-000000000005', 'S',  'Black', 'ZH-BLK-S',  15),
  ('p0000005-0000-0000-0000-000000000005', 'M',  'Black', 'ZH-BLK-M',  20),
  ('p0000005-0000-0000-0000-000000000005', 'L',  'Black', 'ZH-BLK-L',  20);

-- Cargo Jogger
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000006-0000-0000-0000-000000000006', 'S',  'Black', 'CJ-BLK-S',  15),
  ('p0000006-0000-0000-0000-000000000006', 'M',  'Black', 'CJ-BLK-M',  25),
  ('p0000006-0000-0000-0000-000000000006', 'L',  'Black', 'CJ-BLK-L',  20),
  ('p0000006-0000-0000-0000-000000000006', 'M',  'Khaki', 'CJ-KHK-M',  15);

-- Straight Denim
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000007-0000-0000-0000-000000000007', 'S',  'Indigo', 'SD-IND-S',  15),
  ('p0000007-0000-0000-0000-000000000007', 'M',  'Indigo', 'SD-IND-M',  20),
  ('p0000007-0000-0000-0000-000000000007', 'L',  'Indigo', 'SD-IND-L',  20);

-- Bomber Jacket
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000008-0000-0000-0000-000000000008', 'S',  'Black', 'BJ-BLK-S',  10),
  ('p0000008-0000-0000-0000-000000000008', 'M',  'Black', 'BJ-BLK-M',  15),
  ('p0000008-0000-0000-0000-000000000008', 'L',  'Black', 'BJ-BLK-L',  15),
  ('p0000008-0000-0000-0000-000000000008', 'M',  'Olive', 'BJ-OLV-M',  10);

-- Denim Jacket
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000009-0000-0000-0000-000000000009', 'S',  'Blue', 'DJ-BLU-S',  10),
  ('p0000009-0000-0000-0000-000000000009', 'M',  'Blue', 'DJ-BLU-M',  15),
  ('p0000009-0000-0000-0000-000000000009', 'L',  'Blue', 'DJ-BLU-L',  15);

-- Logo Cap
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000010-0000-0000-0000-000000000010', 'One Size', 'Black', 'LC-BLK-OS', 50),
  ('p0000010-0000-0000-0000-000000000010', 'One Size', 'White', 'LC-WHT-OS', 40);

-- Canvas Tote
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES
  ('p0000011-0000-0000-0000-000000000011', 'One Size', 'Natural', 'CT-NAT-OS', 60),
  ('p0000011-0000-0000-0000-000000000011', 'One Size', 'Black',   'CT-BLK-OS', 40);
