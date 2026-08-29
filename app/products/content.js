'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '../../src/components/ProductCard';
import FilterSidebar from '../../src/components/FilterSidebar';


export default function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedColor, setSelectedColor] = useState('all');

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      setCategories(cats || []);
      const { data: prods } = await supabase.from('products').select(`*, product_images(*), product_variants(*)`).eq('is_active', true).order('created_at', { ascending: false });
      setProducts(prods || []);
      if (prods?.length > 0) {
        const max = Math.ceil(Math.max(...prods.map(p => p.price || 0)));
        setPriceRange([0, max]);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const allColors = useMemo(() => {
    const colors = new Set();
    products.forEach(p => p.product_variants?.forEach(v => colors.add(v.color)));
    return [...colors].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'all') {
        const cat = categories.find(c => c.slug === selectedCategory);
        if (cat && p.category_id !== cat.id) return false;
      }
      if (p.price > priceRange[1]) return false;
      if (selectedColor !== 'all' && !p.product_variants?.some(v => v.color === selectedColor)) return false;
      return true;
    });
  }, [products, categories, selectedCategory, priceRange, selectedColor]);

  const getCount = (key) => {
    if (key === 'all') return products.length;
    const cat = categories.find(c => c.slug === key);
    return products.filter(p => p.category_id === cat?.id).length;
  };

  const sidebarProps = { categories, selectedCategory, setSelectedCategory, priceRange, setPriceRange, maxPrice: priceRange[1], colors: allColors, selectedColor, setSelectedColor, getCount };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="w-8 h-8 border-2 border-light-beige border-t-tan rounded-full animate-spin" /></div>;

  return (
    <>
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-cream pt-32 pb-20 border-b border-light-beige text-center">
        <h1 className="text-5xl md:text-7xl font-serif text-dark-brown mb-6 tracking-tight italic italic">Shop <span className="not-italic font-normal">All</span></h1>
        <div className="flex justify-center items-center gap-4 text-[10px] uppercase tracking-[4px] font-bold text-medium-brown">
          <Link href="/" className="hover:text-tan transition-colors">Home</Link>
          <span className="opacity-30">/</span><span className="text-dark-brown">The Store</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => setIsMobileFilterOpen(true)} className="md:hidden w-full border border-light-beige py-4 mb-8 text-[10px] font-bold uppercase tracking-[3px] flex items-center justify-center gap-2">Refine Results</button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <aside className="md:col-span-3 lg:col-span-2 hidden md:block sticky top-28 self-start"><FilterSidebar {...sidebarProps} /></aside>

          {/* Mobile Drawer */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-[200] md:hidden">
              <div className="absolute inset-0 bg-dark-brown/40 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)}></div>
              <div className="absolute left-0 top-0 bottom-0 w-[85%] bg-white p-8 overflow-y-auto animate-slideIn">
                <div className="flex justify-between items-center mb-10"><h2 className="font-serif text-2xl">Filters</h2><button onClick={() => setIsMobileFilterOpen(false)} className="p-2">✕</button></div>
                <FilterSidebar {...sidebarProps} />
                <button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-dark-brown text-white py-5 mt-10 text-[10px] font-bold uppercase tracking-widest">Show {filteredProducts.length} Results</button>
              </div>
            </div>
          )}

          <div className="md:col-span-9 lg:col-span-10">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}