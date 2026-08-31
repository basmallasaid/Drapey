import { NextResponse } from "next/server";
import { adminResponse } from "@/lib/supabase/admin";
import { ORDER_STATUSES } from "@/lib/order-status";

export async function PATCH(request) {
  const { error, supabase } = await adminResponse();
  if (error) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json();
  const { orderId, status } = body;

  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
  }

  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Cancellation must restore purchased stock exactly once and be idempotent.
  // This is done atomically in the database (admin_cancel_order RPC) so the
  // customer-facing cancel_order flow is not affected and stock is never
  // restored twice. Normal status transitions never touch inventory.
  if (status === "cancelled") {
    const { data: cancelled, error: rpcErr } = await supabase.rpc("admin_cancel_order", {
      p_order_id: orderId,
    });

    if (rpcErr) {
      console.error("Admin cancel order RPC error:", {
        message: rpcErr?.message,
        code: rpcErr?.code,
        hint: rpcErr?.hint,
      });
      if (rpcErr.code === "PGRST202") {
        return NextResponse.json({
          error: "Cancellation is not available yet. Please apply supabase/admin_fixes.sql in the Supabase SQL editor.",
        }, { status: 500 });
      }
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    if (!cancelled) {
      return NextResponse.json({ error: "Order is already cancelled or cannot be cancelled now" }, { status: 400 });
    }

    return NextResponse.json({ order: { id: orderId, status: "cancelled" } });
  }

  const { data, error: updateError } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ order: data });
}
