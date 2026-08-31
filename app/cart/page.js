'use client';

import Link from 'next/link';
import { useCart } from '../../providers';
import { calculateShipping } from '../../lib/constants';


export default function CartPage() {
  const { cartItems, updateQuantity, removeItem, subtotal, itemCount } = useCart();

  const shippingFee = calculateShipping(subtotal);
  const total = subtotal + shippingFee;

  return (
    <>
    <main className="min-h-screen bg-white pb-32">
      {/* 1. Header Section */}
      <div className="bg-cream pt-32 pb-20 border-b border-light-beige text-center">
        <h1 className="text-5xl md:text-7xl font-serif text-dark-brown mb-6 tracking-tight italic">
          Shopping <span className="not-italic font-normal">Bag</span>
        </h1>
        <div className="flex justify-center items-center gap-4 text-[10px] uppercase tracking-[4px] font-bold text-medium-brown">
          <Link href="/" className="hover:text-tan transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <span className="text-dark-brown">Your Bag</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            <div className="mb-8 opacity-20">
              <svg className="w-20 h-20 text-dark-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-dark-brown mb-4 italic">Your bag is empty</h2>
            <Link href="/products" className="inline-block bg-dark-brown text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-tan transition-all duration-500">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
            
            {/* Left: Items List */}
            <div className="lg:col-span-8">
              <div className="hidden md:flex border-b border-light-beige pb-6 mb-8 text-[10px] font-bold tracking-[3px] uppercase text-medium-brown">
                <span className="w-1/2">Product Details</span>
                <span className="w-1/4 text-center">Price</span>
                <span className="w-1/4 text-center">Action</span>
              </div>

              <div className="space-y-12">
                {cartItems.map((item) => {
                  const product = item.product_variant?.product;
                  const variant = item.product_variant;
                  if (!product || !variant) return null;
                  const image = product.product_images?.find(i => i.is_primary) || product.product_images?.[0];

                  return (
                    <div key={item.id} className="flex flex-col md:flex-row items-center gap-8 md:gap-0 animate-fadeIn group">
                      
                      {/* 1. Product Info */}
                      <div className="flex items-center gap-6 w-full md:w-1/2">
                        <Link href={`/product/${product.id}`} className="w-24 md:w-28 aspect-[3/4] overflow-hidden bg-cream/30 shrink-0">
                          <img src={image?.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </Link>
                        <div className="space-y-1">
                          <Link href={`/product/${product.id}`} className="text-xs font-bold uppercase tracking-widest text-dark-brown hover:text-tan transition-colors block">
                            {product.name}
                          </Link>
                          <p className="text-[9px] font-bold tracking-[2px] text-medium-brown uppercase opacity-60">
                            {variant.size} <span className="mx-1">/</span> {variant.color}
                          </p>
                        </div>
                      </div>

                      {/* 2. Price */}
                      <div className="w-full md:w-1/4 text-center">
                        <span className="md:hidden text-[9px] font-bold tracking-widest text-medium-brown block mb-1 uppercase">Price</span>
                        <span className="font-bold text-base text-dark-brown">EGP {product.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>

                      {/* 3. Controls (Qty + Remove Icon) - تم دمجهم هنا */}
                      <div className="w-full md:w-1/4 flex flex-col items-center">
                        <span className="md:hidden text-[9px] font-bold tracking-widest text-medium-brown mb-3 uppercase">Manage</span>
                        <div className="flex items-center gap-3">
                          
                          {/* Counter Box */}
                          <div className="flex items-center border border-light-beige h-11 bg-white">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                              className="w-10 h-full text-xs hover:text-tan transition-colors opacity-60"
                            >
                              —
                            </button>
                            <span className="w-8 text-center font-bold text-[11px] text-dark-brown">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                              className="w-10 h-full text-xs hover:text-tan transition-colors opacity-60"
                            >
                              +
                            </button>
                          </div>

                          {/* Remove Icon Button - أصبح بجانب العداد مباشرة */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-11 h-11 flex items-center justify-center border border-light-beige text-dark-brown/30 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all group"
                            title="Remove Piece"
                          >
                            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Summary Card (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <div className="border border-light-beige p-10 bg-cream/10">
                <h2 className="text-xl font-serif text-dark-brown mb-8 border-b border-light-beige pb-4 italic">Order Summary</h2>
                <div className="space-y-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-medium-brown">
                    <span>Subtotal ({itemCount} pieces)</span>
                    <span className="text-dark-brown font-black text-sm">EGP {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-medium-brown">
                    <span>Shipping</span>
                    <span className="text-tan font-black uppercase">{shippingFee === 0 ? 'Complimentary' : `EGP ${shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</span>
                  </div>
                  
                  <div className="pt-8 mt-4 border-t border-light-beige flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-[3px] text-dark-brown leading-none">Estimated Total</span>
                    <span className="text-3xl font-bold text-dark-brown leading-none">EGP {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full bg-dark-brown text-white py-5 mt-6 text-[10px] font-bold uppercase tracking-[3px] text-center hover:bg-tan transition-all duration-500 shadow-sm active:scale-95"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
    </>
  );
}