import React from 'react';
import {
  ShoppingBag,
  Search,
  User,
  PackageCheck,
  ShieldCheck,
  Truck
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 transition-all">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-300">Free Priority Shipping</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">On all orders over $200</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400 inline" />
              2-Year Warranty Guaranteed
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 hidden md:inline">Account:</span>
            {customers.length > 0 && (
              <div className="relative inline-flex items-center space-x-1.5 bg-slate-800/90 px-2 py-0.5 rounded-full border border-slate-700/60">
                <User className="w-3 h-3 text-emerald-400" />
                <select
                  value={activeCustomer?.id || ''}
                  onChange={(e) => {
                    const match = customers.find((c) => c.id === e.target.value);
                    if (match) setActiveCustomer(match);
                  }}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 transform group-hover:scale-105">
            <ShoppingBag className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                DeepShop
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Curated Tech Store</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, headphones, smartwatches, gear..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 text-sm text-slate-200 placeholder-slate-500 rounded-xl border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Admin Portal Trigger */}
          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm"
            title="Open Admin ERP Portal (New Tab)"
            id="navbar-admin-link"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin</span>
          </a>

          {/* Orders & Tracking Trigger */}
          <button
            onClick={onOpenOrderHistory}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
            title="View order history and track shipments"
          >
            <PackageCheck className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Track Orders</span>
          </button>

          {/* Shopping Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 transform active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-slate-950 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-extrabold shadow-sm">
                {cartCount}
              </span>
            )}
            {cartTotal > 0 && (
              <span className="hidden md:inline text-xs font-bold text-slate-900 border-l border-slate-900/30 pl-2">
                ${cartTotal.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 text-sm text-slate-200 placeholder-slate-500 rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>
    </header>
  );
};
