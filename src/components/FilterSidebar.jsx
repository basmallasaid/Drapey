'use client';
import { useState, useEffect } from 'react';

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-light-beige pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full group">
        <h4 className="text-[10px] font-bold uppercase tracking-[4px] text-dark-brown group-hover:text-tan transition-colors">{title}</h4>
        <svg className={`w-3 h-3 text-medium-brown transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`mt-6 transition-all duration-500 overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
};

export default function FilterSidebar({ categories, selectedCategory, setSelectedCategory, priceRange, setPriceRange, maxPrice, colors, selectedColor, setSelectedColor, getCount }) {
  const [localPrice, setLocalPrice] = useState(priceRange[1]);

  useEffect(() => { setLocalPrice(priceRange[1]); }, [priceRange]);

  return (
    <div className="space-y-2">
      <FilterSection title="Collections">
        <div className="flex flex-col space-y-3">
          <button onClick={() => setSelectedCategory('all')} className={`text-[10px] uppercase tracking-widest flex justify-between items-center ${selectedCategory === 'all' ? 'text-tan font-black' : 'text-medium-brown hover:text-dark-brown'}`}>
            All Products <span>[{getCount('all')}]</span>
          </button>
          {categories.map(cat => (
            <button key={cat.slug} onClick={() => setSelectedCategory(cat.slug)} className={`text-[10px] uppercase tracking-widest flex justify-between items-center ${selectedCategory === cat.slug ? 'text-tan font-black' : 'text-medium-brown hover:text-dark-brown'}`}>
              {cat.name} <span>[{getCount(cat.slug)}]</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Filter">
        <div className="px-1">
          <input 
            type="range" min={0} max={maxPrice || 2000} value={localPrice} 
            onChange={(e) => setLocalPrice(Number(e.target.value))}
            onMouseUp={() => setPriceRange([0, localPrice])} 
            onTouchEnd={() => setPriceRange([0, localPrice])}
            className="w-full accent-tan h-1 bg-light-beige rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-4 text-[10px] font-bold tracking-widest text-dark-brown">
            <span>$0.00</span><span className="text-tan">${localPrice}.00</span>
          </div>
        </div>
      </FilterSection>

      {colors.length > 0 && (
        <FilterSection title="Color Palette">
          <div className="flex flex-wrap gap-2.5">
            {colors.map(color => (
              <button key={color} onClick={() => setSelectedColor(selectedColor === color ? 'all' : color)} 
                className={`w-6 h-6 rounded-full border border-light-beige transition-all ring-offset-2 ${selectedColor === color ? 'ring-2 ring-tan scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}