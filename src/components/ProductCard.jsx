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
  const hasStock = variants.some(v => v.stock_quantity > 0);
  const fav = isFavorite(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const firstVariant = variants.find(v => v.stock_quantity > 0);
    if (firstVariant) {
      await addItem(firstVariant.id);
    }
  };

  const handleToggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(product.id);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div
        className="flex flex-col items-center text-center mb-8 max-w-[270px] mx-auto relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative w-full overflow-hidden cursor-pointer h-[280px] sm:h-[300px] md:h-72 flex items-center justify-center">
          {primaryImage ? (
            <>
              <img
                src={primaryImage.image_url}
                alt={product.name}
                className={`w-8/9 h-full object-contain mix-blend-multiply transition-all duration-700 ${
                  isHovered && secondImage ? 'opacity-0' : 'opacity-100 scale-100'
                } ${isHovered ? 'scale-105' : ''}`}
              />
              {secondImage && (
                <img
                  src={secondImage.image_url}
                  alt={product.name}
                  className={`absolute inset-0 w-8/9 h-full object-contain mix-blend-multiply mx-auto my-auto transition-all duration-700 ${
                    isHovered ? 'opacity-100 scale-105' : 'opacity-0'
                  }`}
                />
              )}
            </>
          ) : (
            <div className="text-gray-300 text-sm">No Image</div>
          )}

          {/* Hover action buttons */}
          <div
            className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
          >
            <button
              onClick={handleAddToCart}
              className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all"
              title="Add to cart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            <button
              onClick={handleToggleFav}
              className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all"
              title="Add to favorites"
            >
              <svg className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Product info */}
        <h3 className="text-sm font-semibold mt-3 mb-1 text-gray-900 hover:text-gray-600 transition-colors cursor-pointer">
          {product.name}
        </h3>

        <p className="text-base font-bold text-gray-800 mb-2">
          ${product.price?.toFixed(2)}
        </p>

        {/* Color dots */}
        {uniqueColors.length > 0 && (
          <div className="flex gap-2 justify-center">
            {uniqueColors.slice(0, 5).map((color) => (
              <span
                key={color}
                className="w-3.5 h-3.5 rounded-full border border-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
