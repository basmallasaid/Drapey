import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';

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
      <Navbar />
      <main>
        {/* Hero */}
<section
  className="bg-cover bg-center min-h-[90vh] md:min-h-[100vh] flex items-center"
  style={{ backgroundImage: "url('/slider01.jpg')" }}
>
  <div className="max-w-7xl mx-auto w-full px-4 md:px-8 text-center text-white">
    <span className="text-xs md:text-sm font-bold tracking-[4px] uppercase block mb-6">
      New Collection
    </span>

    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium mb-6">
      Clean Lines,<br />Calm Tones
    </h1>

    <p className="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
      Essential clothing designed for everyday comfort. Minimal, timeless, made to last.
    </p>

    <Link
      href="/products"
      className="inline-block bg-black text-white px-10 py-4 text-sm font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors"
    >
      Shop Now
    </Link>
  </div>
</section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Shop by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="group text-center"
                  >
                    <div className="aspect-square bg-gray-100 rounded-sm mb-4 overflow-hidden flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-serif text-gray-300">{cat.name[0]}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase text-gray-600 group-hover:text-black transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-16 md:py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Featured</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => {
                  const primaryImg = product.product_images?.find(i => i.is_primary) || product.product_images?.[0];
                  const colors = [...new Set(product.product_variants?.map(v => v.color) || [])];
                  return (
                    <Link key={product.id} href={`/product/${product.id}`} className="group">
                      <div className="aspect-[3/4] bg-white rounded-sm overflow-hidden mb-3">
                        {primaryImg ? (
                          <img
                            src={primaryImg.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm font-bold text-gray-800 mt-1">${product.price?.toFixed(2)}</p>
                      {colors.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {colors.slice(0, 4).map((c) => (
                            <span key={c} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              <div className="text-center mt-12">
                <Link
                  href="/products"
                  className="inline-block bg-black text-white px-10 py-4 text-xs font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors"
                >
                  View All
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Info strip */}
        <section className="py-12 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-gray-400 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Free Shipping on orders over $100</p>
            </div>
            <div>
              <div className="text-gray-400 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Easy Returns within 14 days</p>
            </div>
            <div>
              <div className="text-gray-400 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Secure Checkout</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
