'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';
import { useCart, useFav } from '../../../providers';


export default function ProductPageContent() {
  const params = useParams();
  const id = params.id;
  const supabase = createClient();

  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFav();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          product_images(id, image_url, is_primary, sort_order),
          product_variants(id, size, color, sku, stock_quantity)
        `)
        .eq('id', id)
        .single();

      if (data) {
        setProduct(data);
        const variants = data.product_variants || [];
        if (variants.length > 0) {
          setSelectedSize(variants[0].size);
          setSelectedColor(variants[0].color);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id, supabase]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="w-8 h-8 border-2 border-light-beige border-t-tan rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center px-4 pt-32">
        <h2 className="text-2xl font-serif text-dark-brown">Product not found</h2>
        <Link href="/products" className="text-[10px] font-bold uppercase tracking-[3px] border-b border-dark-brown pb-1">Back to Collections</Link>
      </main>
    </>
  );

  const images = product.product_images?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const variants = product.product_variants || [];
  const uniqueSizes = [...new Set(variants.map(v => v.size))];
  const uniqueColors = [...new Set(variants.map(v => v.color))];
  const selectedVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
  const stock = selectedVariant?.stock_quantity || 0;
  const inStock = stock > 0;
  const fav = isFavorite(product.id);

  return (
    <>
      {/* الـ pt-20 لضمان عدم اختفاء المحتوى تحت الـ Navbar الثابت */}
      <main className="min-h-screen bg-white pb-32 pt-[70px] md:pt-[80px]">
        
        {/* 1. Breadcrumb - تم تعديل المسافات والوضوح */}
        <nav className="bg-cream/40 py-5 border-b border-light-beige">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-medium-brown">
            <Link href="/" className="hover:text-tan transition-colors">Home</Link>
            <span className="opacity-30">/</span>
            <Link href="/products" className="hover:text-tan transition-colors">Shop</Link>
            <span className="opacity-30">/</span>
            <Link href={`/products?category=${product.category?.slug}`} className="hover:text-tan transition-colors whitespace-nowrap">
              {product.category?.name}
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-dark-brown truncate max-w-[120px] md:max-w-none">{product.name}</span>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            
            {/* 2. Left Side: Images */}
            <div className="lg:w-[45%] xl:w-[42%] flex flex-col-reverse lg:flex-row gap-4">
              {images.length > 1 && (
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible no-scrollbar py-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`w-14 lg:w-16 aspect-[3/4] overflow-hidden border-2 transition-all duration-300 ${activeImage === i ? 'border-tan scale-105' : 'border-transparent opacity-50'}`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex-1 aspect-[3/4] overflow-hidden bg-cream/20 flex items-center justify-center p-4">
                <img 
                  src={images[activeImage]?.image_url} 
                  className="max-w-full max-h-full object-contain transition-transform duration-1000 hover:scale-105" 
                  alt={product.name} 
                />
              </div>
            </div>

            {/* 3. Right Side: Product Details */}
            <div className="lg:w-[55%] lg:sticky lg:top-32 self-start space-y-8">
              
              <div className="space-y-3 border-b border-light-beige pb-8">
                <span className="text-[9px] font-bold tracking-[4px] uppercase text-tan block">{product.category?.name}</span>
                <h1 className="text-2xl md:text-3xl font-serif text-dark-brown leading-tight italic tracking-tight uppercase">
                  {product.name}
                </h1>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-2xl font-bold text-dark-brown">${product.price?.toFixed(2)}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border rounded-sm ${inStock ? 'text-tan border-tan/20 bg-cream' : 'text-red-500 border-red-50'}`}>
                    {inStock ? `${stock} in Stock` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Selection Options */}
              <div className="space-y-6">
                {uniqueColors.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-[3px] text-medium-brown">Color Palette</h3>
                    <div className="flex gap-3">
                      {uniqueColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-7 h-7 rounded-full border transition-all ring-offset-2 ${selectedColor === color ? 'ring-2 ring-tan scale-110' : 'border-light-beige hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {uniqueSizes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-[3px] text-medium-brown">Select Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[60px] py-2.5 text-[9px] font-bold uppercase tracking-widest border transition-all ${selectedSize === size ? 'bg-dark-brown text-white border-dark-brown' : 'border-light-beige text-dark-brown hover:border-tan'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

             
              {/* 4. Action Section */}
<div className="flex flex-col gap-6 pt-6">
  
  {/* Quantity Selector - سطر منفصل */}
  {inStock && (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[3px] text-medium-brown">
        Quantity
      </h3>
      <div className="flex items-center border border-light-beige w-32 justify-between h-[52px] bg-white">
        <button 
          onClick={() => setQuantity(Math.max(1, quantity - 1))} 
          className="flex-1 h-full text-sm hover:text-tan transition-colors opacity-60"
        >
          —
        </button>
        <span className="text-center font-bold text-[12px] text-dark-brown">{quantity}</span>
        <button 
          onClick={() => setQuantity(Math.min(stock, quantity + 1))} 
          className="flex-1 h-full text-sm hover:text-tan transition-colors opacity-60"
        >
          +
        </button>
      </div>
    </div>
  )}

  {/* Row for Add to Bag and Favorite */}
  <div className="flex flex-row gap-3 h-[56px]">
    
    {/* Add to Bag Button - الزر الرئيسي العريض */}
    <button
      onClick={() => addItem(selectedVariant?.id, quantity)}
      disabled={!inStock || adding}
      className="flex-1 bg-dark-brown text-white h-full text-[10px] font-bold uppercase tracking-[4px] transition-all duration-500 hover:bg-[#3d3431] disabled:opacity-30 active:scale-[0.98] shadow-sm flex items-center justify-center gap-3"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {adding ? 'Securing Item...' : inStock ? 'Add to Bag' : 'Out of Stock'}
    </button>

    {/* Favorite Button - أيقونة رشيقة بجانبه */}
    <button
      onClick={() => toggleFavorite(product.id)}
      className={`w-[56px] h-full flex items-center justify-center border border-light-beige transition-all duration-300 hover:bg-cream/30 ${fav ? 'text-tan border-tan/40 bg-cream/20' : 'text-dark-brown/40 hover:text-tan'}`}
    >
      <svg 
        className="w-[20px] h-[20px] transition-transform duration-300 active:scale-125" 
        fill={fav ? "currentColor" : "none"} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
    </button>
  </div>
</div>

              {/* Description */}
              <div className="pt-10 space-y-6 border-t border-light-beige">
                <div className="space-y-3">
                  <h3 className="text-[9px] font-bold uppercase tracking-[4px] text-dark-brown">The Design Details</h3>
                  <p className="text-[13px] text-medium-brown leading-relaxed font-sans opacity-80 max-w-md">
                    {product.description || "A masterfully crafted essential, designed for timeless appeal and everyday comfort."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-light-beige/30">
                  <div className="flex items-center gap-3 text-medium-brown">
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4M20 12l-8 8M20 12l-8-8" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Free shipping over $100</span>
                  </div>
                  <div className="flex items-center gap-3 text-medium-brown">
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Easy 14-day returns</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}