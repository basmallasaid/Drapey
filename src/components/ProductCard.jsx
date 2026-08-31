'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFav, useCart } from '../../providers';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toggleFavorite, isFavorite } = useFav();
  const { addItem } = useCart();

  if (!product) return null;

  const images = product.product_images || [];
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const secondImage = images.find(img => !img.is_primary);
  const variants = product.product_variants || [];
  const uniqueColors = [...new Set(variants.map(v => v.color))];
  const fav = isFavorite(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const firstVariant = variants.find(v => v.stock_quantity > 0);
    if (firstVariant) await addItem(firstVariant.id);
  };

  const handleToggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(product.id);
  };

  return (
    <Link href={`/product/${product.id}`} className="group block mb-12">
      <div
        className="relative overflow-hidden bg-cream"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container - Aspect Ratio 3:4 is standard for fashion */}
        <div className="aspect-[3/4] relative overflow-hidden bg-white shadow-sm">
          {primaryImage ? (
            <>
              <img
                src={primaryImage.image_url}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-1000 ${
                  isHovered && secondImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
              />
              {secondImage && (
                <img
                  src={secondImage.image_url}
                  alt={product.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                    isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-medium-brown text-[10px] uppercase tracking-widest bg-light-beige">
              No Image
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-dark-brown/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className={`absolute bottom-4 left-0 right-0 px-4 flex flex-col gap-2 transition-all duration-500 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
             <button
              onClick={handleAddToCart}
              className="bg-white text-dark-brown py-3 text-[10px] font-bold uppercase tracking-[2px] shadow-xl hover:bg-dark-brown hover:text-white transition-all active:scale-95"
            >
              Add to Cart
            </button>
          </div>

          <button
            onClick={handleToggleFav}
            className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-dark-brown hover:text-tan transition-all"
          >
            <svg className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Info Area */}
        <div className="pt-5 text-center px-2 space-y-1">
          <h3 className="text-xs font-bold tracking-widest uppercase text-dark-brown group-hover:text-tan transition-colors">
            {product.name}
          </h3>
          <p className="text-sm font-bold text-dark-brown opacity-90">
            EGP {product.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          
          {/* Subtle Color Dots */}
          {uniqueColors.length > 0 && (
            <div className="flex gap-2 justify-center pt-2">
              {uniqueColors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="w-2.5 h-2.5 rounded-full border border-light-beige ring-offset-2 hover:ring-1 hover:ring-tan transition-all"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;