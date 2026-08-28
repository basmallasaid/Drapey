import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";
import { normalizeSize } from "@/lib/sizes";

// Builds an SKU distinct from (product_id, size, color) uniqueness.
// Not strictly required (SKU is independent), but we derive stable, unique
// SKUs from the product + combination so product/insert never collides.
function buildSku(productId, size, color) {
  const key = `${productId}-${size}-${color}`
    .replace(/\s+/g, "-")
    .toUpperCase();
  return key.slice(0, 40);
}

// Normalizes + trims an incoming variant, returning null for invalid rows.
function cleanVariant(v) {
  if (!v || !v.size || !v.color) return null;
  const size = normalizeSize(v.size);
  const color = String(v.color).trim();
  if (!size || !color) return null;
  return {
    size,
    color,
    stock_quantity: Number(v.stock_quantity) || 0,
    sku: v.sku || null,
  };
}

// Returns a friendly, specific message if any variant in `rows` is already
// present in the DB for the given product, else null.
async function findVariantConflict(supabase, productId, rows) {
  if (!rows || rows.length === 0) return null;
  const { data: existing } = await supabase
    .from("product_variants")
    .select("size, color")
    .eq("product_id", productId);

  const existingKeys = new Set(
    (existing || []).map((v) => `${normalizeSize(v.size)}::${String(v.color).trim().toLowerCase()}`)
  );

  for (const v of rows) {
    const key = `${v.size}::${v.color.toLowerCase()}`;
    if (existingKeys.has(key)) {
      return { row: v, error: `This size already exists for this product.` };
    }
  }
  return null;
}

// Converts a Supabase/Postgres error into a friendly admin message, hiding
// raw 23505 unique-violation details behind a generic, human-readable line.
function friendlyError(err, fallback) {
  if (!err) return fallback;
  if (err.code === "23505") {
    return "This value already exists. Please choose a different one.";
  }
  return err.message || fallback;
}

export async function POST(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { name, description, price, category_id, is_active, variants, images } = body;

  if (!name || price == null) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  // Only required fields that actually exist on the products table.
  const { data: product, err: pErr } = await supabase
    .from("products")
    .insert({
      name,
      description: description || "",
      slug: (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `product-${Date.now()}`,
      price,
      category_id: category_id || null,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Insert variants (size, color, stock) — required for the storefront to work.
  if (Array.isArray(variants) && variants.length > 0) {
    const variantRows = variants
      .map(cleanVariant)
      .filter(Boolean)
      .map((v) => ({
        product_id: product.id,
        size: v.size,
        color: v.color,
        sku: v.sku || buildSku(product.id, v.size, v.color),
        stock_quantity: v.stock_quantity,
      }));

    // Server-side duplicate check (case-insensitive on the normalized size).
    const conflict = await findVariantConflict(supabase, product.id, variantRows);
    if (conflict) {
      return NextResponse.json({ error: conflict.error }, { status: 409 });
    }

    // Reject duplicate combinations within the submitted set itself.
    const seen = new Set();
    for (const v of variantRows) {
      const key = `${v.size}::${v.color.toLowerCase()}`;
      if (seen.has(key)) {
        return NextResponse.json(
          { error: `This variant already exists for this product (${v.size} / ${v.color}).` },
          { status: 409 }
        );
      }
      seen.add(key);
    }

    if (variantRows.length > 0) {
      const { error: vErr } = await supabase.from("product_variants").insert(variantRows);
      if (vErr) {
        return NextResponse.json(
          { error: friendlyError(vErr, `Variant error: ${vErr.message}`) },
          { status: vErr.code === "23505" ? 409 : 500 }
        );
      }
    }
  }

  // Insert images (associate to the product_images table).
  if (Array.isArray(images) && images.length > 0) {
    const imageRows = images
      .filter((img) => img && img.image_url)
      .map((img, i) => ({
        product_id: product.id,
        image_url: img.image_url,
        is_primary: img.is_primary ?? i === 0,
        sort_order: i,
      }));

    if (imageRows.length > 0) {
      const { error: iErr } = await supabase.from("product_images").insert(imageRows);
      if (iErr) return NextResponse.json({ error: `Image error: ${iErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ product }, { status: 201 });
}

export async function PATCH(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { id, name, description, price, category_id, is_active, slug, variants, images } = body;

  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });

  // Update only real product columns.
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price;
  if (category_id !== undefined) updates.category_id = category_id;
  if (is_active !== undefined) updates.is_active = is_active;
  if (slug !== undefined) updates.slug = slug;

  const { data: product, err: pErr } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Replace variants: delete existing, re-insert the submitted set.
  // This is intentional for the edit flow — the admin submits the full
  // current variant list, so old removed combos are dropped and new ones added.
  if (Array.isArray(variants)) {
    const cleaned = variants.map(cleanVariant).filter(Boolean);

    // Reject duplicate combinations within the submitted set (the DB's
    // UNIQUE(product_id, size, color) backstops this, but failing fast here
    // gives a clear message before any data is deleted).
    const seen = new Set();
    for (const v of cleaned) {
      const key = `${v.size}::${v.color.toLowerCase()}`;
      if (seen.has(key)) {
        return NextResponse.json(
          { error: `This variant already exists for this product (${v.size} / ${v.color}).` },
          { status: 409 }
        );
      }
      seen.add(key);
    }

    const { error: delVErr } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", id);
    if (delVErr) return NextResponse.json({ error: delVErr.message }, { status: 500 });

    const variantRows = cleaned.map((v) => ({
      product_id: id,
      size: v.size,
      color: v.color,
      sku: v.sku || buildSku(id, v.size, v.color),
      stock_quantity: v.stock_quantity,
    }));

    if (variantRows.length > 0) {
      const { error: addVErr } = await supabase.from("product_variants").insert(variantRows);
      if (addVErr) {
        return NextResponse.json(
          { error: friendlyError(addVErr, `Variant error: ${addVErr.message}`) },
          { status: addVErr.code === "23505" ? 409 : 500 }
        );
      }
    }
  }

  // Replace images: delete existing associations, re-insert submitted set.
  if (Array.isArray(images)) {
    const { error: delIErr } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);
    if (delIErr) return NextResponse.json({ error: delIErr.message }, { status: 500 });

    const imageRows = images
      .filter((img) => img && img.image_url)
      .map((img, i) => ({
        product_id: id,
        image_url: img.image_url,
        is_primary: img.is_primary ?? i === 0,
        sort_order: i,
      }));

    if (imageRows.length > 0) {
      const { error: addIErr } = await supabase.from("product_images").insert(imageRows);
      if (addIErr) return NextResponse.json({ error: `Image error: ${addIErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ product });
}

export async function DELETE(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });

  // Guard: if any variant of this product is referenced by historical
  // order_items, physically deleting would violate ON DELETE RESTRICT and
  // break historical orders. Prefer deactivation in that case.
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id);

  const variantIds = (variants || []).map((v) => v.id);

  if (variantIds.length > 0) {
    const { count } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .in("product_variant_id", variantIds);

    if (count && count > 0) {
      return NextResponse.json({ error: "Product is referenced by existing orders. Deactivate it instead of deleting." }, { status: 409 });
    }
  }

  // product_images / product_variants / cart_items / favorites all cascade
  // on product delete, so a single delete is enough.
  const { err } = await supabase.from("products").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
