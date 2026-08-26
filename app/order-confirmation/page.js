'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif mb-4">Order Confirmed!</h1>
        <p className="text-gray-500 text-sm max-w-md mb-2">
          Thank you for your order. We&apos;ll send you an email confirmation shortly.
        </p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-8">Order ID: #{orderId.slice(0, 8).toUpperCase()}</p>
        )}
        <div className="flex gap-4">
          <Link href="/orders" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
            View Orders
          </Link>
          <Link href="/products" className="border border-gray-200 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
