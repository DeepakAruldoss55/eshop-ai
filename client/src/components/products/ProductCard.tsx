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
      className="group relative flex flex-col bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick View Button on Image hover */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-md hover:bg-white hover:text-slate-950 transition-colors shadow-lg"
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
          <span className="text-slate-400 font-medium text-[11px] truncate max-w-[130px]">
            {product.categoryName}
          </span>
          {product.reviewCount > 0 && product.rating > 0 ? (
            <div className="flex items-center space-x-1 text-amber-400 font-semibold text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-500">({product.reviewCount})</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-slate-400 font-medium text-[11px]">
              <Star className="w-3 h-3 text-slate-600" />
              <span className="text-slate-400">New</span>
              <span className="text-slate-500 text-[10px]">(0)</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1.5">
          {product.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {product.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-extrabold text-white">
                ${product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-500 line-through">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center space-x-1 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  product.stock > 10 ? 'bg-emerald-400' : product.stock > 0 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-medium">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className={`flex items-center justify-center p-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
              justAdded
                ? 'bg-emerald-500 text-slate-950 scale-105'
                : product.stock <= 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30'
            }`}
            title="Add item to cart"
          >
            {justAdded ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
