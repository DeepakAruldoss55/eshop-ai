import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Order, Expense, Product, Customer } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Calculator,
  PieChart
} from 'lucide-react';

interface AdminOverviewProps {
  onSelectMenu: (menu: 'expenses' | 'categories' | 'products' | 'customers' | 'orders') => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onSelectMenu }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [ordersData, expensesData, productsData, customersData] = await Promise.all([
          api.getOrders(),
          api.getExpenses().then((res) => (Array.isArray(res) ? res : res.data)),
          api.getProducts(),
          api.getCustomers()
        ]);
        setOrders(ordersData);
        setExpenses(expensesData);
        setProducts(productsData);
        setCustomers(customersData);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      }
    };
    loadAll();
  }, []);

  const validOrders = orders.filter((o) => String(o.status || '').toLowerCase() !== 'cancelled');
  const cancelledOrders = orders.filter((o) => String(o.status || '').toLowerCase() === 'cancelled');
  const validExpenses = expenses.filter((e) => String(e.status || '').toLowerCase() !== 'cancelled');

  const totalRevenue = validOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const totalExpenses = validExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netIncome = totalRevenue - totalExpenses;
  const isProfitable = netIncome >= 0;
  const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0';

  const expenseByCategory = validExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Top ERP Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Invoiced Gross Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            From <span className="font-semibold text-slate-700">{validOrders.length} active orders</span>
            {cancelledOrders.length > 0 && (
              <span className="text-slate-400"> ({cancelledOrders.length} cancelled excluded)</span>
            )}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Total Operating Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across <span className="font-semibold text-slate-700">{validExpenses.length}</span> posted entries
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Net Operating Margin (EBIT)</span>
            <DollarSign className={`w-4 h-4 ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              isProfitable ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isProfitable ? '+' : '-'}$
            {Math.abs(netIncome).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Gross Sales minus Operating Ledger
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Operating Profit Margin</span>
            <PieChart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{profitMargin}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Ratio of revenue converted to income
          </div>
        </div>
      </div>

      {/* Formal ERP P&L Income Statement Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Fiscal Income & Expense Summary Statement</h3>
            <p className="text-[11px] text-slate-500">
              Comparative statement of commercial sales receipts vs operational outflow
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 text-slate-700 font-semibold">
            PERIOD: FY-2026-Q1
          </span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold bg-slate-50">
                <th className="py-2 px-3">Account Head / Line Item</th>
                <th className="py-2 px-3">Category Code</th>
                <th className="py-2 px-3 text-center">Postings</th>
                <th className="py-2 px-3 text-right">Debit ($)</th>
                <th className="py-2 px-3 text-right">Credit ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {/* Gross Sales */}
              <tr className="bg-emerald-50/30">
                <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                  Gross Commercial Sales Revenue (Active Orders Invoiced)
                </td>
                <td className="py-2.5 px-3 text-slate-500">REV-ORDERS</td>
                <td className="py-2.5 px-3 text-center text-slate-700">{validOrders.length}</td>
                <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Operating Expenses Line Items */}
              {Object.entries(expenseByCategory).map(([cat, amt]) => {
                const count = expenses.filter((e) => e.category === cat).length;
                return (
                  <tr key={cat} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-800 font-sans pl-6">
                      Less: {cat}
                    </td>
                    <td className="py-2 px-3 text-slate-500">EXP-{cat.slice(0, 3).toUpperCase()}</td>
                    <td className="py-2 px-3 text-center text-slate-700">{count}</td>
                    <td className="py-2 px-3 text-right font-semibold text-rose-700">
                      ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">—</td>
                  </tr>
                );
              })}

              {/* Total Operating Expense Subtotal */}
              <tr className="bg-slate-50 font-bold">
                <td className="py-2 px-3 text-slate-900 font-sans">
                  Total Administrative & Operating Expenses
                </td>
                <td className="py-2 px-3 text-slate-500">EXP-TOTAL</td>
                <td className="py-2 px-3 text-center text-slate-700">{expenses.length}</td>
                <td className="py-2 px-3 text-right text-rose-700">
                  ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-right text-slate-400">—</td>
              </tr>

              {/* Net Balance */}
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-sm">
                <td className="py-2.5 px-3 text-slate-900 font-sans">
                  NET OPERATING BALANCE (EBIT)
                </td>
                <td className="py-2.5 px-3 text-slate-500">EBIT-NET</td>
                <td className="py-2.5 px-3 text-center text-slate-700">—</td>
                <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                <td
                  className={`py-2.5 px-3 text-right ${
                    isProfitable ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isProfitable ? '+' : '-'}$
                  {Math.abs(netIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Cost Analysis & Key Drivers */}
      <div className="bg-white rounded border border-slate-200 shadow-sm p-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm mb-1">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span>Cost Centers & Margin Analysis</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Key operational expenditures and cost allocation across fulfillment facilities, labor compensation, and commercial sales margins.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Warehouse & Facilities</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Facility overhead including rent, climate control, and equipment maintenance totals{' '}
              <span className="font-semibold font-mono text-slate-900">
                ${(expenseByCategory['Warehouse Maintenance'] || 0).toLocaleString()}
              </span>
              . Represents warehouse operating overhead.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>Staff & Payroll Allocation</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Staff compensation for fulfillment, customer care, and operations totals{' '}
              <span className="font-semibold font-mono text-slate-900">
                ${(expenseByCategory['Staff Salary'] || 0).toLocaleString()}
              </span>
              . Primary variable labor allocation.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Net Operating Margin</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Operating margin currently stands at{' '}
              <span className="font-semibold font-mono text-slate-900">{profitMargin}%</span>{' '}
              based on commercial sales receipts vs operational expense outflow.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Department Breakdown & Quick ERP Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Departmental Expense Distribution */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Departmental Cost Distribution
            </h4>
            <button
              onClick={() => onSelectMenu('expenses')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              View Full Ledger →
            </button>
          </div>

          <div className="space-y-2.5 mt-3">
            {Object.entries(expenseByCategory).map(([cat, amt]) => {
              const pct = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : '0';
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{cat}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full rounded bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick ERP Module Navigation */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-2.5 border-b border-slate-200">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Quick Navigation Hub
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Jump directly to an active ERP ledger or inventory master
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <button
                onClick={() => onSelectMenu('expenses')}
                className="p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-900">Operating Expenses</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{expenses.length} Records</div>
              </button>

              <button
                onClick={() => onSelectMenu('products')}
                className="p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-900">Product Master</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{products.length} SKUs</div>
              </button>

              <button
                onClick={() => onSelectMenu('categories')}
                className="p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-900">Departments</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">6 Categories</div>
              </button>

              <button
                onClick={() => onSelectMenu('orders')}
                className="p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-900">Sales Orders</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{orders.length} Invoices</div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs mt-3">
            <span className="text-slate-500">Customer CRM Directory:</span>
            <button
              onClick={() => onSelectMenu('customers')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              {customers.length} Registered Accounts →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
