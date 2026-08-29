import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';

const Footer = async () => {
  let categories = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('categories')
      .select('name, slug')
      .order('name');
    categories = data || [];
  } catch {
    // Silently fail
  }

  return (
    <footer className="bg-white pt-24 pb-12 border-t border-light-beige">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Section 1: Brand Identity */}
          <div className="space-y-6">
            <Link href="/" className="text-3xl font-serif tracking-tighter text-dark-brown">
              DRAPEY
            </Link>
            <p className="text-medium-brown text-[13px] leading-relaxed max-w-[240px] font-sans opacity-80">
              Elevating everyday essentials through clean silhouettes and calm tones. 
              Designed for the modern minimalist.
            </p>
            <div className="flex gap-4 pt-2">
              {/* Social Icons Placeholders */}
              <a href="#" className="text-dark-brown hover:text-tan transition-colors">
                <span className="text-[10px] font-bold tracking-widest uppercase">Instagram</span>
              </a>
              <a href="#" className="text-dark-brown hover:text-tan transition-colors">
                <span className="text-[10px] font-bold tracking-widest uppercase">TikTok</span>
              </a>
            </div>
          </div>

          {/* Section 2: Shop & Categories */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[3px] uppercase mb-8 text-dark-brown">Collections</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/products" className="text-sm text-medium-brown hover:text-tan transition-all duration-300 flex items-center group">
                  <span className="w-0 group-hover:w-3 h-[1px] bg-tan mr-0 group-hover:mr-2 transition-all"></span>
                  Shop All
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/products?category=${cat.slug}`} className="text-sm text-medium-brown hover:text-tan transition-all duration-300 flex items-center group">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-tan mr-0 group-hover:mr-2 transition-all"></span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Customer Care */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[3px] uppercase mb-8 text-dark-brown">Account</h3>
            <ul className="space-y-4">
              {['Profile', 'Orders', 'Favorites', 'Cart'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase()}`} className="text-sm text-medium-brown hover:text-tan transition-all duration-300 flex items-center group">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-tan mr-0 group-hover:mr-2 transition-all"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4: Newsletter / Contact */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[3px] uppercase mb-8 text-dark-brown">Contact Us</h3>
            <div className="space-y-4">
              <p className="text-sm text-medium-brown font-sans">
                Questions? Email us at:<br />
                <a href="mailto:hello@drapey.com" className="text-dark-brown font-medium hover:text-tan transition-colors">
                  hello@drapey.com
                </a>
              </p>
              <p className="text-sm text-medium-brown font-sans">
                Based in:<br />
                <span className="text-dark-brown font-medium">Cairo, Egypt</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-light-beige pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-medium-brown text-[10px] font-bold tracking-widest uppercase">
            &copy; {new Date().getFullYear()} DRAPEY. All rights reserved.
          </p>
          
          <div className="flex gap-8">
            <Link href="/terms" className="text-medium-brown text-[10px] font-bold tracking-widest uppercase hover:text-tan transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-medium-brown text-[10px] font-bold tracking-widest uppercase hover:text-tan transition-colors">
              Privacy
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;