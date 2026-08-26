'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCart } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import { calculateShipping } from '../../lib/constants';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const { cartItems, subtotal, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    governorate: '',
    city: '',
    area: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchAddresses = async () => {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      setAddresses(data || []);
      const def = data?.find(a => a.is_default);
      if (def) {
        setSelectedAddressId(def.id);
        setUseNewAddress(false);
      }
      if (profile) {
        setForm(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          phone: profile.phone || '',
        }));
      }
    };
    fetchAddresses();
  }, [user, profile, supabase, router]);

  useEffect(() => {
    if (selectedAddressId && !useNewAddress) {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        setForm({
          full_name: addr.full_name,
          phone: addr.phone,
          governorate: addr.governorate,
          city: addr.city,
          area: addr.area,
          street: addr.street,
          building: addr.building,
          floor: addr.floor,
          apartment: addr.apartment,
          notes: '',
        });
      }
    }
  }, [selectedAddressId, useNewAddress, addresses]);

  const shippingFee = calculateShipping(subtotal);
  const total = subtotal + shippingFee;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: form, notes: form.notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to place order');
        setLoading(false);
        return;
      }

      await clearCart();
      router.push(`/order-confirmation?id=${data.orderId}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-serif mb-4">Your cart is empty</h2>
          <Link href="/products" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
            Shop Now
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#f6f5f3] py-16 text-center mb-10 border-b border-gray-100">
        <h1 className="text-3xl md:text-5xl font-serif font-medium mb-4">Checkout</h1>
        <div className="flex justify-center items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-black transition-colors">Cart</Link>
          <span>/</span>
          <span className="text-black">Checkout</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-20">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Address form */}
          <div className="lg:col-span-8">
            <h2 className="text-lg font-bold mb-6 uppercase tracking-widest text-xs">Shipping Address</h2>

            {addresses.length > 0 && (
              <div className="mb-6 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={useNewAddress}
                    onChange={() => setUseNewAddress(true)}
                    className="accent-black"
                  />
                  <span className="text-sm font-medium">Use new address</span>
                </label>
                {addresses.map(addr => (
                  <label key={addr.id} className="flex items-start gap-3 cursor-pointer p-3 border border-gray-100 hover:border-gray-300 transition-colors">
                    <input
                      type="radio"
                      checked={selectedAddressId === addr.id && !useNewAddress}
                      onChange={() => { setSelectedAddressId(addr.id); setUseNewAddress(false); }}
                      className="accent-black mt-1"
                    />
                    <div className="text-sm">
                      <p className="font-medium">{addr.full_name} — {addr.phone}</p>
                      <p className="text-gray-500">{addr.street}, {addr.city}, {addr.governorate}</p>
                      {addr.is_default && <span className="text-[10px] font-bold text-gray-400 uppercase">Default</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Full Name" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="governorate" value={form.governorate} onChange={handleChange} required placeholder="Governorate" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="city" value={form.city} onChange={handleChange} required placeholder="City" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="area" value={form.area} onChange={handleChange} placeholder="Area (optional)" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="street" value={form.street} onChange={handleChange} required placeholder="Street" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="building" value={form.building} onChange={handleChange} placeholder="Building (optional)" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="floor" value={form.floor} onChange={handleChange} placeholder="Floor (optional)" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="apartment" value={form.apartment} onChange={handleChange} placeholder="Apartment (optional)" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors md:col-span-2" />
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Order notes (optional)" rows={3} className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors md:col-span-2 resize-none" />
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-4">
            <div className="border border-gray-100 p-6 bg-gray-50 sticky top-24">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-widest text-xs">Order Summary</h2>
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {cartItems.map(item => {
                  const product = item.product_variant?.product;
                  const variant = item.product_variant;
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">
                        {product.name} ({variant?.size}/{variant?.color}) x{item.quantity}
                      </span>
                      <span className="font-medium shrink-0">${(product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3 text-sm border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  {shippingFee === 0 ? (
                    <span className="text-green-600 font-medium text-xs">FREE</span>
                  ) : (
                    <span className="font-bold">${shippingFee.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-4 mt-6 text-xs font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
              <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-4">
                No payment required — pay on delivery
              </p>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
