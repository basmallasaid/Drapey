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
    <footer className="bg-white pt-16 md:pt-24 pb-10 md:pb-12 border-t border-light-beige">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-10 md:gap-y-12 lg:gap-8 mb-16 md:mb-20">

          {/* Section 1: Brand Identity */}
          <div className="space-y-6 col-span-2 md:col-span-1">
            <Link href="/" className="text-3xl font-serif tracking-tighter text-dark-brown">
              DRAPEY
            </Link>
            <p className="text-medium-brown text-[13px] leading-snug md:leading-relaxed max-w-[280px] md:max-w-[240px] font-sans opacity-80">
              Elevating everyday essentials through clean silhouettes and calm tones.
              Designed for the modern minimalist.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-3 md:gap-6 pt-2">
              {/* Social Icons Placeholders */}
              {/* <a href="#" className="text-dark-brown hover:text-tan transition-colors">
                <span className="text-[10px] font-bold tracking-widest uppercase">Instagram</span>
              </a>
              <a href="#" className="text-dark-brown hover:text-tan transition-colors">
                <span className="text-[10px] font-bold tracking-widest uppercase">TikTok</span>
              </a> */}
              <a
                href="https://www.instagram.com/drapey.official?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-brown hover:text-tan transition-colors"
              >
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Instagram
                </span>
              </a>

              <a
                href="https://l.instagram.com/?u=https%3A%2F%2Fwww.tiktok.com%2F%40drapey1%3F_r%3D1%26_t%3DZS-97njx4aEUCH%26fbclid%3DPAcGRvZgJleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA85MzY2MTk3NDMzOTI0NTkAAafzEsIEbJEpyF2-HQF22NvKJk-RiR9RDJlc8wdezHxFqLxLctIzmIEVcEWxXA_aem_pbx8cp1H8b7WGVvop56sIw&e=AUDrTFZMptocyn9agTr2T-u2riBFkwli3SysLP0K57N1O85SAWUv3hVZDsR-PLFt4I99jAA2NdgNMdiKeiJXUIl6ugcyobz0YErbWc-flXM6AYUsY6ptTuwwSiPqqiOasSl-Zkc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-brown hover:text-tan transition-colors"
              >
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  TikTok
                </span>
              </a>

              <a
                href="https://www.facebook.com/1001414333047157?ref=PROFILE_EDIT_xav_ig_profile_page_web"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-brown hover:text-tan transition-colors"
              >
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Facebook
                </span>
              </a>

              <a
                href="https://wa.me/YOUR_PHONE_NUMBER"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-brown hover:text-tan transition-colors"
              >
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  WhatsApp
                </span>
              </a>
            </div>
          </div>

          {/* Section 2: Shop & Categories */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[3px] uppercase mb-6 md:mb-8 text-dark-brown">Collections</h3>
            <ul className="space-y-3 md:space-y-4">
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
            <h3 className="text-[11px] font-bold tracking-[3px] uppercase mb-6 md:mb-8 text-dark-brown">Account</h3>
            <ul className="space-y-3 md:space-y-4">
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
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-[11px] font-bold tracking-[3px] uppercase mb-6 md:mb-8 text-dark-brown">Contact Us</h3>
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
        <div className="border-t border-light-beige pt-8 md:pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
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