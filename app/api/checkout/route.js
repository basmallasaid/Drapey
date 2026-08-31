import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderNotification } from '@/lib/email/order-notification';

// Maps the token-prefixed exceptions raised by the place_order RPC
// (supabase/place_order.sql) into friendly, human-readable messages.
function friendlyCheckoutError(message) {
  if (message.startsWith('NO_STOCK:')) {
    const [, name, size, color, available] = message.split('|');
    return {
      code: 'insufficient_stock',
      message: `Insufficient stock for "${name}" (${size}/${color}). Available: ${available}`,
    };
  }
  if (message.startsWith('UNAVAILABLE:')) {
    const name = message.slice('UNAVAILABLE:'.length);
    return { code: 'unavailable', message: `"${name}" is no longer available.` };
  }
  if (message.startsWith('CART_EMPTY')) {
    return {
      code: 'cart_empty',
      message: 'Your cart is empty. Add items before checking out.',
    };
  }
  if (message.includes('Missing required address fields')) {
    return {
      code: 'invalid_address',
      message: 'Please fill in all required delivery fields before checking out.',
    };
  }
  return null;
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot place customer orders.' }, { status: 403 });
    }

    const { address, notes } = await request.json();

    if (!address?.full_name || !address?.phone || !address?.governorate || !address?.city || !address?.street) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
    }

    // The ENTIRE checkout (validation, order + items, stock deduction, cart
    // clearing) runs in a single Postgres transaction inside place_order.
    const { data, error: rpcError } = await supabase.rpc('place_order', {
      p_address: address,
      p_notes: notes || '',
    });

    if (rpcError) {
      console.error('[Checkout] place_order error:', {
        message: rpcError?.message,
        code: rpcError?.code,
        details: rpcError?.details,
        hint: rpcError?.hint,
      });

      const friendly = friendlyCheckoutError(rpcError.message || '');
      if (friendly) {
        return NextResponse.json({ error: friendly.message, code: friendly.code }, { status: 400 });
      }
      if (rpcError.code === '42501') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to create order. Please try again.' }, { status: 500 });
    }

    const orderId = data?.order_id;

    // Load the finished order to send the admin notification. This read is
    // non-critical — the order already exists and the user sees the success
    // page regardless of whether the email lands.
    let order = null;
    try {
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();
      order = fullOrder;
    } catch (readErr) {
      console.error('[Checkout] Order reload failed (non-critical):', readErr);
    }

    // Admin email notification (non-blocking — order is already committed).
    if (order) {
      try {
        await sendOrderNotification(order, order.order_items);
      } catch (emailErr) {
        console.error('[Checkout] Order notification failed (non-critical):', emailErr);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}