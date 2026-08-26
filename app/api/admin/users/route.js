import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";

export async function PATCH(request) {
  const { error, supabase, user } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
  }

  if (!["customer", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent admin from demoting themselves
  if (userId === user.id && role === "customer") {
    return NextResponse.json({ error: "Cannot change your own admin role" }, { status: 400 });
  }

  const { data, err } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ user: data });
}

export async function DELETE(request) {
  const { error, supabase, user } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent self-deletion
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  // Delete user data first
  await supabase.from("cart_items").delete().eq("user_id", userId);
  await supabase.from("cart").delete().eq("user_id", userId);
  await supabase.from("favorites").delete().eq("user_id", userId);
  await supabase.from("addresses").delete().eq("user_id", userId);

  // Delete the user row
  const { err } = await supabase.from("users").delete().eq("id", userId);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
