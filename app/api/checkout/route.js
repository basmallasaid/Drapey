import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateShipping } from '@/lib/constants';
import { sendOrderNotification } from '@/lib/email/order-notification';

export async function POST(request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address, notes } = await request.json();

    if (!address?.full_name || !address?.phone || !address?.governorate || !address?.city || !address?.street) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
    }

    // Fetch cart
    const { data: cart } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 400 });
    }

    // Fetch cart items with variant and product info
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, product_variant_id,
        product_variant:product_variants(
          id, size, color, sku, stock_quantity, product_id,
          product:products(id, name, price, is_active)
        )
      `)
      .eq('cart_id', cart.id);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Server-side validation
    let subtotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const variant = item.product_variant;
      if (!variant || !variant.product) {
        return NextResponse.json({ error: `Invalid product variant: ${item.product_variant_id}` }, { status: 400 });
      }

      if (!variant.product.is_active) {
        return NextResponse.json({ error: `Product "${variant.product.name}" is no longer available` }, { status: 400 });
      }

      if (variant.stock_quantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for "${variant.product.name}" (${variant.size}/${variant.color}). Available: ${variant.stock_quantity}`,
        }, { status: 400 });
      }

      const unitPrice = variant.product.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_variant_id: variant.id,
        product_name: variant.product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    const shippingFee = calculateShipping(subtotal);
    const totalAmount = subtotal + shippingFee;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        subtotal,
        shipping_fee: shippingFee,
        discount: 0,
        total_amount: totalAmount,
        customer_name: address.full_name,
        customer_email: user.email,
        customer_phone: address.phone,
        governorate: address.governorate,
        city: address.city,
        area: address.area || '',
        street: address.street,
        building: address.building || '',
        floor: address.floor || '',
        apartment: address.apartment || '',
        notes: notes || '',
        status: 'pending',
      })
      .select(`
        id, subtotal, shipping_fee, discount, total_amount,
        customer_name, customer_email, customer_phone,
        governorate, city, area, street, building, floor, apartment,
        notes, status, created_at
      `)
      .single();

    if (orderError) {
      console.error('Order creation error:', {
        message: orderError?.message,
        code: orderError?.code,
        details: orderError?.details,
        hint: orderError?.hint,
      });
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items
    const orderItemsWithId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithId);

    if (itemsError) {
      console.error('Order items error:', {
        message: itemsError?.message,
        code: itemsError?.code,
        details: itemsError?.details,
        hint: itemsError?.hint,
      });
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Decrement stock atomically using SQL to prevent race conditions
    for (const item of cartItems) {
      const { error: stockError } = await supabase
        .rpc('decrement_stock', {
          p_variant_id: item.product_variant_id,
          p_quantity: item.quantity,
        });

      if (stockError) {
        console.error('Stock decrement error:', {
          message: stockError?.message,
          code: stockError?.code,
          details: stockError?.details,
          hint: stockError?.hint,
        });
        return NextResponse.json({
          error: `Failed to update stock for "${item.product_variant.product.name}"`,
        }, { status: 500 });
      }
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);

    // Send admin email notification (non-blocking — order is already complete)
    try {
      await sendOrderNotification(order, orderItems);
    } catch (emailErr) {
      console.error("[Checkout] Order notification failed (non-critical):", emailErr);
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
