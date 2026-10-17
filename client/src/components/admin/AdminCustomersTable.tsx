import React, { useState, useEffect, useMemo } from 'react';
import type { Customer, CustomerAddress } from '../../types';
import { api } from '../../services/api';
import { PaginationControls } from './PaginationControls';
import { Search, UserCheck, Mail, Phone, RefreshCw, MapPin, Download } from 'lucide-react';

export const AdminCustomersTable: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Pagination (ERP default 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [custData, addrData] = await Promise.all([
        api.getCustomers(),
        api.getCustomerAddresses().catch(() => [])
      ]);
      setCustomers(custData);
      setAddresses(addrData);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setSortOrder('newest');
    setCurrentPage(1);
    fetchCustomers();
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'name-asc') {
      result.sort((a, b) => a.firstName.localeCompare(b.firstName));
    } else if (sortOrder === 'name-desc') {
      result.sort((a, b) => b.firstName.localeCompare(a.firstName));
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [customers, search, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, pageSize]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const getCustomerPrimaryCity = (customerId: string) => {
    const addr = addresses.find((a) => a.customerId === customerId);
    if (!addr) return 'Registered Online';
    return `${addr.city}, ${addr.country}`;
  };

  const exportToCSV = () => {
    if (customers.length === 0) return;
    const headers = ['CustomerID,FirstName,LastName,Email,Phone,Region,CreatedDate'];
    const rows = filteredCustomers.map((c) =>
      [
        c.id,
        `"${c.firstName}"`,
        `"${c.lastName}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${getCustomerPrimaryCity(c.id)}"`,
        c.createdAt.split('T')[0]
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top ERP KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Customer Accounts (CRM)
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{customers.length} Accounts</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Verified customer profiles</div>
          </div>
          <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Linked Delivery Addresses
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{addresses.length} Verified</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Valid shipping consignees</div>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Account Status
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">100% Active</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active retail customers</div>
          </div>
          <div className="w-9 h-9 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main ERP Table Box */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Customer Accounts Master</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 text-slate-700">
              {totalItems} accounts
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search account #, name, email..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white text-slate-800 placeholder-slate-400 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="customer-search-input"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="customer-sort-select"
            >
              <option value="newest">Joined (Newest)</option>
              <option value="oldest">Joined (Oldest)</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-xs font-medium transition-colors shadow-sm"
              title="Export Customers to CSV"
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
              id="customer-reset-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dense ERP Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="admin-customers-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-28">Account ID</th>
                <th className="py-2.5 px-3.5">Customer Name</th>
                <th className="py-2.5 px-3.5">Registered Email</th>
                <th className="py-2.5 px-3.5">Telephone</th>
                <th className="py-2.5 px-3.5">Primary Delivery Region</th>
                <th className="py-2.5 px-3.5 text-right">Account Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading customers...
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <p className="mb-2">No customer accounts match your search.</p>
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm"
                      id="customer-empty-reset-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/50 transition-colors">
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-700">
                      {customer.id}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                          {customer.avatar ? (
                            <img
                              src={customer.avatar}
                              alt={customer.firstName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>{customer.firstName[0]}</span>
                          )}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{customer.email}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{customer.phone}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getCustomerPrimaryCity(customer.id)}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono text-slate-600 text-[11px]">
                      {new Date(customer.createdAt).toLocaleDateString()}
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
          pageSizeOptions={[10, 25, 50]}
          itemName="accounts"
        />
      </div>
    </div>
  );
};
