import React from 'react';
import type { Category } from '../../types';
import { Layers, Sparkles } from 'lucide-react';

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
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Shop by Department</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore our curated product categories tailored for work, studio, and everyday lifestyle
          </p>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            View All Departments
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* All Products Tile */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 group cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/90 hover:border-blue-300 text-slate-800 hover:shadow-md'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${
              selectedCategory === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold">All Products</span>
          <span
            className={`text-[11px] mt-0.5 ${
              selectedCategory === 'all' ? 'text-blue-100' : 'text-slate-400'
            }`}
          >
            Complete Catalog
          </span>
        </button>

        {/* Categories mapped */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative overflow-hidden flex flex-col items-center p-3.5 rounded-2xl border text-center transition-all duration-200 group cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border-slate-200/90 hover:border-blue-300 text-slate-800 hover:shadow-md'
              }`}
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden mb-2.5 bg-slate-100 border border-slate-200/60 shadow-xs">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <span
                className={`text-xs sm:text-sm font-extrabold line-clamp-1 ${
                  isSelected ? 'text-white' : 'text-slate-800 group-hover:text-blue-600'
                }`}
              >
                {cat.name}
              </span>

              <span
                className={`text-[11px] mt-0.5 font-medium ${
                  isSelected ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {cat.productCount ?? 0} {cat.productCount === 1 ? 'item' : 'items'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
