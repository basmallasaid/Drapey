'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

const FooterWrapper = () => {
  const [categories, setCategories] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('name, slug')
        .order('name');
      setCategories(data || []);
    };
    fetchCategories();
  }, [supabase]);

  return (
    <footer className="bg-white pt-16 pb-8 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <span className="text-2xl font-serif font-bold tracking-widest uppercase block mb-4">Drapey</span>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Clean silhouettes and calm tones. Essential clothing for everyday wear.
            </p>
            <p className="text-gray-500 text-sm">hello@drapey.com</p>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-gray-500 text-sm hover:text-black transition-colors">Shop</Link></li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/products?category=${cat.slug}`} className="text-gray-500 text-sm hover:text-black transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4">Account</h3>
            <ul className="space-y-3">
              <li><Link href="/profile" className="text-gray-500 text-sm hover:text-black transition-colors">Profile</Link></li>
              <li><Link href="/orders" className="text-gray-500 text-sm hover:text-black transition-colors">Orders</Link></li>
              <li><Link href="/favorites" className="text-gray-500 text-sm hover:text-black transition-colors">Favorites</Link></li>
              <li><Link href="/cart" className="text-gray-500 text-sm hover:text-black transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>Email: hello@drapey.com</li>
              <li>Cairo, Egypt</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs">&copy; {new Date().getFullYear()} Drapey. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-gray-400 text-xs">Terms</span>
            <span className="text-gray-400 text-xs">Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterWrapper;
