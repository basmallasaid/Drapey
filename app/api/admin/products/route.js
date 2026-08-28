import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";

// Builds an SKU distinct from (product_id, size, color) uniqueness.
// Not strictly required (SKU is independent), but we derive stable, unique
// SKUs from the product + combination so product/insert never collides.
function buildSku(productId, size, color) {
  const key = `${productId}-${size}-${color}`
    .replace(/\s+/g, "-")
    .toUpperCase();
  return key.slice(0, 40);
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
      .filter((v) => v && v.size && v.color)
      .map((v) => ({
        product_id: product.id,
        size: String(v.size).trim(),
        color: String(v.color).trim(),
        sku: v.sku || buildSku(product.id, v.size, v.color),
        stock_quantity: Number(v.stock_quantity) || 0,
      }));

    if (variantRows.length > 0) {
      const { error: vErr } = await supabase.from("product_variants").insert(variantRows);
      if (vErr) return NextResponse.json({ error: `Variant error: ${vErr.message}` }, { status: 500 });
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
    const { error: delVErr } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", id);
    if (delVErr) return NextResponse.json({ error: delVErr.message }, { status: 500 });

    const variantRows = variants
      .filter((v) => v && v.size && v.color)
      .map((v) => ({
        product_id: id,
        size: String(v.size).trim(),
        color: String(v.color).trim(),
        sku: v.sku || buildSku(id, v.size, v.color),
        stock_quantity: Number(v.stock_quantity) || 0,
      }));

    if (variantRows.length > 0) {
      const { error: addVErr } = await supabase.from("product_variants").insert(variantRows);
      if (addVErr) return NextResponse.json({ error: `Variant error: ${addVErr.message}` }, { status: 500 });
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
