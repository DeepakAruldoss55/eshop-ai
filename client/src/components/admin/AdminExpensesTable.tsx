import React, { useState, useEffect, useMemo } from 'react';
import type { Expense } from '../../types';
import { api } from '../../services/api';
import { PaginationControls } from './PaginationControls';
import {
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Building2,
  Users,
  X,
  RefreshCw,
  Eye,
  Download,
  DollarSign
} from 'lucide-react';

interface AdminExpensesTableProps {
  onExpenseCountChange?: (count: number) => void;
}

export const AdminExpensesTable: React.FC<AdminExpensesTableProps> = ({ onExpenseCountChange }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date-desc');
  
  // Pagination State (ERP default 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Warehouse Maintenance',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    recurring: 'Monthly',
    paymentMethod: 'Bank Wire Transfer',
    status: 'Paid',
    receiptRef: '',
    notes: ''
  });

  const categories = [
    'Warehouse Maintenance',
    'Staff Salary',
    'Utilities',
    'Packaging & Supplies',
    'Logistics & Fleet',
    'Technology & Software',
    'Operations & Legal'
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.getExpenses();
      if (Array.isArray(res)) {
        setExpenses(res);
        onExpenseCountChange?.(res.length);
      } else if (res && 'data' in res) {
        setExpenses(res.data);
        onExpenseCountChange?.(res.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      showNotice('Failed to load expense ledger records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedSort('date-desc');
    setCurrentPage(1);
    fetchExpenses();
  };

  // Filter & Sort
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.receiptRef && e.receiptRef.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          (e.paymentMethod && e.paymentMethod.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedStatus !== 'all') {
      result = result.filter((e) => e.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    if (selectedSort === 'amount-desc') {
      result.sort((a, b) => b.amount - a.amount);
    } else if (selectedSort === 'amount-asc') {
      result.sort((a, b) => a.amount - b.amount);
    } else if (selectedSort === 'date-asc') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (selectedSort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [expenses, search, selectedCategory, selectedStatus, selectedSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus, selectedSort, pageSize]);

  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(startIndex, startIndex + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  // Statistics summaries
  const totalAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const warehouseTotal = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Warehouse Maintenance')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const staffTotal = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Staff Salary')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const utilitiesTotal = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Utilities')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) {
      showNotice('Expense title and amount are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.createExpense({
        title: newExpense.title.trim(),
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        recurring: newExpense.recurring as any,
        paymentMethod: newExpense.paymentMethod,
        status: newExpense.status as any,
        receiptRef: newExpense.receiptRef.trim() || undefined,
        notes: newExpense.notes.trim() || undefined
      });

      setIsAddModalOpen(false);
      setNewExpense({
        title: '',
        category: 'Warehouse Maintenance',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        recurring: 'Monthly',
        paymentMethod: 'Bank Wire Transfer',
        status: 'Paid',
        receiptRef: '',
        notes: ''
      });
      showNotice('Expense journal entry posted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Error posting expense:', error);
      showNotice('Failed to post journal entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`Confirm deletion of journal entry: "${title}"?`)) {
      return;
    }
    try {
      await api.deleteExpense(id);
      showNotice('Journal entry deleted');
      fetchExpenses();
    } catch (error) {
      showNotice('Failed to delete entry', 'error');
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID,Reference,Title,Category,Date,Amount,Frequency,PaymentMethod,Status,Notes'];
    const rows = filteredExpenses.map((e) =>
      [
        e.id,
        `"${e.receiptRef || ''}"`,
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        e.date,
        e.amount,
        e.recurring,
        `"${e.paymentMethod}"`,
        e.status,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expense_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-3.5 py-2.5 rounded shadow-lg text-xs font-semibold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-rose-900 text-rose-100 border border-rose-700'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Top ERP Financial KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Operating Expenses
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{expenses.length} journal postings</div>
          </div>
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Warehouse & Facilities
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${warehouseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lease, safety & forklift maintenance</div>
          </div>
          <div className="w-9 h-9 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Staff Salaries & Payroll
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${staffTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Warehouse crew & customer operations</div>
          </div>
          <div className="w-9 h-9 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Utilities & Infrastructure
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${utilitiesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Power, climate & business fiber</div>
          </div>
          <div className="w-9 h-9 rounded bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main ERP Ledger Table Box */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Action & Filter Toolbar */}
        <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Operating Expenses Ledger</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 text-slate-700">
              {totalItems} entries
            </span>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ref, title, category..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white text-slate-800 placeholder-slate-400 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="expense-search-input"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="expense-category-filter"
            >
              <option value="all">All Departments</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="expense-status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">PAID</option>
              <option value="Scheduled">SCHEDULED</option>
              <option value="Pending">PENDING</option>
            </select>

            {/* Sort */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="expense-sort-filter"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High–Low)</option>
              <option value="amount-asc">Amount (Low–High)</option>
              <option value="title">Title (A–Z)</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-xs font-medium transition-colors shadow-sm"
              title="Export Ledger to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {/* Reset Filters & Refresh */}
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
              title="Reset Filters & Refresh"
              id="expense-reset-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>

            {/* Add Entry Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition-colors shadow-sm"
              id="add-expense-modal-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Expense Entry</span>
            </button>
          </div>
        </div>

        {/* Dense ERP Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="admin-expenses-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-24">Voucher Ref</th>
                <th className="py-2.5 px-3.5">Title / Particulars</th>
                <th className="py-2.5 px-3.5">Category Department</th>
                <th className="py-2.5 px-3.5">Posting Date</th>
                <th className="py-2.5 px-3.5">Payment Method</th>
                <th className="py-2.5 px-3.5">Terms</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Amount (USD)</th>
                <th className="py-2.5 px-3.5 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading expense ledger...
                  </td>
                </tr>
              ) : paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <p className="mb-2">No expense ledger entries match the selected filters.</p>
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm"
                      id="expense-empty-reset-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    onClick={() => setViewingExpense(expense)}
                  >
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600 font-semibold">
                      {expense.receiptRef || expense.id.slice(0, 10)}
                    </td>

                    <td className="py-2.5 px-3.5 font-medium text-slate-900 group-hover:text-blue-700">
                      <div>{expense.title}</div>
                      {expense.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-sm font-normal">
                          {expense.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {expense.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      {expense.date}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                      {expense.paymentMethod}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {expense.recurring}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          expense.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : expense.status === 'Scheduled'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {expense.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900 text-xs">
                      ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td
                      className="py-2.5 px-3.5 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setViewingExpense(expense)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="View Voucher"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id, expense.title)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standard ERP Pagination */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          itemName="entries"
        />
      </div>

      {/* Add Expense Journal Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Post Expense Journal Voucher</h4>
                <p className="text-[11px] text-slate-500">Record administrative, warehouse, or operational expense</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Particulars / Description *</label>
                <input
                  type="text"
                  required
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  placeholder="e.g. Warehouse HVAC Servicing, Picker Staff Salaries"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Category *</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Posting Date</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Frequency</label>
                  <select
                    value={newExpense.recurring}
                    onChange={(e) => setNewExpense({ ...newExpense, recurring: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="One-time">One-time</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                  >
                    <option value="Bank Wire Transfer">Bank Wire Transfer</option>
                    <option value="Direct Payroll Deposit">Direct Payroll Deposit</option>
                    <option value="Corporate Credit Card">Corporate Credit Card</option>
                    <option value="Auto-Debit">Auto-Debit</option>
                    <option value="Fleet Card">Fleet Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Posting Status</label>
                  <select
                    value={newExpense.status}
                    onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                  >
                    <option value="Paid">PAID</option>
                    <option value="Scheduled">SCHEDULED</option>
                    <option value="Pending">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Invoice / Voucher Reference No.</label>
                <input
                  type="text"
                  value={newExpense.receiptRef}
                  onChange={(e) => setNewExpense({ ...newExpense, receiptRef: e.target.value })}
                  placeholder="e.g. INV-WH-2026-031 or PAYROLL-MAR-01"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  placeholder="Service description, contract details..."
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Journal Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Voucher Modal */}
      {viewingExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setViewingExpense(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Expense Voucher Details</h4>
                <div className="font-mono text-[11px] text-slate-500">
                  {viewingExpense.receiptRef || viewingExpense.id}
                </div>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Particulars:</span>
                <span className="font-semibold text-slate-900 text-right">{viewingExpense.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category:</span>
                <span className="font-medium text-slate-800">{viewingExpense.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Voucher Amount:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${Number(viewingExpense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Posting Date:</span>
                <span className="font-mono text-slate-800">{viewingExpense.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-semibold text-slate-800">{viewingExpense.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="text-slate-800">{viewingExpense.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Posting Schedule:</span>
                <span className="text-slate-800">{viewingExpense.recurring}</span>
              </div>
              {viewingExpense.notes && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Remarks:</span>
                  <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                    {viewingExpense.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  handleDeleteExpense(viewingExpense.id, viewingExpense.title);
                  setViewingExpense(null);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Voucher</span>
              </button>
              <button
                onClick={() => setViewingExpense(null)}
                className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
