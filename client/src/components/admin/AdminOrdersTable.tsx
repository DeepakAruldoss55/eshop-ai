import React, { useState, useEffect, useMemo } from 'react';
import type { Order } from '../../types';
import { api } from '../../services/api';
import { PaginationControls } from './PaginationControls';
import {
  Search,
  ShoppingCart,
  DollarSign,
  Eye,
  X,
  RefreshCw,
  Truck,
  Download,
  FileText,
  ChevronDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const getStatusBadgeClass = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80';
    case 'on_the_way':
      return 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100/80';
    case 'shipped':
      return 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100/80';
    case 'processing':
      return 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80';
    case 'open':
    case 'pending':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80';
  }
};

export const AdminOrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date-desc');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination (ERP default 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Order Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingOrderId(orderId);
      const updated = await api.updateOrderStatus(orderId, newStatus);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );

      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: updated.status } : null));
      }

      const readableStatus = newStatus.replace(/_/g, ' ').toUpperCase();
      setActionMessage({
        type: 'success',
        text: `Order #${updated.orderNumber || orderId} fulfillment status updated to "${readableStatus}". Shipment record synchronized.`
      });
      setTimeout(() => setActionMessage(null), 4500);
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      setActionMessage({
        type: 'error',
        text: error.message || 'Failed to update order status.'
      });
      setTimeout(() => setActionMessage(null), 4500);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedSort('date-desc');
    setCurrentPage(1);
    fetchOrders();
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          o.items.some((item) => item.title.toLowerCase().includes(q))
      );
    }

    if (selectedStatus !== 'all') {
      result = result.filter((o) => {
        const s = o.status.toLowerCase();
        const sel = selectedStatus.toLowerCase();
        if (sel === 'open') return s === 'open' || s === 'pending';
        return s === sel;
      });
    }

    if (selectedSort === 'amount-desc') {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (selectedSort === 'amount-asc') {
      result.sort((a, b) => a.totalAmount - b.totalAmount);
    } else if (selectedSort === 'date-asc') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [orders, search, selectedStatus, selectedSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus, selectedSort, pageSize]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const validOrders = useMemo(() => {
    return orders.filter((o) => String(o.status || '').toLowerCase() !== 'cancelled');
  }, [orders]);

  const cancelledCount = orders.length - validOrders.length;

  const totalRevenue = useMemo(() => {
    return validOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  }, [validOrders]);

  const averageOrderValue = useMemo(() => {
    return validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
  }, [validOrders, totalRevenue]);

  const exportToCSV = () => {
    if (orders.length === 0) return;
    const headers = ['OrderNumber,CustomerName,Email,Phone,ItemsCount,Subtotal,Tax,Shipping,Total,Status,PaymentMethod,PaymentStatus,CreatedDate'];
    const rows = filteredOrders.map((o) =>
      [
        o.orderNumber,
        `"${o.customerName}"`,
        `"${o.customerEmail}"`,
        `"${o.customerPhone}"`,
        o.items.reduce((acc, i) => acc + i.quantity, 0),
        o.subtotal,
        o.tax,
        o.shippingFee,
        o.totalAmount,
        o.status,
        `"${o.paymentMethod}"`,
        o.paymentStatus,
        o.createdAt.split('T')[0]
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top ERP KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced Sales
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              From {validOrders.length} active orders{cancelledCount > 0 ? ` (${cancelledCount} cancelled)` : ''}
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Sales Orders Invoiced
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {validOrders.length} Active
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {orders.length} total ({cancelledCount} cancelled)
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Average Order Value (AOV)
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Average revenue per active order</div>
          </div>
          <div className="w-9 h-9 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending Warehouse Pick
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">
              {orders.filter((o) => ['processing', 'open', 'pending'].includes(o.status.toLowerCase())).length} Orders
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">In fulfillment queue</div>
          </div>
          <div className="w-9 h-9 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Truck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded border text-xs flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-top-1 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
          role="alert"
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main ERP Orders Table Box */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Sales Orders & Invoices Master</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 text-slate-700">
              {totalItems} orders
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, item..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white text-slate-800 placeholder-slate-400 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="order-search-input"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm font-medium"
              id="order-status-filter"
            >
              <option value="all">All Fulfillment Statuses</option>
              <option value="open">OPEN (Booked)</option>
              <option value="processing">PROCESSING (Picking)</option>
              <option value="shipped">SHIPPED (In Transit)</option>
              <option value="on_the_way">ON THE WAY (Out For Delivery)</option>
              <option value="delivered">DELIVERED (Completed)</option>
              <option value="cancelled">CANCELLED</option>
            </select>

            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="order-sort-select"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Total (High–Low)</option>
              <option value="amount-asc">Total (Low–High)</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-xs font-medium transition-colors shadow-sm"
              title="Export Sales Orders to CSV"
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
              id="order-reset-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dense ERP Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="admin-orders-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-28">Order Invoice #</th>
                <th className="py-2.5 px-3.5">Posting Date</th>
                <th className="py-2.5 px-3.5">Customer Account</th>
                <th className="py-2.5 px-3.5">Items Summary</th>
                <th className="py-2.5 px-3.5">Payment Terms</th>
                <th className="py-2.5 px-3.5">Fulfillment Status</th>
                <th className="py-2.5 px-3.5 text-right">Invoiced Total</th>
                <th className="py-2.5 px-3.5 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    <p className="mb-2">No sales orders match the selected criteria.</p>
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm"
                      id="order-empty-reset-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
                  return (
                    <tr
                      key={order.id}
                      className="odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      onClick={() => setViewingOrder(order)}
                    >
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-bold text-blue-700">
                        {order.orderNumber}
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {order.customerEmail}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-700">
                        <span className="font-semibold">{itemCount} units</span>
                        <span className="text-slate-400 text-[11px] truncate block max-w-xs">
                          {order.items[0]?.title}
                          {order.items.length > 1 && ` (+${order.items.length - 1} more)`}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="capitalize text-slate-700 text-[11px]">
                          {order.paymentMethod.replace('_', ' ')}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td
                        className="py-2.5 px-3.5 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                            className={`appearance-none pl-2 pr-6 py-1 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${getStatusBadgeClass(
                              order.status
                            )} ${updatingOrderId === order.id ? 'opacity-60 cursor-wait' : ''}`}
                            title="Click to change order fulfillment status"
                          >
                            <option value="open">OPEN</option>
                            <option value="processing">PROCESSING</option>
                            <option value="shipped">SHIPPED</option>
                            <option value="on_the_way">ON THE WAY</option>
                            <option value="delivered">DELIVERED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-500">
                            {updatingOrderId === order.id ? (
                              <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
                            ) : (
                              <ChevronDown className="w-3 h-3 opacity-70" />
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900 text-xs">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>

                      <td
                        className="py-2.5 px-3.5 whitespace-nowrap text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="View Sales Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
          itemName="orders"
        />
      </div>

      {/* Order Details Invoice Modal */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setViewingOrder(null)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold font-mono text-slate-900">
                    Sales Invoice: {viewingOrder.orderNumber}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${getStatusBadgeClass(
                      viewingOrder.status
                    )}`}
                  >
                    {viewingOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Booked on {new Date(viewingOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Fulfillment Status Management Bar */}
            <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Change Status:
                </span>
                <div className="relative inline-block">
                  <select
                    value={viewingOrder.status}
                    disabled={updatingOrderId === viewingOrder.id}
                    onChange={(e) => handleStatusChange(viewingOrder.id, e.target.value as Order['status'])}
                    className={`appearance-none pl-2.5 pr-7 py-1 text-xs font-bold uppercase rounded border shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${getStatusBadgeClass(
                      viewingOrder.status
                    )} ${updatingOrderId === viewingOrder.id ? 'opacity-60 cursor-wait' : ''}`}
                    id="modal-order-status-select"
                  >
                    <option value="open">OPEN (Order Booked)</option>
                    <option value="processing">PROCESSING (Picking / Packing)</option>
                    <option value="shipped">SHIPPED (Freight In Transit)</option>
                    <option value="on_the_way">ON THE WAY (Out For Delivery)</option>
                    <option value="delivered">DELIVERED (Completed)</option>
                    <option value="cancelled">CANCELLED (Void / Refunded)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-600">
                    {updatingOrderId === viewingOrder.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                    ) : (
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Status Action Buttons */}
              <div className="flex items-center gap-1.5">
                {viewingOrder.status !== 'shipped' && viewingOrder.status !== 'delivered' && viewingOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={updatingOrderId === viewingOrder.id}
                    onClick={() => handleStatusChange(viewingOrder.id, 'shipped')}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    Mark Shipped
                  </button>
                )}
                {viewingOrder.status !== 'on_the_way' && viewingOrder.status !== 'delivered' && viewingOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={updatingOrderId === viewingOrder.id}
                    onClick={() => handleStatusChange(viewingOrder.id, 'on_the_way')}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    Mark On The Way
                  </button>
                )}
                {viewingOrder.status !== 'delivered' && viewingOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={updatingOrderId === viewingOrder.id}
                    onClick={() => handleStatusChange(viewingOrder.id, 'delivered')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              {/* Buyer & Ship To Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Buyer Account
                  </div>
                  <div className="font-bold text-slate-900">{viewingOrder.customerName}</div>
                  <div className="text-slate-600">{viewingOrder.customerEmail}</div>
                  <div className="text-slate-600">{viewingOrder.customerPhone}</div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Shipping Consignee
                  </div>
                  <div className="font-semibold text-slate-900">{viewingOrder.shippingAddress?.fullName}</div>
                  <div className="text-slate-600">
                    {viewingOrder.shippingAddress?.addressLine1}
                    {viewingOrder.shippingAddress?.addressLine2 ? `, ${viewingOrder.shippingAddress.addressLine2}` : ''}
                  </div>
                  <div className="text-slate-600">
                    {viewingOrder.shippingAddress?.city}, {viewingOrder.shippingAddress?.state}{' '}
                    {viewingOrder.shippingAddress?.postalCode}, {viewingOrder.shippingAddress?.country}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Invoice Line Items
                </div>
                <table className="w-full text-xs text-left border border-slate-200 rounded overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                    <tr>
                      <th className="py-1.5 px-2.5">Item Description</th>
                      <th className="py-1.5 px-2.5 text-right">Unit Price</th>
                      <th className="py-1.5 px-2.5 text-center">Qty</th>
                      <th className="py-1.5 px-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {viewingOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 font-sans font-medium text-slate-900">{item.title}</td>
                        <td className="py-2 px-2.5 text-right text-slate-700">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 text-center text-slate-900">{item.quantity}</td>
                        <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-slate-200 font-mono space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="font-sans">Goods Subtotal:</span>
                  <span>${Number(viewingOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans">Freight / Shipping:</span>
                  <span>${Number(viewingOrder.shippingFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans">Sales Tax (8%):</span>
                  <span>${Number(viewingOrder.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span className="font-sans">Total Invoiced:</span>
                  <span className="text-blue-700">${Number(viewingOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingOrder(null)}
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
