'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '../../src/components/ProductCard';
import FilterSidebar from '../../src/components/FilterSidebar';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';

export default function ProductsPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      setCategories(cats || []);

      const { data: prods } = await supabase
        .from('products')
        .select(`
          *,
          product_images(id, image_url, is_primary, sort_order),
          product_variants(id, size, color, sku, stock_quantity)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts(prods || []);

      if (prods && prods.length > 0) {
        const maxPrice = Math.ceil(Math.max(...prods.map(p => p.price || 0)));
        setPriceRange([0, maxPrice > 0 ? maxPrice : 200]);
      }

      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const allSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach(p => p.product_variants?.forEach(v => sizes.add(v.size)));
    return [...sizes].sort();
  }, [products]);

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
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (selectedSize !== 'all') {
        if (!p.product_variants?.some(v => v.size === selectedSize)) return false;
      }
      if (selectedColor !== 'all') {
        if (!p.product_variants?.some(v => v.color === selectedColor)) return false;
      }
      return true;
    });
  }, [products, categories, selectedCategory, priceRange, selectedSize, selectedColor]);

  const getCount = (key) => {
    if (key === 'all') return products.length;
    return products.filter(p => {
      const cat = categories.find(c => c.slug === key);
      return cat && p.category_id === cat.id;
    }).length;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#f6f5f3] py-16 text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-serif font-medium mb-4">Shop</h1>
        <div className="flex justify-center items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <span className="text-black">Shop</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-3">
            <FilterSidebar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              maxPrice={priceRange[1]}
              sizes={allSizes}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              colors={allColors}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              getCount={getCount}
            />
          </div>

          {/* Products grid */}
          <div className="md:col-span-9">
            <p className="text-sm text-gray-400 mb-6 font-medium tracking-wide">
              Showing {filteredProducts.length} products
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-gray-400 text-lg">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
