import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderCancellationNotification } from '@/lib/email/order-notification';

export async function POST(request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    // Atomically cancel the order and restore stock.
    // The RPC verifies ownership and that the order is still cancellable,
    // so a second call for the same order is a safe no-op.
    const { data: cancelled, error: cancelError } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_user_id: user.id,
    });

    if (cancelError) {
      console.error('Cancel order RPC error:', {
        message: cancelError?.message,
        code: cancelError?.code,
        details: cancelError?.details,
        hint: cancelError?.hint,
      });

      // PGRST202 = the cancel_order RPC is not present in PostgREST's
      // schema cache, which almost always means the SQL in
      // supabase/cancel_order.sql has not been applied to the database.
      if (cancelError.code === 'PGRST202') {
        return NextResponse.json({
          error: 'Cancellation is not available yet. Please apply supabase/cancel_order.sql in the Supabase SQL editor.',
        }, { status: 500 });
      }

      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    if (!cancelled) {
      // Order not found, not owned by the user, or no longer cancellable.
      return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 });
    }

    // Fetch the (now cancelled) order and its items to confirm and to email.
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (order) {
      // Send admin cancellation notification (non-blocking — cancellation is complete)
      try {
        await sendOrderCancellationNotification(order, order.order_items || []);
      } catch (emailErr) {
        console.error("[Cancel] Order cancellation notification failed (non-critical):", emailErr);
      }
    }

    return NextResponse.json({ success: true, status: 'cancelled' });
  } catch (err) {
    console.error('Cancel order error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
