import React from 'react';
import { ShoppingBag, ShieldCheck, Truck, Headphones, RotateCcw, Lock } from 'lucide-react';

interface FooterProps {
  onOpenInspector?: () => void;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateAdmin }) => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      {/* Guarantees Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Free Priority Delivery</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">On all orders over $200</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">2-Year Warranty</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Comprehensive hardware protection</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">30-Day Easy Returns</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Hassle-free money back guarantee</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">24/7 Expert Support</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Dedicated product specialists</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShoppingBag className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <span className="font-black text-xl text-white tracking-tight">DeepShop</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Curated audio equipment, flagship electronics, and lifestyle gear engineered for creators, professionals, and tastemakers.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-medium pt-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Safe & Secure 256-Bit Encrypted Payments</span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Explore Collections
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><a href="#categories" className="hover:text-emerald-400 transition-colors">Smart Electronics</a></li>
              <li><a href="#categories" className="hover:text-emerald-400 transition-colors">Studio & Premium Audio</a></li>
              <li><a href="#categories" className="hover:text-emerald-400 transition-colors">Smart Wearables</a></li>
              <li><a href="#categories" className="hover:text-emerald-400 transition-colors">Laptops & Workstations</a></li>
              <li><a href="#categories" className="hover:text-emerald-400 transition-colors">Cameras & Drones</a></li>
              <li><a href="#categories" className="hover:text-emerald-400 transition-colors">Minimal Accessories</a></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Customer Experience
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Track Your Order</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Shipping & Delivery Rates</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Returns & Exchanges Policy</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Warranty & Repairs</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Contact Support Team</span></li>
            </ul>
          </div>

          {/* Company & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              About & Trust
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Our Philosophy</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Sustainability Commitment</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Privacy Policy</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Terms of Service</span></li>
              <li><span className="hover:text-emerald-400 cursor-pointer transition-colors">Official Store Locator</span></li>
                <li>
                  <a
                    href="/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-1"
                    id="footer-admin-link"
                  >
                    <span>Admin Operations Portal</span>
                  </a>
                </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 DeepShop Inc. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
