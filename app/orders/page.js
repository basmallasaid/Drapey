'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user, supabase, router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#f6f5f3] py-16 text-center mb-10 border-b border-gray-100">
        <h1 className="text-3xl md:text-5xl font-serif font-medium mb-4">My Orders</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-serif mb-4">No orders yet</h2>
            <Link href="/products" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-100">
                <button
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="w-full flex flex-col md:flex-row justify-between items-start md:items-center p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 md:mt-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-sm">${order.total_amount?.toFixed(2)}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedId === order.id && (
                  <div className="border-t border-gray-100 p-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">Items</h3>
                        <div className="space-y-2">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.product_name} ({item.size}/{item.color}) x{item.quantity}
                              </span>
                              <span className="font-medium">${item.total_price?.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping_fee === 0 ? 'Free' : `$${order.shipping_fee?.toFixed(2)}`}</span></div>
                          {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-${order.discount?.toFixed(2)}</span></div>}
                          <div className="flex justify-between font-bold pt-2 border-t border-gray-100"><span>Total</span><span>${order.total_amount?.toFixed(2)}</span></div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">Shipping Address</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{order.customer_name}</p>
                          <p>{order.street}{order.building ? `, Bldg ${order.building}` : ''}{order.floor ? `, Fl ${order.floor}` : ''}{order.apartment ? `, Apt ${order.apartment}` : ''}</p>
                          <p>{order.city}, {order.governorate}</p>
                          <p>{order.customer_phone}</p>
                        </div>
                        {order.notes && (
                          <div className="mt-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">Notes</h3>
                            <p className="text-sm text-gray-600">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
