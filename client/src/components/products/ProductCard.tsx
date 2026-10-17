import React from 'react';
import { Star, ShoppingCart, Eye, Check } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
}) => {
  const [justAdded, setJustAdded] = React.useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative flex flex-col bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* Quick View Button on Image hover */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-bold shadow-lg hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Body details */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-blue-600 font-bold text-[11px] uppercase tracking-wider truncate max-w-[140px]">
            {product.categoryName}
          </span>
          {product.reviewCount > 0 && product.rating > 0 ? (
            <div className="flex items-center space-x-1 text-slate-700 font-bold text-[11px]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-slate-400 font-medium text-[11px]">
              <Star className="w-3.5 h-3.5 text-slate-300" />
              <span>New Arrival</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
          {product.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {product.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900">
                ${product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] text-slate-500 font-medium">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-sm'
                : product.stock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/15'
            }`}
            title="Add item to cart"
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
