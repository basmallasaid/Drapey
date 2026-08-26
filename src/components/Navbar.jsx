'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useCart, useFav } from '../../providers';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const { itemCount } = useCart();
  const { count } = useFav();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: 'Orders', path: '/orders', auth: true },
    { name: 'Admin', path: '/admin', admin: true },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 -ml-2 text-gray-600 hover:text-black"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/logo.jpeg"
              alt="Drapey"
              className="h-12 md:h-16 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              if (link.auth && !user) return null;
              if (link.admin && profile?.role !== 'admin') return null;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-xs font-bold tracking-widest uppercase transition-all duration-300 pb-1 border-b-2
                    ${isActive(link.path) ? 'text-black border-black' : 'text-gray-500 border-transparent hover:text-black'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <div className="hidden md:flex items-center space-x-3 border-l border-gray-200 pl-4 ml-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                {profile?.role === 'admin' && (
                  <Link href="/admin" className="text-[10px] font-bold tracking-widest uppercase text-teal-600 hover:text-teal-800 transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/profile" className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors">
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-[10px] font-bold tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="p-2 text-gray-500 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}

            <Link href="/favorites" className="p-2 text-gray-500 hover:text-black transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>

            <Link href="/cart" className="p-2 text-gray-500 hover:text-black transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fadeIn">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              if (link.auth && !user) return null;
              if (link.admin && profile?.role !== 'admin') return null;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-3 text-xs font-bold tracking-widest uppercase transition-colors
                    ${isActive(link.path) ? 'text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  {link.name}
                </Link>
              );
            })}
            {user && (
              <>
                {profile?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-xs font-bold tracking-widest uppercase text-teal-600 hover:text-teal-800"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-black"
                >
                  Profile
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block py-3 text-xs font-bold tracking-widest uppercase text-red-500"
                >
                  Logout
                </button>
              </>
            )}
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-black"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
