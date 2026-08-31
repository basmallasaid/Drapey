'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

 useEffect(() => {
  const desktopQuery = window.matchMedia('(min-width: 768px)');

  const handleViewportChange = () => {
    if (desktopQuery.matches) {
      setMobileOpen(false);
    }
  };

  desktopQuery.addEventListener('change', handleViewportChange);

  if (mobileOpen) {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  return () => {
    desktopQuery.removeEventListener('change', handleViewportChange);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  };
}, [mobileOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: 'Orders', path: '/orders', auth: true },
  ];

  return (
    <>
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        mobileOpen
          ? `bg-white border-b border-light-beige  ${scrolled ? 'py-1' : 'py-3'}`
          : scrolled || pathname !== '/'
            ? "bg-white/95 backdrop-blur-md border-b border-light-beige py-1"
            : "bg-transparent py-3"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 relative">
          
          {/* 1. LEFT: Logo & Mobile Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-dark-brown"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d={mobileOpen ? "M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            
            <Link href="/" className="transition-transform duration-500 hover:scale-105">
              <img
                src="/logo.jpeg"
                alt="Drapey"
                className={`${scrolled ? 'h-10 md:h-12' : 'h-12 md:h-16'} w-auto object-contain transition-all duration-500`}
              />
            </Link>
          </div>

          {/* 2. CENTER: Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-12 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              if (link.auth && !user) return null;
              const active = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-[11px] font-bold tracking-[3.5px] uppercase transition-all duration-300 relative group ${
                    active ? 'text-tan' : 'text-dark-brown hover:text-tan'
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 h-[1px] bg-tan transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              );
            })}
          </div>

          {/* 3. RIGHT: Actions (User, Fav, Cart) */}
<div className="flex items-center space-x-1 md:space-x-3">
  
  {/* User Dropdown with Name */}
  <div className="relative" ref={dropdownRef}>
    {user ? (
      <div className="flex items-center">
        <button 
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center space-x-2.5 p-2 group transition-all"
        >
          
          
          {/* أيقونة الشخص داخل دائرة */}
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
            userMenuOpen ? 'border-tan bg-cream text-tan' : 'border-light-beige text-dark-brown group-hover:border-tan group-hover:bg-cream'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </button>
        {/* اسم المستخدم - يظهر فقط في الشاشات الكبيرة للحفاظ على المساحة */}
          <span className="hidden sm:block text-[10px] font-bold tracking-[2px] uppercase text-dark-brown group-hover:text-tan transition-colors">
            {profile?.full_name?.split(' ')[0] || 'Account'}
          </span>

        {/* القائمة المنسدلة (Dropdown) */}
        {userMenuOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white border border-light-beige shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-sm py-3 animate-fadeIn top-full overflow-hidden">
            <div className="px-5 py-3 border-b border-light-beige mb-2 bg-cream/30">
              <p className="text-[9px] text-medium-brown uppercase tracking-[2px] mb-1">Welcome back</p>
              <p className="text-xs font-bold text-dark-brown truncate">{profile?.full_name || user.email}</p>
            </div>
            
            <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-dark-brown hover:bg-cream hover:text-tan transition-colors">
              Account Details
            </Link>
            
            <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-dark-brown hover:bg-cream hover:text-tan transition-colors">
              My Orders
            </Link>
            
            {profile?.role === 'admin' && (
              <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-brown hover:bg-cream transition-colors">
                Admin Panel
              </Link>
            )}
            
            <button 
              onClick={() => { logout(); setUserMenuOpen(false); }}
              className="w-full text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors border-t border-light-beige mt-2"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    ) : (
      <button onClick={() => router.push('/login')} className="flex items-center space-x-2 p-2 group">
         <span className="hidden sm:block text-[10px] font-bold tracking-[2px] uppercase text-dark-brown group-hover:text-tan transition-colors">
            Login
         </span>
         <div className="w-8 h-8 rounded-full border border-light-beige flex items-center justify-center text-dark-brown group-hover:border-tan group-hover:bg-cream transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
         </div>
      </button>
    )}
  </div>

            {/* Favorites */}
            <Link href="/favorites" className="p-2 text-dark-brown hover:text-tan transition-colors relative group">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute top-1.5 right-1 bg-tan text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {count}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="p-2 text-dark-brown hover:text-tan transition-colors relative group">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-1.5 right-1 bg-dark-brown text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {/* {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[90] bg-white overflow-y-auto animate-fadeIn px-8 pt-24 pb-12">
          <div className="flex flex-col space-y-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.path} onClick={() => setMobileOpen(false)} className="text-lg font-serif text-dark-brown border-b border-light-beige pb-4 uppercase tracking-[4px]">
                {link.name}
              </Link>
            ))}
            {!user && (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-lg font-serif text-tan uppercase tracking-[4px]">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )} */}
      {/* Mobile Menu Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[40] bg-dark-brown/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <aside
          className="md:hidden fixed top-0 left-0 z-[90] w-[80vw] max-w-[360px] h-[100dvh] bg-white overflow-y-auto overscroll-contain animate-fadeIn px-8 pt-24 pb-12 shadow-[0_0_60px_rgba(0,0,0,0.3)]"
        >
          <div className="flex flex-col space-y-8">
            {navLinks.map((link) => {
              if (link.auth && !user) return null;

              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-serif text-dark-brown border-b border-light-beige pb-4 uppercase tracking-[4px]"
                >
                  {link.name}
                </Link>
              );
            })}

            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-lg font-serif text-tan uppercase tracking-[4px]"
              >
                Login / Register
              </Link>
            )}
          </div>
        </aside>
      )}
    </nav>
    </>
  );
};

export default Navbar;