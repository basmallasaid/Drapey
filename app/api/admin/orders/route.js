import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";

export async function PATCH(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { orderId, status } = body;

  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
  }

  const validStatuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, err } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ order: data });
}
