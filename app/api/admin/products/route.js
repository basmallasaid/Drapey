import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";
import { normalizeSize } from "@/lib/sizes";

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

// Rejects duplicate size/color combinations within the submitted set
// (case-insensitive on both). The DB backstops this too, but failing fast
// here gives a clear message without calling the RPC.
function findDuplicateVariant(rows) {
  if (!rows || rows.length === 0) return null;
  const seen = new Set();
  for (const v of rows) {
    const key = `${v.size}::${v.color.toLowerCase()}`;
    if (seen.has(key)) return v;
    seen.add(key);
  }
  return null;
}

// Cleans the submitted images (order preserved; sort_order = index).
function cleanImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img) => img && img.image_url)
    .map((img, i) => ({
      image_url: img.image_url,
      is_primary: !!img.is_primary,
      sort_order: i,
    }));
}

// Converts an RPC / Postgres error into a friendly admin message.
function friendlyError(error, fallback) {
  if (!error) return fallback;
  if (error.code === "23505") {
    return error.message || "This value already exists. Please choose a different one.";
  }
  return error.message || fallback;
}

// Maps an RPC error to a friendly HTTP response.
function rpcErrorResponse(error) {
  const message = friendlyError(error, "Operation failed. Please try again.");
  let status = 500;
  if (error.code === "42501") {
    status = 403;
  } else if (error.code === "23505") {
    status = 409;
  } else if (error.code === "P0002") {
    status = 404;
  } else if (error.code === "22023") {
    status = 400;
  }
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { name, description, price, category_id, is_active, variants, images } = body;

  if (!name || price == null) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  const cleaned = (Array.isArray(variants) ? variants.map(cleanVariant).filter(Boolean) : []);

  const dup = findDuplicateVariant(cleaned);
  if (dup) {
    return NextResponse.json(
      { error: `This variant already exists for this product (${dup.size} / ${dup.color}).` },
      { status: 409 }
    );
  }

  // Whole create (product + variants + images) runs atomically in the
  // admin_create_product RPC (supabase/admin_product_update.sql).
  const { data: product, error: rpcError } = await supabase.rpc("admin_create_product", {
    p_name: name,
    p_description: description || "",
    p_price: Number(price),
    p_category_id: category_id || null,
    p_is_active: is_active ?? true,
    p_variants: cleaned,
    p_images: cleanImages(images),
  });

  if (rpcError) return rpcErrorResponse(rpcError);

  return NextResponse.json({ product }, { status: 201 });
}

export async function PATCH(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { id, name, description, price, category_id, is_active, variants, images } = body;

  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  if (!name || price == null) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  const cleaned = (Array.isArray(variants) ? variants.map(cleanVariant).filter(Boolean) : []);

  const dup = findDuplicateVariant(cleaned);
  if (dup) {
    return NextResponse.json(
      { error: `This variant already exists for this product (${dup.size} / ${dup.color}).` },
      { status: 409 }
    );
  }

  // Whole update (header + variant reconcile + image reconcile) runs
  // atomically in the admin_update_product RPC. Existing variants keep their
  // original id and sku; variants referenced by historical orders that were
  // removed from the form are retired with stock = 0, never deleted.
  const { data: product, error: rpcError } = await supabase.rpc("admin_update_product", {
    p_product_id: id,
    p_name: name,
    p_description: description || "",
    p_price: Number(price),
    p_category_id: category_id || null,
    p_is_active: is_active ?? true,
    p_variants: cleaned,
    p_images: cleanImages(images),
  });

  if (rpcError) return rpcErrorResponse(rpcError);

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
  const { error: delErr } = await supabase.from("products").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}