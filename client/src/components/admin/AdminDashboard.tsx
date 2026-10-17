import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Receipt,
  FolderTree,
  Package,
  Users,
  ShoppingCart,
  ArrowLeft,
  Building2,
  Menu,
  X,
  ChevronRight,
  Briefcase,
  CircleDot,
  Sparkles
} from 'lucide-react';
import { AdminOverview } from './AdminOverview';
import { AdminExpensesTable } from './AdminExpensesTable';
import { AdminCategoriesTable } from './AdminCategoriesTable';
import { AdminProductsTable } from './AdminProductsTable';
import { AdminCustomersTable } from './AdminCustomersTable';
import { AdminOrdersTable } from './AdminOrdersTable';
import { AdminAIAnalytics } from './AdminAIAnalytics';
import { api } from '../../services/api';

export type AdminMenuTab = 'overview' | 'expenses' | 'categories' | 'products' | 'customers' | 'ai_analytics' | 'orders';

interface AdminDashboardProps {
  onNavigateHome: () => void;
  initialTab?: AdminMenuTab;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateHome,
  initialTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<AdminMenuTab>(initialTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expenseCount, setExpenseCount] = useState<number>(15);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [categoryCount, setCategoryCount] = useState<number>(6);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    Promise.all([
      api.getExpenses().then((data) => {
        if (Array.isArray(data)) setExpenseCount(data.length);
        else if (data && 'pagination' in data) setExpenseCount(data.pagination.total);
      }),
      api.getOrders().then((data) => setOrderCount(data.length)),
      api.getProducts().then((data) => setProductCount(data.length)),
      api.getCategories().then((data) => setCategoryCount(data.length))
    ]).catch(() => {});
  }, []);

  const menuSections = [
    {
      sectionTitle: 'OVERVIEW & AI ANALYTICS',
      items: [
        {
          id: 'overview' as AdminMenuTab,
          label: 'P&L Statement & Executive KPI',
          icon: BarChart3,
          code: 'OVW-01',
          description: 'Revenue, Expense Ledger & Margins'
        },
        {
          id: 'ai_analytics' as AdminMenuTab,
          label: 'AI Analytics & Statistics',
          icon: Sparkles,
          badge: 'AI',
          code: 'AI-01',
          description: 'Business Performance & Insights'
        }
      ]
    },
    {
      sectionTitle: 'CATALOG & INVENTORY',
      items: [
        {
          id: 'categories' as AdminMenuTab,
          label: 'Categories & Departments',
          icon: FolderTree,
          badge: categoryCount,
          code: 'CAT-01',
          description: 'Product Classification'
        },
        {
          id: 'products' as AdminMenuTab,
          label: 'Product Master & SKUs',
          icon: Package,
          badge: productCount,
          code: 'PRD-01',
          description: 'Catalog & Stock Valuation'
        }
      ]
    },
    {
      sectionTitle: 'SALES & CRM',
      items: [
        {
          id: 'orders' as AdminMenuTab,
          label: 'Sales Orders & Invoices',
          icon: ShoppingCart,
          badge: orderCount || undefined,
          code: 'ORD-01',
          description: 'Transactions & Dispatch'
        },
        {
          id: 'customers' as AdminMenuTab,
          label: 'Customer Accounts (CRM)',
          icon: Users,
          badge: '3',
          code: 'CRM-01',
          description: 'Buyer Master Directory'
        }
      ]
    },
    {
      sectionTitle: 'FINANCIAL MANAGEMENT',
      items: [
        {
          id: 'expenses' as AdminMenuTab,
          label: 'Operating Expenses Ledger',
          icon: Receipt,
          badge: expenseCount,
          code: 'FIN-01',
          description: 'Warehouse, Payroll & Utilities'
        }
      ]
    }
  ];

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'overview':
        return { module: 'Overview & AI Analytics', page: 'P&L Statement & Executive Summary' };
      case 'ai_analytics':
        return { module: 'Overview & AI Analytics', page: 'AI Analytics, Statistics & Business Performance' };
      case 'categories':
        return { module: 'Catalog & Inventory', page: 'Categories & Departments' };
      case 'products':
        return { module: 'Catalog & Inventory', page: 'Product Master & SKUs' };
      case 'orders':
        return { module: 'Sales & CRM', page: 'Sales Orders & Invoices' };
      case 'customers':
        return { module: 'Sales & CRM', page: 'Customer Accounts (CRM)' };
      case 'expenses':
        return { module: 'Financial Management', page: 'Operating Expenses Ledger (Warehouse & Payroll)' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Docked ERP Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ERP Header / Brand */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-[#0a0f1d]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-wide uppercase">
                DeepShop <span className="text-blue-400">ERP</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">Enterprise Suite v2.4</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company & Branch Indicator */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 text-[11px] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">Main Warehouse & Hub</span>
          </div>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
            CORP-01
          </span>
        </div>

        {/* ERP Module Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs scrollbar-thin">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-2.5 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.sectionTitle}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors text-xs ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                      id={`erp-menu-${item.id}`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800 bg-[#0a0f1d] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 truncate">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-[11px]">
              OP
            </div>
            <div className="truncate">
              <div className="font-semibold text-slate-200 text-[11px] truncate">Admin Operator</div>
              <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <CircleDot className="w-2.5 h-2.5" />
                <span>Session Active</span>
              </div>
            </div>
          </div>
          <button
            onClick={onNavigateHome}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Exit to Storefront"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main ERP Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top ERP Utility Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-800">ERP</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 hidden sm:inline">{breadcrumb.module}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <span className="font-semibold text-blue-700">{breadcrumb.page}</span>
            </div>
          </div>

          {/* Right Header Status & Navigation */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-[11px]">FY 2026 • Ledger Balanced</span>
            </div>

            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-semibold transition-colors shadow-sm"
              id="back-to-store-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back to Web Store</span>
            </button>
          </div>
        </header>

        {/* Content Area Viewport */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <AdminOverview onSelectMenu={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'expenses' && (
            <AdminExpensesTable onExpenseCountChange={setExpenseCount} />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesTable onCategoryCountChange={setCategoryCount} />
          )}

          {activeTab === 'products' && (
            <AdminProductsTable onProductCountChange={setProductCount} />
          )}

          {activeTab === 'customers' && <AdminCustomersTable />}

          {activeTab === 'ai_analytics' && (
            <AdminAIAnalytics onSelectMenu={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'orders' && <AdminOrdersTable />}
        </main>
      </div>
    </div>
  );
};
