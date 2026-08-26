'use client';

import Link from 'next/link';
import { useCart } from '../../providers';
import { calculateShipping } from '../../lib/constants';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';

export default function CartPage() {
  const { cartItems, updateQuantity, removeItem, subtotal, itemCount } = useCart();

  const shippingFee = calculateShipping(subtotal);
  const total = subtotal + shippingFee;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white pb-24">
        <div className="bg-[#f6f5f3] py-16 text-center mb-12 border-b border-[#eee]">
          <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-wide mb-4">Cart</h1>
          <div className="flex justify-center items-center gap-2 text-xs uppercase tracking-widest font-semibold text-gray-400">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <span className="text-black">Cart</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-[#f6f5f3] rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif mb-6">Your cart is empty</h2>
              <Link href="/products" className="bg-[#222] hover:bg-black text-white px-10 py-4 text-sm font-semibold tracking-widest uppercase transition-colors duration-300">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              {/* Cart items */}
              <div className="lg:col-span-8">
                <div className="hidden md:flex justify-between border-b border-[#eee] pb-4 mb-6 text-[11px] font-bold tracking-widest text-gray-400">
                  <span className="w-3/5">PRODUCT</span>
                  <span className="w-1/5 text-center">PRICE</span>
                  <span className="w-1/6 text-center">QTY</span>
                  <span className="w-1/12"></span>
                </div>

                {cartItems.map((item) => {
                  const product = item.product_variant?.product;
                  const variant = item.product_variant;
                  if (!product || !variant) return null;

                  const image = product.product_images?.find(i => i.is_primary) || product.product_images?.[0];

                  return (
                    <div key={item.id} className="flex items-center justify-between border-b border-gray-100 py-6 last:border-0">
                      <div className="flex items-center gap-6 w-3/5">
                        <Link href={`/product/${product.id}`} className="w-24 h-24 flex items-center justify-center overflow-hidden shrink-0 bg-gray-50">
                          {image ? (
                            <img src={image.image_url} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <span className="text-gray-300 text-xs">No img</span>
                          )}
                        </Link>
                        <div>
                          <Link href={`/product/${product.id}`} className="hover:text-gray-600 transition-colors">
                            <h3 className="text-base font-semibold mb-1">{product.name}</h3>
                          </Link>
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            {variant.size} / {variant.color}
                          </p>
                        </div>
                      </div>

                      <div className="w-1/5 text-center font-bold text-base">
                        ${product.price?.toFixed(2)}
                      </div>

                      <div className="w-1/6 flex justify-center">
                        <div className="flex items-center border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 text-gray-500 hover:text-black text-sm"
                          >
                            -
                          </button>
                          <span className="px-3 py-2 text-sm font-bold border-x border-gray-200">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 text-gray-500 hover:text-black text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-600 p-2 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <div className="border border-gray-100 p-8 bg-white shadow-sm">
                  <h2 className="text-xl md:text-2xl font-serif mb-6 pb-2 border-b border-[#f6f5f3]">Order Summary</h2>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                      <span className="font-bold text-base">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Shipping</span>
                      {shippingFee === 0 ? (
                        <span className="font-semibold text-green-600 text-xs">FREE</span>
                      ) : (
                        <span className="font-bold">${shippingFee.toFixed(2)}</span>
                      )}
                    </div>
                    <hr className="border-[#f6f5f3] my-4" />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                    </div>
                    <Link
                      href="/checkout"
                      className="block w-full bg-black text-white py-4 mt-4 text-xs font-bold uppercase tracking-[2px] text-center hover:bg-gray-800 transition-colors"
                    >
                      Checkout
                    </Link>
                    <p className="text-center pt-4 text-[10px] text-gray-400 uppercase tracking-widest">
                      Secure Checkout Guaranteed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
