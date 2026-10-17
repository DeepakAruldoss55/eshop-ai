import React from 'react';
import type { Category } from '../../types';
import { Layers } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories" className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Featured Categories</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Browse our handpicked collections engineered for performance and daily life
          </p>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
          >
            Show All Categories
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* All Products Tile */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 group ${
            selectedCategory === 'all'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-xs sm:text-sm font-bold">All Products</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Full Catalog</span>
        </button>

        {/* Categories mapped */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative overflow-hidden flex flex-col items-center p-3 rounded-2xl border text-center transition-all duration-200 group ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden mb-2 bg-slate-800">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-115 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
              </div>

              <span className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                {cat.name}
              </span>

              <span className="text-[11px] text-slate-400 mt-0.5">
                {cat.productCount ?? 0} {cat.productCount === 1 ? 'item' : 'items'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
