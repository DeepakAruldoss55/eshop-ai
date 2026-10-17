import React from 'react';
import { X, Star, ShoppingBag, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import type { Product } from '../../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setAdded(false);
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Images Section */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />
              {product.featured && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950 text-xs font-extrabold uppercase shadow">
                  Featured Choice
                </span>
              )}
            </div>

            {/* Thumbnail switcher if multiple images */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-emerald-500 scale-105'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Service guarantees */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-center">
              <div className="flex flex-col items-center p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <Truck className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-300">Fast Shipping</span>
                <span className="text-[10px] text-slate-500">Tracked order</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <ShieldCheck className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-300">2-Year Guard</span>
                <span className="text-[10px] text-slate-500">Warranty included</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <RotateCcw className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-300">30-Day Return</span>
                <span className="text-[10px] text-slate-500">Money-back</span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 font-semibold text-slate-300">
                {product.categoryName}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-500">{product.id}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              {product.title}
            </h2>

            {/* Rating */}
            <div className="flex items-center space-x-2 mt-2">
              {product.reviewCount > 0 && product.rating > 0 ? (
                <>
                  <div className="flex items-center space-x-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold text-sm">{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-500 text-xs">({product.reviewCount} customer reviews)</span>
                </>
              ) : (
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Star className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-300 font-medium">No reviews yet</span>
                  <span className="text-slate-500 text-[11px]">(0 customer reviews)</span>
                </div>
              )}
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 text-xs font-semibold">Verified Product</span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline space-x-3">
              <span className="text-3xl font-black text-white">
                ${product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-slate-500 line-through">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mt-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Specifications & Highlights
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-slate-500 text-[11px]">{key}</span>
                      <span className="text-slate-200 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Add to Cart Actions */}
            <div className="mt-auto pt-6 border-t border-slate-800/80 flex items-center gap-4">
              {/* Quantity counter */}
              <div className="flex items-center border border-slate-700 rounded-xl bg-slate-950">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-400 hover:text-white"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-bold text-white min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-slate-400 hover:text-white"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={product.stock <= 0}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-bold text-sm shadow-lg transition-all ${
                  added
                    ? 'bg-emerald-500 text-slate-950'
                    : product.stock <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added {quantity} to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Add to Cart • ${(product.price * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
