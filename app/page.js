import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';


export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let categories = [];
  let featuredProducts = [];

  try {
    const supabase = await createClient();
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    categories = cats || [];

    const { data: prods } = await supabase
      .from('products')
      .select(`
        *,
        product_images(id, image_url, is_primary, sort_order),
        product_variants(id, size, color, stock_quantity)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);
    featuredProducts = prods || [];
  } catch (e) {
    console.error('Failed to fetch data:', e);
  }

  return (
    <>
      <main>
      
{/* Hero Section */}
<section
  className="relative bg-cover bg-right min-h-[90vh] md:min-h-[100vh] flex items-center"
  style={{ backgroundImage: "url('/slider03.jpg')" }}
>
 
  <div className="absolute inset-0 bg-black/5 md:bg-transparent"></div>

  <div className="relative max-w-7xl mx-auto w-full px-4 md:px-8 text-center text-dark-brown mt-3">
    
    {/* عنوان فرعي صغير فوق العنوان الرئيسي */}
    <span className="text-[10px] md:text-xs font-bold tracking-[6px] uppercase block mb-8 opacity-80 font-sans">
      The New Minimalist
    </span>

    <h1 className="text-5xl md:text-8xl font-serif italic tracking-tight leading-tight">
  Clean Lines, <br />
  <span className="not-italic font-normal">Calm Tones</span>
</h1>

    <p className="text-sm md:text-base max-w-md mx-auto mb-12 leading-relaxed font-sans opacity-90 tracking-wide">
      Essential clothing designed for everyday comfort. <br className="hidden md:block"/> 
      Minimal, timeless, made to last.
    </p>

    <Link
      href="/products"
      className="inline-block bg-dark-brown text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-tan transition-all duration-300 hover:scale-105"
    >
      Explore Collection
    </Link>
  </div>
</section>

        
        {/* Categories Section */}
{categories.length > 0 && (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <h2 className="text-3xl md:text-4xl font-serif text-center mb-16 tracking-tight">
        Shop by Category
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group flex flex-col items-center"
          >
            {/* Image Container with Aspect Ratio 3:4 */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-light-beige rounded-sm mb-5 transition-all duration-500 group-hover:shadow-xl">
              {cat.image_url ? (
                <img 
                  src={cat.image_url} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cream border border-light-beige">
                  <span className="text-4xl font-serif text-tan opacity-40">{cat.name[0]}</span>
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-dark-brown/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Category Name */}
            <span className="text-xs md:text-sm font-bold tracking-[3px] uppercase text-dark-brown group-hover:text-tan transition-colors duration-300">
              {cat.name}
            </span>
            
            {/* Subtle line under the name that appears on hover */}
            <div className="h-[1px] w-0 bg-tan transition-all duration-300 group-hover:w-1/2 mt-1"></div>
          </Link>
        ))}
      </div>
    </div>
  </section>
)}

        {/* Featured Products Section */}
{featuredProducts.length > 0 && (
  <section className="py-24 bg-[#F9F6F3]"> {/* خلفية كريمية ناعمة جداً */}
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      
      {/* عنوان القسم */}
      <div className="flex flex-col items-center mb-16">
        <h2 className="text-3xl md:text-5xl font-serif text-dark-brown mb-4">
          Featured
        </h2>
        <div className="w-12 h-[2px] bg-tan"></div> {/* خط زخرفي صغير */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {featuredProducts.map((product) => {
          const primaryImg = product.product_images?.find(i => i.is_primary) || product.product_images?.[0];
          const colors = [...new Set(product.product_variants?.map(v => v.color) || [])];
          
          return (
            <Link key={product.id} href={`/product/${product.id}`} className="group block">
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-white mb-5 transition-all duration-500 group-hover:shadow-lg rounded-sm">
                {primaryImg ? (
                  <img
                    src={primaryImg.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-medium-brown text-xs bg-light-beige font-sans">
                    NO IMAGE
                  </div>
                )}
                
                {/* Quick View or Badge (Optional) */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm py-3 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[10px] font-bold tracking-[2px] uppercase text-dark-brown">
                    Quick View
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="text-xs md:text-sm font-medium text-dark-brown/80 group-hover:text-tan transition-colors uppercase tracking-wide">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-dark-brown">
                    ${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  
                  {/* Color Swatches - Made smaller and cleaner */}
                  {colors.length > 0 && (
                    <div className="flex gap-1.5">
                      {colors.slice(0, 3).map((c) => (
                        <span 
                          key={c} 
                          className="w-2.5 h-2.5 rounded-full border border-black/5 ring-1 ring-offset-1 ring-transparent group-hover:ring-light-beige transition-all" 
                          style={{ backgroundColor: c }} 
                        />
                      ))}
                      {colors.length > 3 && (
                        <span className="text-[10px] text-medium-brown">+{colors.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View All Button */}
      <div className="text-center mt-20">
        <Link
          href="/products"
          className="inline-block border border-dark-brown text-dark-brown px-12 py-4 text-[10px] font-bold uppercase tracking-[3px] hover:bg-dark-brown hover:text-white transition-all duration-300"
        >
          View All Collections
        </Link>
      </div>
    </div>
  </section>
)}
        {/* Info strip */}
        {/* Info Strip - Trust Builders */}
<section className="py-20 border-y border-light-beige bg-white">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
      
      {/* Shipping */}
      <div className="flex flex-col items-center text-center group">
        <div className="mb-6 text-tan transition-transform duration-500 group-hover:scale-110">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <h4 className="text-[11px] font-bold tracking-[4px] uppercase text-dark-brown mb-3">
          Complimentary Shipping
        </h4>
        <p className="text-xs text-medium-brown font-sans leading-relaxed max-w-[200px] opacity-80">
          Enjoy free standard delivery on all orders exceeding $100.
        </p>
      </div>

      {/* Returns */}
      <div className="flex flex-col items-center text-center group">
        <div className="mb-6 text-tan transition-transform duration-500 group-hover:rotate-12">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h4 className="text-[11px] font-bold tracking-[4px] uppercase text-dark-brown mb-3">
          Seamless Returns
        </h4>
        <p className="text-xs text-medium-brown font-sans leading-relaxed max-w-[200px] opacity-80">
          We offer a simplified return process within 14 days of purchase.
        </p>
      </div>

      {/* Checkout */}
      <div className="flex flex-col items-center text-center group">
        <div className="mb-6 text-tan transition-transform duration-500 group-hover:scale-110">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h4 className="text-[11px] font-bold tracking-[4px] uppercase text-dark-brown mb-3">
          Secure Payment
        </h4>
        <p className="text-xs text-medium-brown font-sans leading-relaxed max-w-[200px] opacity-80">
          Your security is our priority. Shop with peace of mind.
        </p>
      </div>

    </div>
  </div>
</section>
      </main>
    </>
  );
}
