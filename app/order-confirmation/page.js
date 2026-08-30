'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';


export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <>
    <main className="min-h-[100vh] flex flex-col items-center justify-center bg-white px-6">
      
      <div className="relative mb-10 group">
        <div className="w-24 h-24 rounded-full border border-tan/20 flex items-center justify-center animate-fadeIn">
          <svg className="w-8 h-8 text-tan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {/* لمسة جمالية: نقطة بيج تظهر خلف الأيقونة */}
        <div className="absolute -z-10 inset-0 bg-cream rounded-full scale-0 group-hover:scale-110 transition-transform duration-700 blur-xl opacity-50"></div>
      </div>

      {/* 2. Text Content */}
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl md:text-6xl font-serif text-dark-brown tracking-tight italic">
          Order <span className="not-italic font-normal">Confirmed</span>
        </h1>
        
        <p className="text-[11px] font-bold uppercase tracking-[4px] text-medium-brown leading-loose">
          Thank you for choosing Drapey. <br/> 
          Your pieces are now being prepared with care.
        </p>

        {orderId && (
          <div className="pt-4 border-t border-light-beige w-fit mx-auto">
            <p className="text-[10px] font-bold tracking-[2px] text-dark-brown/40 uppercase">
              Reference ID: <span className="text-tan ml-1">#{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
          </div>
        )}
      </div>

      {/* 3. Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-16 w-full max-w-sm sm:max-w-none justify-center">
        <Link 
          href="/orders" 
          className="bg-dark-brown text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-tan transition-all duration-500 text-center shadow-sm"
        >
          Track Order
        </Link>
        <Link 
          href="/products" 
          className="border border-light-beige text-dark-brown px-12 py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-cream transition-all duration-500 text-center"
        >
          Continue Shopping
        </Link>
      </div>

      {/* 4. Extra Note */}
      <p className="mt-12 text-[9px] text-medium-brown uppercase tracking-widest opacity-50">
        A confirmation email will reach you shortly
      </p>

    </main>
    </>
  );
}