'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';
import { useCart, useFav } from '../../../providers';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/FooterWrapper';

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
        const sizes = [...new Set(data.product_variants?.map(v => v.size) || [])];
        const colors = [...new Set(data.product_variants?.map(v => v.color) || [])];
        if (sizes.length > 0) setSelectedSize(sizes[0]);
        if (colors.length > 0) setSelectedColor(colors[0]);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id, supabase]);

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

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <h2 className="text-2xl font-serif text-gray-400 uppercase tracking-widest">Product not found</h2>
          <Link href="/products" className="text-black border-b border-black pb-1 font-bold uppercase text-xs tracking-widest">
            Back to Shop
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const images = product.product_images?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const variants = product.product_variants || [];
  const uniqueSizes = [...new Set(variants.map(v => v.size))];
  const uniqueColors = [...new Set(variants.map(v => v.color))];

  const selectedVariant = variants.find(
    v => v.size === selectedSize && v.color === selectedColor
  );
  const stock = selectedVariant?.stock_quantity || 0;
  const inStock = stock > 0;
  const fav = isFavorite(product.id);

  const handleAddToCart = async () => {
    if (!selectedVariant || !inStock) return;
    setAdding(true);
    await addItem(selectedVariant.id, quantity);
    setAdding(false);
  };

  const handleToggleFav = async () => {
    await toggleFavorite(product.id);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white pb-20 pt-20">
        {/* Breadcrumb */}
        <div className="bg-[#f6f5f3] py-4 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest font-bold text-gray-400">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-black transition-colors">Shop</Link>
            <span>/</span>
            <Link href={`/products?category=${product.category?.slug}`} className="hover:text-black transition-colors">
              {product.category?.name}
            </Link>
            <span>/</span>
            <span className="text-black truncate">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
            {/* Images */}
            <div className="lg:col-span-7 space-y-6">
              <div className="aspect-[4/5] flex items-center justify-center overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]?.image_url}
                    alt={product.name}
                    className="w-2/3 h-auto object-cover mix-blend-multiply transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <span className="text-gray-300">No Image</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 h-24 bg-[#f9f9f9] p-2 shrink-0 border transition-all duration-300 ${
                        activeImage === i ? 'border-black' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="lg:col-span-5 flex flex-col pt-4">
              <div className="mb-8 border-b border-gray-100 pb-8">
                <span className="text-[11px] font-black tracking-[3px] text-gray-400 uppercase mb-4 block">
                  {product.category?.name}
                </span>
                <h1 className="text-3xl md:text-5xl font-serif font-medium mb-6 leading-tight text-gray-900">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">${product.price?.toFixed(2)}</span>
                </div>
              </div>

              {/* Size selector */}
              {uniqueSizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[11px] font-bold tracking-widest uppercase mb-4 text-gray-400">
                    Size
                  </h3>
                  <div className="flex gap-3">
                    {uniqueSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                          selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-600 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selector */}
              {uniqueColors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[11px] font-bold tracking-widest uppercase mb-4 text-gray-400">
                    Color
                  </h3>
                  <div className="flex gap-3">
                    {uniqueColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-full border-2 transition-all duration-300 transform hover:scale-110 ${
                          selectedColor === color
                            ? 'border-black scale-110 ring-4 ring-gray-100'
                            : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stock status */}
              <div className="mb-6 text-sm flex items-center gap-2">
                <span className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Status: </span>
                {inStock ? (
                  <span className="uppercase tracking-widest text-[10px] font-black text-green-600">
                    In Stock ({stock} available)
                  </span>
                ) : (
                  <span className="uppercase tracking-widest text-[10px] font-black text-red-500">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Quantity */}
              {inStock && (
                <div className="mb-6">
                  <h3 className="text-[11px] font-bold tracking-widest uppercase mb-4 text-gray-400">
                    Quantity
                  </h3>
                  <div className="flex items-center border border-gray-200 w-fit">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-4 py-3 text-gray-500 hover:text-black transition-colors"
                    >
                      -
                    </button>
                    <span className="px-6 py-3 text-sm font-bold border-x border-gray-200">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                      className="px-4 py-3 text-gray-500 hover:text-black transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-4 mb-12">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || adding}
                  className={`flex-[3] flex items-center justify-center gap-3 py-5 text-xs font-bold uppercase tracking-[2px] transition-all duration-500 ${
                    !inStock
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {adding ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button
                  onClick={handleToggleFav}
                  className="w-16 h-[60px] border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill={fav ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="grid grid-cols-1 gap-5 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-4 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Free Shipping on orders over $100</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Easy Returns within 14 days</span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-12">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-black w-fit pb-1">
                    Description
                  </h3>
                  <p className="text-gray-500 text-sm leading-loose font-light lg:max-w-md">
                    {product.description}
                  </p>
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
