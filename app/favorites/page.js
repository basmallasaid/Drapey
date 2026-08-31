'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFav } from '../../providers';
import ProductCard from '../../src/components/ProductCard';
import Link from 'next/link';


export default function FavoritesPage() {
  const { user, profile } = useAuth();
  const { favorites, loading } = useFav();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
    if (isAdmin) {
      router.replace('/admin');
    }
  }, [user, loading, router, isAdmin]);

  if (loading || !user || isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-light-beige border-t-tan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <main className="min-h-screen bg-white pb-32">
      {/* 1. Header Section - يطابق ستايل المتجر */}
      <div className="bg-cream pt-32 pb-20 border-b border-light-beige text-center">
        <h1 className="text-5xl md:text-7xl font-serif text-dark-brown mb-6 tracking-tight italic">
          Your <span className="not-italic font-normal">Wishlist</span>
        </h1>
        <div className="flex justify-center items-center gap-4 text-[10px] uppercase tracking-[4px] font-bold text-medium-brown">
          <Link href="/" className="hover:text-tan transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <span className="text-dark-brown">Favorites</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 min-h-[50vh]">
        {favorites.length === 0 ? (
          /* 2. Empty State - شكل أرقى وأبسط */
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            <div className="mb-8 opacity-20">
              <svg className="w-20 h-20 text-dark-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-dark-brown mb-4 italic">Your collection is empty</h2>
            <p className="text-xs uppercase tracking-[3px] text-medium-brown mb-10 max-w-xs leading-loose">
              Save the pieces you love to keep them close and find them later.
            </p>
            <Link 
              href="/products" 
              className="inline-block bg-dark-brown text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-tan transition-all duration-500 active:scale-95"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          /* 3. Favorites Grid - مسافات أوسع وتنسيق منظم */
          <div>
            <div className="flex justify-between items-center mb-12 border-b border-light-beige pb-6">
               <p className="text-[11px] font-bold tracking-[3px] uppercase text-medium-brown">
                Saved Pieces <span className="text-dark-brown ml-1">({favorites.length})</span>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
              {favorites.map((fav) => {
                if (!fav.product) return null;
                return (
                  <div key={fav.id} className="animate-fadeIn">
                    <ProductCard product={fav.product} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}