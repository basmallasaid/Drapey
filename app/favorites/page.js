'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFav } from '../../providers';
import ProductCard from '../../src/components/ProductCard';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';
import Link from 'next/link';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading } = useFav();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
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
      <div className="pt-20">
      <div className="bg-[#f6f5f3] py-16 mb-10 border-b border-gray-100">
        <h1 className="text-3xl md:text-5xl font-serif font-medium text-center mb-4">Wishlist</h1>
        <div className="flex justify-center items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <span className="text-black">Wishlist</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 min-h-[60vh]">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-8">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif mb-4">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Save your favorite items here for easy access later.
            </p>
            <Link href="/products" className="bg-[#222] hover:bg-black text-white px-10 py-4 text-sm font-semibold tracking-widest uppercase transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400 mb-6 font-medium tracking-wide">
              Showing {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
      </div>
      <Footer />
    </>
  );
}
