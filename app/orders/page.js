'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import { showToast, showError, confirmAction } from '@/lib/sweetalert';


const STATUS_STYLES = {
  pending: 'bg-cream text-tan border-tan/20',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  preparing: 'bg-purple-50 text-purple-700 border-purple-100',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  delivered: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};

const CANCELLABLE_STATUSES = new Set(['pending', 'confirmed']);

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`*, order_items(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user, supabase, router]);

  const handleCancel = async (orderId) => {
    const confirmed = await confirmAction({
      title: 'Cancel this order?',
      text: 'Are you sure? This action cannot be undone.',
      confirmText: 'Yes, cancel order',
    });
    if (!confirmed) return;

    setCancellingId(orderId);
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      setExpandedId(null);
      showToast('success', 'Order cancelled.');
    } catch (err) {
      showError('Failed', err.message || 'Something went wrong');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="w-10 h-10 border-2 border-light-beige border-t-tan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <main className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-cream pt-32 pb-16 border-b border-light-beige text-center">
        <h1 className="text-4xl md:text-6xl font-serif text-dark-brown mb-2 tracking-tight">My Orders</h1>
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-[4px] text-medium-brown opacity-70">
          Track and manage your purchases
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-12">
        {orders.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-light-beige">
            <h2 className="text-xl font-serif text-dark-brown mb-6">You haven't placed any orders yet.</h2>
            <Link href="/products" className="inline-block bg-dark-brown text-white px-10 py-4 text-[10px] font-bold uppercase tracking-[2px] hover:bg-tan transition-all">
              Discover Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} className={`border border-light-beige transition-all duration-300 ${isExpanded ? 'shadow-lg ring-1 ring-light-beige' : 'hover:border-tan'}`}>
                  {/* Order Header Summary */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 text-left bg-white"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="text-[13px] font-bold tracking-wider text-dark-brown uppercase">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 border rounded-sm ${STATUS_STYLES[order.status] || 'bg-light-beige text-brown border-transparent'}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-medium-brown font-sans">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-8 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-[10px] text-medium-brown uppercase tracking-widest mb-0.5">Total Amount</p>
                        <p className="font-bold text-base text-dark-brown">EGP {order.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                      <svg className={`w-5 h-5 text-medium-brown transition-transform duration-500 ${isExpanded ? 'rotate-180 text-tan' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-light-beige p-6 md:p-8 bg-cream/10 animate-fadeIn overflow-hidden">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        
                        <div className="space-y-6">
                          <h3 className="text-[11px] font-bold uppercase tracking-[3px] text-dark-brown border-b border-light-beige pb-3">Order Items</h3>
                          <div className="space-y-4">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="flex justify-between items-start text-[13px]">
                                <div className="space-y-1">
                                  <p className="font-medium text-dark-brown">{item.product_name}</p>
                                  <p className="text-[11px] text-medium-brown uppercase tracking-wider">
                                    Size: {item.size} / Color: {item.color} <span className="mx-2">|</span> Qty: {item.quantity}
                                  </p>
                                </div>
                                <p className="font-bold text-dark-brown">EGP {item.total_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-6 border-t border-light-beige space-y-2 text-[13px]">
                            <div className="flex justify-between text-medium-brown"><span>Subtotal</span><span>EGP {order.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between text-medium-brown"><span>Shipping</span><span>{order.shipping_fee === 0 ? 'Complimentary' : `EGP ${order.shipping_fee?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</span></div>
                            {order.discount > 0 && <div className="flex justify-between text-rose-brown"><span>Discount</span><span>-EGP {order.discount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                            <div className="flex justify-between font-bold text-[15px] pt-4 text-dark-brown">
                              <span>Total</span>
                              <span>EGP {order.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-[11px] font-bold uppercase tracking-[3px] text-dark-brown border-b border-light-beige pb-3">Delivery Information</h3>
                          <div className="text-[13px] text-medium-brown space-y-2 leading-relaxed font-sans">
                            <p className="font-bold text-dark-brown uppercase tracking-wider">{order.customer_name}</p>
                            <p>{order.street}{order.building ? `, Bldg ${order.building}` : ''}{order.floor ? `, Fl ${order.floor}` : ''}{order.apartment ? `, Apt ${order.apartment}` : ''}</p>
                            <p>{order.city}, {order.governorate}</p>
                            <p className="pt-2 font-medium">{order.customer_phone}</p>
                          </div>
                        </div>
                      </div>

                      {CANCELLABLE_STATUSES.has(order.status) && (
                        <div className="mt-10 flex justify-end border-t border-light-beige pt-6">
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={cancellingId === order.id}
                            className="text-[10px] font-bold uppercase tracking-[2px] text-red-500 border border-red-100 px-8 py-3 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {cancellingId === order.id ? 'Processing...' : 'Cancel Order'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
    </>
  );
}