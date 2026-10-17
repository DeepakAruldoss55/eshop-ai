import React from 'react';
import {
  X,
  CheckCircle,
  Truck,
  CreditCard,
  MapPin,
  User,
  Package,
  ArrowRight,
  Plus
} from 'lucide-react';
import type {
  CartItem,
  Customer,
  CustomerAddress,
  ShippingMethod,
  Order,
  ShippingRecord
} from '../../types';
import { api } from '../../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  customers?: Customer[];
  activeCustomer: Customer | null;
  onOrderSuccess: (order: Order, shipping: ShippingRecord) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  activeCustomer,
  onOrderSuccess,
}) => {
  const [addresses, setAddresses] = React.useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('');
  const [shippingMethods, setShippingMethods] = React.useState<ShippingMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState<'upi' | 'credit_card' | 'cod'>('upi');

  const [loading, setLoading] = React.useState(false);
  const [orderComplete, setOrderComplete] = React.useState<{
    order: Order;
    shipping: ShippingRecord;
  } | null>(null);

  // New address form toggle
  const [showNewAddress, setShowNewAddress] = React.useState(false);
  const [newAddressForm, setNewAddressForm] = React.useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  // Load customer addresses & shipping methods
  React.useEffect(() => {
    if (!isOpen) {
      setOrderComplete(null);
      setShowNewAddress(false);
      return;
    }

    const loadData = async () => {
      try {
        const [loadedAddresses, loadedMethods] = await Promise.all([
          api.getCustomerAddresses(activeCustomer?.id),
          api.getShippingMethods(),
        ]);

        setAddresses(loadedAddresses);
        if (loadedAddresses.length > 0) {
          const defaultAddr = loadedAddresses.find((a) => a.isDefault) || loadedAddresses[0];
          setSelectedAddressId(defaultAddr.id);
        }

        setShippingMethods(loadedMethods);
        if (loadedMethods.length > 0) {
          setSelectedMethodId(loadedMethods[0].id);
        }
      } catch (err) {
        console.error('Failed to load checkout options:', err);
      }
    };

    loadData();
  }, [isOpen, activeCustomer]);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const selectedMethod = shippingMethods.find((m) => m.id === selectedMethodId);
  const shippingFee = selectedMethod?.cost ?? 0;
  const tax = Math.round((subtotal * 0.08) * 100) / 100;
  const grandTotal = Math.round((subtotal + shippingFee + tax) * 100) / 100;

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;

    try {
      const created = await api.createCustomerAddress({
        ...newAddressForm,
        customerId: activeCustomer.id,
        type: 'home',
        isDefault: addresses.length === 0,
      });

      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
    } catch (err) {
      console.error('Failed to add address:', err);
    }
  };

  const handlePlaceOrder = async () => {
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress || !selectedMethod) {
      alert('Please select a shipping address and delivery option.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId: activeCustomer?.id || 'cust_guest',
        customerName: `${activeCustomer?.firstName || ''} ${activeCustomer?.lastName || ''}`.trim() || selectedAddress.fullName,
        customerEmail: activeCustomer?.email || 'customer@example.com',
        customerPhone: activeCustomer?.phone || selectedAddress.phone,
        items: items.map((i) => ({
          productId: i.product.id,
          title: i.product.title,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images[0],
        })),
        shippingAddress: selectedAddress,
        shippingMethod: selectedMethod,
        paymentMethod,
      };

      const result = await api.createOrder(payload);
      setOrderComplete(result);
      onOrderSuccess(result.order, result.shipping);
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('Failed to place order. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Express Checkout</h3>
              <p className="text-xs text-slate-400">
                Secure 256-Bit SSL Encrypted Checkout
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

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {orderComplete ? (
            /* Order Success View */
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-500/10">
                <CheckCircle className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-black text-white">Order Confirmed!</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Thank you for your purchase. A confirmation receipt and shipment tracking details have been generated below.
              </p>

              {/* Order Info Card */}
              <div className="w-full mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Order Number</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {orderComplete.order.orderNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Tracking Code</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {orderComplete.shipping.trackingNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Recipient</span>
                  <span className="text-slate-200 font-medium">
                    {orderComplete.order.customerName}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Delivery Address</span>
                  <span className="text-slate-200 text-right truncate max-w-xs">
                    {orderComplete.order.shippingAddress.addressLine1}, {orderComplete.order.shippingAddress.city}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Paid</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    ${orderComplete.order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <>
              {/* Step 1: Customer Profile */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Contact & Customer Profile</span>
                </label>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={activeCustomer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {activeCustomer?.firstName} {activeCustomer?.lastName}
                      </h4>
                      <p className="text-xs text-slate-400">{activeCustomer?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    Active Session
                  </span>
                </div>
              </div>

              {/* Step 2: Shipping Address */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. Delivery Address</span>
                  </label>
                  <button
                    onClick={() => setShowNewAddress(!showNewAddress)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showNewAddress ? 'Cancel' : 'Add New'}</span>
                  </button>
                </div>

                {showNewAddress ? (
                  <form onSubmit={handleAddNewAddress} className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                        <input
                          required
                          type="text"
                          value={newAddressForm.fullName}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Phone</label>
                        <input
                          required
                          type="text"
                          value={newAddressForm.phone}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Address Line 1</label>
                      <input
                        required
                        type="text"
                        value={newAddressForm.addressLine1}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">City</label>
                        <input
                          required
                          type="text"
                          value={newAddressForm.city}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">State</label>
                        <input
                          type="text"
                          value={newAddressForm.state}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Postal Code</label>
                        <input
                          required
                          type="text"
                          value={newAddressForm.postalCode}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg mt-2"
                    >
                      Save Delivery Address
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    {addresses.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded-xl">
                        No addresses found for this customer. Click &quot;Add New&quot; above.
                      </p>
                    ) : (
                      addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer flex items-start justify-between transition-all ${
                            selectedAddressId === addr.id
                              ? 'bg-emerald-500/10 border-emerald-500'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="radio"
                              name="addressRadio"
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 text-emerald-500 focus:ring-emerald-400"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-white">{addr.fullName}</span>
                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {addr.type}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-semibold text-emerald-400">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">Phone: {addr.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Shipping Method */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Delivery Speed & Carrier</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethodId(method.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                        selectedMethodId === method.id
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{method.name}</span>
                          <span className="text-xs font-extrabold text-emerald-400 font-mono">
                            {method.cost === 0 ? 'FREE' : `$${method.cost.toFixed(2)}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {method.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-2">
                        ETA: {method.estimatedDeliveryDays}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>4. Payment Method</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs block font-bold">UPI / QR Code</span>
                    <span className="text-[10px] text-slate-500">Zero surcharge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'credit_card'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs block font-bold">Credit / Debit</span>
                    <span className="text-[10px] text-slate-500">Instant secure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'cod'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs block font-bold">Cash on Delivery</span>
                    <span className="text-[10px] text-slate-500">Pay at doorstep</span>
                  </button>
                </div>
              </div>

              {/* Final Cost Summary */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping Fee</span>
                  <span className="font-mono text-slate-200">
                    {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (8%)</span>
                  <span className="font-mono text-slate-200">${tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-emerald-400 text-lg font-black font-mono">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Confirm & Place Order (${grandTotal.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
