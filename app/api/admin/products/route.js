import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";

export async function POST(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { name, description, price, category_id, image_url, is_active } = body;

  if (!name || price == null) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  const { data, err } = await supabase
    .from("products")
    .insert({ name, description, price, category_id, image_url, is_active: is_active ?? true })
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });

  // Clean up undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );

  const { data, err } = await supabase
    .from("products")
    .update(cleanUpdates)
    .eq("id", id)
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ product: data });
}

export async function DELETE(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });

  // Delete related data
  await supabase.from("product_images").delete().eq("product_id", id);
  await supabase.from("product_variants").delete().eq("product_id", id);
  await supabase.from("cart_items").delete().eq("product_id", id);
  await supabase.from("favorites").delete().eq("product_id", id);

  const { err } = await supabase.from("products").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
