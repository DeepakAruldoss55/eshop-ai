import React from 'react';
import {
  X,
  Package,
  Truck,
  ChevronRight,
  MapPin
} from 'lucide-react';
import type { Order, ShippingRecord } from '../../types';
import { api } from '../../services/api';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  customerId,
}) => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [shippingRecords, setShippingRecords] = React.useState<ShippingRecord[]>([]);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'track'>('orders');

  // Tracking query state
  const [trackQuery, setTrackQuery] = React.useState('');
  const [trackedRecord, setTrackedRecord] = React.useState<ShippingRecord | null>(null);
  const [trackError, setTrackError] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [loadedOrders, loadedShipping] = await Promise.all([
          api.getOrders(),
          api.getAllShippingRecords(),
        ]);
        setOrders(loadedOrders);
        setShippingRecords(loadedShipping);
      } catch (err) {
        console.error('Failed to load orders:', err);
      }
    };

    fetchData();
  }, [isOpen, customerId]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackError('');
    try {
      const match = await api.trackShipment(trackQuery.trim());
      setTrackedRecord(match);
      setActiveTab('track');
    } catch {
      setTrackError('No shipment found for this tracking number. Please verify code.');
      setTrackedRecord(null);
    }
  };

  const inspectShippingForOrder = (order: Order) => {
    const match = shippingRecords.find((s) => s.orderId === order.id);
    if (match) {
      setTrackedRecord(match);
      setActiveTab('track');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Order History & Shipment Tracking</h3>
              <p className="text-xs text-slate-500">
                Real-time package status and chronological delivery updates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-xs font-extrabold transition-colors border-b-2 cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`pb-3 text-xs font-extrabold transition-colors border-b-2 cursor-pointer ${
                activeTab === 'track'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Shipment Tracking {trackedRecord ? `(${trackedRecord.trackingNumber})` : ''}
            </button>
          </div>

          {/* Quick Tracking Search Bar */}
          <form onSubmit={handleTrackSubmit} className="pb-2 hidden sm:flex items-center space-x-1.5">
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="Enter TRK-AUR-XXXX..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 w-44 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Track
            </button>
          </form>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
          {activeTab === 'orders' ? (
            /* Orders View */
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No orders recorded yet.</p>
                  <p className="text-xs text-slate-500 mt-1">When you complete a purchase, your order status will appear here.</p>
                </div>
              ) : (
                orders.map((ord) => {
                  const matchingShipping = shippingRecords.find((s) => s.orderId === ord.id);
                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 shadow-2xs transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-extrabold text-blue-600 text-sm">
                            {ord.orderNumber}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-medium">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ord.status === 'on_the_way'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : ord.status === 'shipped'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : ord.status === 'open' || ord.status === 'pending'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {ord.status.replace(/_/g, ' ')}
                          </span>

                          <span className="text-xs font-black text-slate-900 font-mono">
                            ${ord.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200/60"
                            />
                            <div className="flex-1 truncate">
                              <p className="font-bold text-slate-800 truncate">{item.title}</p>
                              <p className="text-[11px] text-slate-500">
                                {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer actions & delivery info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            To: <strong className="text-slate-700">{ord.shippingAddress.fullName}</strong> ({ord.shippingAddress.city}, {ord.shippingAddress.country})
                          </span>
                        </div>

                        {matchingShipping && (
                          <button
                            onClick={() => inspectShippingForOrder(ord)}
                            className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <span>Track: {matchingShipping.trackingNumber}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Shipping Tracking View */
            <div>
              {trackError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {trackError}
                </div>
              )}

              {trackedRecord ? (
                <div className="space-y-5">
                  {/* Status Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-blue-100">
                        Carrier: {trackedRecord.carrier}
                      </span>
                      <h4 className="text-xl font-extrabold text-white mt-0.5">
                        Tracking: {trackedRecord.trackingNumber}
                      </h4>
                      <p className="text-xs text-blue-100 mt-0.5">
                        Linked Order: <strong className="text-white">{trackedRecord.orderNumber}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-blue-100 block">Est. Delivery</span>
                      <span className="text-sm font-black text-amber-300 font-mono">
                        {trackedRecord.estimatedDeliveryDate}
                      </span>
                      <span className="text-[11px] font-bold uppercase block mt-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/25">
                        {trackedRecord.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Visual Timeline Steps */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200">
                    <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4">
                      Delivery Progress Timeline
                    </h5>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {trackedRecord.updates.map((update, idx) => (
                        <div key={idx} className="relative group">
                          {/* Circle dot */}
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-extrabold text-slate-900">{update.status}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(update.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{update.message}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{update.location}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Truck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Select an order above or enter a tracking code to view progress.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
