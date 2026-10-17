import React from 'react';
import {
  ShoppingBag,
  Search,
  User,
  PackageCheck,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';
import type { Customer } from '../../types';

interface NavbarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenDbInspector?: () => void;
  onOpenOrderHistory: () => void;
  onNavigateAdmin?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  customers: Customer[];
  activeCustomer: Customer | null;
  setActiveCustomer: (c: Customer) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenOrderHistory,
  searchQuery,
  setSearchQuery,
  customers,
  activeCustomer,
  setActiveCustomer,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs transition-all">
      {/* Top Announcement & Account Utility Bar */}
      <div className="bg-[#0f172a] text-slate-200 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>Free Express Shipping on orders over $200</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>2-Year Official Warranty</span>
            </span>
            <span className="text-slate-600 hidden lg:inline">|</span>
            <span className="hidden lg:inline-flex items-center gap-1 text-slate-300">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>30-Day Hassle-Free Returns</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 hidden md:inline font-medium">Shopping as:</span>
            {customers.length > 0 && (
              <div className="relative inline-flex items-center space-x-1.5 bg-slate-800/90 hover:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 transition-colors">
                <User className="w-3 h-3 text-blue-400" />
                <select
                  value={activeCustomer?.id || ''}
                  onChange={(e) => {
                    const match = customers.find((c) => c.id === e.target.value);
                    if (match) setActiveCustomer(match);
                  }}
                  className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Retail Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div
          className="flex items-center space-x-3 cursor-pointer group shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-200">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-2xl tracking-tight text-slate-900">
                Deep<span className="text-blue-600">Shop</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Flagship
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Authorized Electronics & Studio Gear
            </p>
          </div>
        </div>

        {/* Central Retail Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flagship laptops, studio headphones, 8K cameras, smartwatches..."
              className="w-full pl-11 pr-20 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder-slate-400 rounded-full border border-slate-200/90 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="absolute right-3.5 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-400 border border-slate-200">
                <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                Instant Filter
              </span>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Admin ERP Portal Link */}
          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition-all"
            title="Open Admin ERP Portal (New Tab)"
            id="navbar-admin-link"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Admin ERP</span>
          </a>

          {/* Orders & Tracking Button */}
          <button
            type="button"
            onClick={onOpenOrderHistory}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
            title="View order history and track shipments"
          >
            <PackageCheck className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Track Orders</span>
          </button>

          {/* Shopping Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-blue-700 text-xs px-2 py-0.5 rounded-full font-extrabold shadow-2xs">
                {cartCount}
              </span>
            )}
            {cartTotal > 0 && (
              <span className="hidden lg:inline text-xs font-bold text-blue-100 border-l border-blue-400/40 pl-2 font-mono">
                ${cartTotal.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, categories, brands..."
            className="w-full pl-10 pr-8 py-2 bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder-slate-400 rounded-full border border-slate-200 focus:border-blue-600 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
