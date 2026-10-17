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
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [loadedOrders, loadedShipping] = await Promise.all([
          api.getOrders(),
          api.getAllShippingRecords(),
        ]);
        setOrders(loadedOrders);
        setShippingRecords(loadedShipping);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, customerId]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setLoading(true);
    setTrackError('');
    try {
      const match = await api.trackShipment(trackQuery.trim());
      setTrackedRecord(match);
      setActiveTab('track');
    } catch (err) {
      setTrackError('No shipment found for this tracking number. Please verify code.');
      setTrackedRecord(null);
    } finally {
      setLoading(false);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Order History & Shipment Tracking</h3>
              <p className="text-xs text-slate-400">
                Real-time package status and chronological delivery updates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/30">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === 'orders'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === 'track'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
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
              className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 w-44 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-bold text-xs rounded-lg border border-cyan-500/30 transition-colors"
            >
              Track
            </button>
          </form>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'orders' ? (
            /* Orders View */
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-medium">No orders recorded yet.</p>
                  <p className="text-xs text-slate-500 mt-1">When you complete a purchase, your order status will appear here.</p>
                </div>
              ) : (
                orders.map((ord) => {
                  const matchingShipping = shippingRecords.find((s) => s.orderId === ord.id);
                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {ord.orderNumber}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : ord.status === 'on_the_way'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : ord.status === 'shipped'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : ord.status === 'open' || ord.status === 'pending'
                                ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ord.status.replace(/_/g, ' ')}
                          </span>

                          <span className="text-xs font-bold text-white font-mono">
                            ${ord.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-2 rounded-xl bg-slate-900/60">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div className="flex-1 truncate">
                              <p className="font-bold text-slate-200 truncate">{item.title}</p>
                              <p className="text-[11px] text-slate-400">
                                {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer actions & delivery info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            To: {ord.shippingAddress.fullName} ({ord.shippingAddress.city}, {ord.shippingAddress.country})
                          </span>
                        </div>

                        {matchingShipping && (
                          <button
                            onClick={() => inspectShippingForOrder(ord)}
                            className="flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300"
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
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {trackError}
                </div>
              )}

              {trackedRecord ? (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">
                        Carrier: {trackedRecord.carrier}
                      </span>
                      <h4 className="text-xl font-extrabold text-white mt-0.5">
                        Tracking: {trackedRecord.trackingNumber}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Linked Order: <strong className="text-slate-200">{trackedRecord.orderNumber}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Est. Delivery</span>
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        {trackedRecord.estimatedDeliveryDate}
                      </span>
                      <span className="text-[11px] font-bold uppercase block mt-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {trackedRecord.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Visual Timeline Steps */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                      Delivery Progress Timeline
                    </h5>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {trackedRecord.updates.map((update, idx) => (
                        <div key={idx} className="relative group">
                          {/* Circle dot */}
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-cyan-500/20" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white">{update.status}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(update.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">{update.message}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-600" />
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
                  <Truck className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-medium">Select an order above or enter a tracking code to view progress.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
