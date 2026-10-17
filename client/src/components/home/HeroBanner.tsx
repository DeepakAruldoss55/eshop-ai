import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Award, Star, Tag } from 'lucide-react';

interface HeroBannerProps {
  onExploreClick: () => void;
  onOpenInspector?: () => void;
  productsCount: number;
  categoriesCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  productsCount,
  categoriesCount,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Promotional Split Banner (8 cols) */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-xl shadow-blue-900/10 p-6 sm:p-10 flex flex-col justify-between min-h-[380px]">
          {/* Subtle decorative light circles */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Season Flagship Showcase</span>
              <span className="opacity-60">•</span>
              <span className="text-sky-100">{categoriesCount} Curated Departments</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Next-Gen Tech & Everyday Essentials,{' '}
              <span className="text-amber-300">Delivered Fast.</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed max-w-lg">
              Shop studio-grade acoustics, smart workspace gear, and flagship accessories backed by a 2-year official warranty and express doorstep delivery.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onExploreClick}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-blue-700 font-extrabold text-sm shadow-lg shadow-slate-950/15 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Shop All Products ({productsCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreClick}
                className="flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/25 backdrop-blur-sm transition-all cursor-pointer"
              >
                <span>View Today&apos;s Deals</span>
              </button>
            </div>
          </div>

          {/* Bottom Trust Bar inside Main Hero */}
          <div className="relative z-10 mt-8 pt-5 border-t border-white/15 grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-white/15 text-amber-300">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Same-Day Dispatch</p>
                <p className="text-[11px] text-blue-100 hidden sm:block">On in-stock orders</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-white/15 text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">2-Year Protection</p>
                <p className="text-[11px] text-blue-100 hidden sm:block">Full replacement cover</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-white/15 text-sky-200">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">100% Authentic</p>
                <p className="text-[11px] text-blue-100 hidden sm:block">Direct brand partner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Spotlight Deal Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                <Tag className="w-3 h-3" />
                <span>Spotlight Deal</span>
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                In Stock & Ready
              </span>
            </div>

            <div
              onClick={onExploreClick}
              className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 group cursor-pointer border border-slate-100"
            >
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                alt="Aura Pro Studio Wireless"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-sm text-white font-bold text-[11px]">
                SAVE $50 TODAY
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-blue-600 uppercase tracking-wider text-[11px]">
                  Flagship Audio
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  4.9 <span className="text-slate-400 font-normal">(248)</span>
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                Aura Pro Studio Wireless ANC
              </h2>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Lossless spatial acoustics with 45-hour adaptive battery life and ultra-plush memory foam ear cushions.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 line-through block">$399.99</span>
              <span className="text-2xl font-black text-slate-900">$349.99</span>
            </div>
            <button
              onClick={onExploreClick}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Explore Deal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
