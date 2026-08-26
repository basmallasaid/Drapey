'use client';

import { useState } from 'react';

const FilterAccordion = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full mb-3"
      >
        <span className="text-xs font-bold tracking-widest uppercase">{title}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="space-y-1">{children}</div>}
    </div>
  );
};

const FilterSidebar = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  maxPrice = 200,
  sizes,
  selectedSize,
  setSelectedSize,
  colors,
  selectedColor,
  setSelectedColor,
  getCount,
}) => {
  return (
    <div className="space-y-6 pr-0 md:pr-6">
      {/* Categories */}
      <FilterAccordion title="Categories">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`block w-full text-left py-1.5 text-sm transition-colors ${
            selectedCategory === 'all' ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
          }`}
        >
          All [{getCount('all')}]
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`block w-full text-left py-1.5 flex justify-between items-center text-sm transition-colors ${
              selectedCategory === cat.slug ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            <span>{cat.name}</span>
            <span className="text-xs text-gray-400">[{getCount(cat.slug)}]</span>
          </button>
        ))}
      </FilterAccordion>

      <hr className="border-gray-100" />

      {/* Price Range */}
      <FilterAccordion title="Price">
        <div className="px-1 pt-2">
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-black"
          />
          <p className="text-sm text-gray-600 mt-2">
            ${priceRange[0]} — ${priceRange[1]}
          </p>
        </div>
      </FilterAccordion>

      <hr className="border-gray-100" />

      {/* Sizes */}
      {sizes.length > 0 && (
        <>
          <FilterAccordion title="Size">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(selectedSize === size ? 'all' : size)}
                className={`block w-full text-left py-1.5 text-sm transition-colors ${
                  selectedSize === size ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
                }`}
              >
                {size}
              </button>
            ))}
          </FilterAccordion>
          <hr className="border-gray-100" />
        </>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <FilterAccordion title="Color">
          <div className="flex flex-wrap gap-2 pt-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(selectedColor === color ? 'all' : color)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  selectedColor === color
                    ? 'border-black scale-110 ring-2 ring-gray-200'
                    : 'border-gray-200 hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </FilterAccordion>
      )}
    </div>
  );
};

export default FilterSidebar;
