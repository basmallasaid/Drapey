'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCart } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import { calculateShipping } from '../../lib/constants';
import { showSuccess, showError } from '@/lib/sweetalert';


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
    full_name: '', phone: '', governorate: '', city: '', area: '', street: '', building: '', floor: '', apartment: '', notes: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
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
        setForm(prev => ({ ...prev, full_name: profile.full_name || '', phone: profile.phone || '' }));
      }
    };
    fetchAddresses();
  }, [user, profile, supabase, router]);

  useEffect(() => {
    if (selectedAddressId && !useNewAddress) {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        setForm({
          full_name: addr.full_name, phone: addr.phone, governorate: addr.governorate, city: addr.city,
          area: addr.area, street: addr.street, building: addr.building, floor: addr.floor, apartment: addr.apartment, notes: '',
        });
      }
    }
  }, [selectedAddressId, useNewAddress, addresses]);

  const shippingFee = calculateShipping(subtotal);
  const total = subtotal + shippingFee;

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: form, notes: form.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await clearCart();
      showSuccess('Order Confirmed', 'Your pieces are on the way.');
      router.push(`/order-confirmation?id=${data.orderId}`);
    } catch (err) {
      showError('Failed', err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center space-y-8">
        <h2 className="text-3xl font-serif">Your bag is empty</h2>
        <Link href="/products" className="bg-dark-brown text-white px-12 py-4 text-[10px] font-bold uppercase tracking-[3px]">Explore Shop</Link>
      </main>
    );
  }

  return (
    <>
    <main className="min-h-screen bg-white pb-32">
      {/* 1. Header Section */}
      <div className="bg-cream pt-32 pb-20 border-b border-light-beige text-center">
        <h1 className="text-5xl md:text-7xl font-serif text-dark-brown mb-6 tracking-tight italic">
          Checkout <span className="not-italic font-normal">Details</span>
        </h1>
        <div className="flex justify-center items-center gap-4 text-[10px] uppercase tracking-[4px] font-bold text-medium-brown">
          <Link href="/cart" className="hover:text-tan transition-colors">Bag</Link>
          <span className="opacity-30">/</span>
          <span className="text-dark-brown">Information</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left: Address Section */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Address Selection Cards */}
            <div className="space-y-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[4px] text-dark-brown border-b border-light-beige pb-4">
                Delivery Destination
              </h2>

              {addresses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`cursor-pointer p-6 border transition-all duration-300 ${useNewAddress ? 'border-tan bg-cream/20' : 'border-light-beige hover:border-tan/30'}`}>
                    <input type="radio" checked={useNewAddress} onChange={() => setUseNewAddress(true)} className="hidden" />
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-dark-brown mb-1">New Address</p>
                    <p className="text-[11px] text-medium-brown">Enter a different delivery location</p>
                  </label>
                  {addresses.map(addr => (
                    <label key={addr.id} className={`cursor-pointer p-6 border transition-all duration-300 ${selectedAddressId === addr.id && !useNewAddress ? 'border-tan bg-cream/20' : 'border-light-beige hover:border-tan/30'}`}>
                      <input type="radio" checked={selectedAddressId === addr.id && !useNewAddress} onChange={() => { setSelectedAddressId(addr.id); setUseNewAddress(false); }} className="hidden" />
                      <p className="text-[10px] font-bold uppercase tracking-[2px] text-dark-brown mb-1 truncate">{addr.full_name}</p>
                      <p className="text-[11px] text-medium-brown truncate">{addr.street}, {addr.city}</p>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Form */}
            <div className={`space-y-10 transition-opacity duration-500 ${!useNewAddress && 'opacity-60 pointer-events-none'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown">Full Name</label>
                  <input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full border-b border-light-beige py-3 text-sm focus:border-tan outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required className="w-full border-b border-light-beige py-3 text-sm focus:border-tan outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown">Governorate</label>
                  <input name="governorate" value={form.governorate} onChange={handleChange} required className="w-full border-b border-light-beige py-3 text-sm focus:border-tan outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown">City</label>
                  <input name="city" value={form.city} onChange={handleChange} required className="w-full border-b border-light-beige py-3 text-sm focus:border-tan outline-none transition-all" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown">Street & Building</label>
                  <input name="street" value={form.street} onChange={handleChange} required className="w-full border-b border-light-beige py-3 text-sm focus:border-tan outline-none transition-all" placeholder="Street name, Building number..." />
                </div>
              </div>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any specific delivery instructions or notes..." rows={3} className="w-full border border-light-beige p-4 text-sm focus:border-tan outline-none transition-all resize-none italic bg-cream/10" />
            </div>
          </div>

          {/* Right: Order Summary Sticky Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="border border-light-beige p-10 bg-cream/10 space-y-8">
              <h2 className="text-xl md:text-2xl font-serif text-dark-brown border-b border-light-beige pb-4 italic">Summary</h2>
              
              <div className="space-y-5 max-h-64 overflow-y-auto pr-4 no-scrollbar">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-4 text-[11px] font-bold tracking-wider uppercase text-medium-brown">
                    <span className="flex-1 leading-relaxed">
                      {item.product_variant?.product.name} ({item.product_variant?.size}) <span className="text-dark-brown/40">x{item.quantity}</span>
                    </span>
                    <span className="text-dark-brown shrink-0">${(item.product_variant?.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-light-beige space-y-4">
                <div className="flex justify-between text-[11px] font-bold tracking-widest text-medium-brown">
                  <span>Subtotal</span>
                  <span className="text-dark-brown">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold tracking-widest text-medium-brown">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? 'text-tan' : 'text-dark-brown'}>
                    {shippingFee === 0 ? 'COMPLIMENTARY' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-8">
                  <span className="text-xs font-bold uppercase tracking-[4px] text-dark-brown">Total Amount</span>
                  <span className="text-3xl font-bold text-dark-brown leading-none">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-dark-brown text-white py-5 mt-8 text-[10px] font-bold uppercase tracking-[4px] hover:bg-tan transition-all duration-500 shadow-sm active:scale-[0.98]"
              >
                {loading ? 'Processing Order...' : 'Place Secure Order'}
              </button>
              
              <p className="text-center text-[8px] font-bold uppercase tracking-[3px] text-medium-brown pt-2">
                Cash on delivery — Secure checkout
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
    </>
  );
}