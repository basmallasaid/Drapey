import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";

export async function POST(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { name, slug, description, image_url } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const { data, err } = await supabase
    .from("categories")
    .insert({ name, slug, description, image_url })
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PATCH(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );

  const { data, err } = await supabase
    .from("categories")
    .update(cleanUpdates)
    .eq("id", id)
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ category: data });
}

export async function DELETE(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });

  // products.category_id is NOT NULL with ON DELETE RESTRICT, so a category
  // that still has products cannot be safely deleted without breaking them.
  // Block deletion and ask the admin to reassign the products first.
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return NextResponse.json({
      error: `Cannot delete: ${count} product(s) still belong to this category. Reassign or remove them first.`,
    }, { status: 409 });
  }

  const { err } = await supabase.from("categories").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
