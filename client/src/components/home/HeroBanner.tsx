import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Award } from 'lucide-react';

interface HeroBannerProps {
  onExploreClick: () => void;
  onOpenInspector?: () => void;
  productsCount: number;
  categoriesCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  productsCount,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl my-6 mx-4 sm:mx-6 lg:mx-8">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative px-6 py-12 sm:px-12 sm:py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="max-w-2xl text-center lg:text-left">
          {/* Natural e-commerce promotional badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spring Edition 2026</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Curated Audio & Flagship Tech</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Curated Tech & Gear for the{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Modern Vanguard
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            Discover next-generation electronics, high-fidelity studio acoustics, and smart wearables engineered for creators, innovators, and tastemakers.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onExploreClick}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <span>Shop All Products ({productsCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreClick}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-semibold text-sm border border-slate-700/80 hover:border-emerald-500/40 transition-all duration-200"
            >
              <span>Featured Arrivals</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-left">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Express Delivery</p>
                <p className="text-[11px] text-slate-400">Tracked priority dispatch</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">2-Year Warranty</p>
                <p className="text-[11px] text-slate-400">Comprehensive coverage</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 col-span-2 sm:col-span-1">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">100% Authentic</p>
                <p className="text-[11px] text-slate-400">Verified manufacturer goods</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Visual Card / Floating showcase */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="relative rounded-2xl p-5 bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-xs">
              <span className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Editor's Pick</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium text-[10px]">
                In Stock
              </span>
            </div>

            <div className="relative mt-3 rounded-xl overflow-hidden aspect-[4/3] bg-slate-950 group">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                alt="Aura Pro Headphones"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-emerald-500 text-slate-950 font-extrabold text-xs">
                BESTSELLER
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Premium Audio</span>
                <span className="text-xs font-bold text-amber-400">★ 4.9 (248 reviews)</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">Aura Pro Studio Wireless</h2>
              <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <span className="text-xl font-extrabold text-white">$349.99</span>
                  <span className="text-xs text-slate-500 line-through ml-2">$399.99</span>
                </div>
                <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  Ready to Ship
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
