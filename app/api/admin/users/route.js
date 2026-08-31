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

  const { data, error: updateError } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

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

  // Block deleting users who have orders (orders.user_id is ON DELETE
  // RESTRICT, so a hard delete cannot succeed and would corrupt history).
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count && count > 0) {
    return NextResponse.json({ error: "Cannot delete a user who has orders." }, { status: 409 });
  }

  // cart, cart_items, favorites and addresses are ON DELETE CASCADE from users,
  // so deleting the profile row cleans those up automatically.
  const { error: deleteError } = await supabase.from("users").delete().eq("id", userId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
