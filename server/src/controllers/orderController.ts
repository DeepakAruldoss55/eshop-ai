import { Request, Response } from 'express';
import { orderRepo, shippingRepo, productRepo } from '../models/JsonRepository.js';
import type { Order, ShippingRecord } from '../types/index.js';
import crypto from 'crypto';

export const getOrders = async (req: Request, res: Response) => {
  try {
    let orders = await orderRepo.findAll();
    const { customerId } = req.query;

    if (customerId && typeof customerId === 'string') {
      orders = orders.filter((o) => o.customerId === customerId);
    }

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await orderRepo.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      shippingMethod,
      paymentMethod,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    if (!shippingAddress || !shippingMethod) {
      return res.status(400).json({ error: 'Shipping address and method are required' });
    }

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingFee = Number(shippingMethod.cost) || 0;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const totalAmount = Math.round((subtotal + shippingFee + tax) * 100) / 100;

    const orderRandomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `order_${crypto.randomUUID().slice(0, 8)}`;
    const orderNumber = `ORD-2026-${orderRandomSuffix}`;
    const trackingNumber = `TRK-DPS-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: customerId || 'guest',
      customerName: customerName || shippingAddress.fullName || 'Valued Customer',
      customerEmail: customerEmail || 'customer@example.com',
      customerPhone: customerPhone || shippingAddress.phone || '',
      items,
      shippingAddress,
      shippingMethod,
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      status: 'processing',
      paymentMethod: paymentMethod || 'credit_card',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      trackingNumber,
    };

    await orderRepo.create(newOrder);

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 3);

    const shippingRecord: ShippingRecord = {
      id: `ship_${crypto.randomUUID().slice(0, 8)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      trackingNumber,
      carrier: shippingMethod.name.includes('Express') ? 'BlueDart Express' : 'Standard Ground Express',
      status: 'pending',
      estimatedDeliveryDate: estimatedDate.toISOString().split('T')[0],
      updates: [
        {
          status: 'Order Placed & Verified',
          location: 'Fulfillment Center, Hub 1',
          message: 'Payment confirmed. Warehouse team preparing items for packaging.',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    await shippingRepo.create(shippingRecord);

    // Decrement stock in products.json
    for (const item of items) {
      const prod = await productRepo.findById(item.productId);
      if (prod && prod.stock > 0) {
        await productRepo.update(prod.id, {
          stock: Math.max(0, prod.stock - item.quantity)
        });
      }
    }

    res.status(201).json({
      order: newOrder,
      shipping: shippingRecord
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['open', 'pending', 'processing', 'shipped', 'on_the_way', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const normalizedStatus = status.toLowerCase() as Order['status'];
    const order = await orderRepo.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = normalizedStatus;
    const updated = await orderRepo.update(id, order);

    const shippingRecords = await shippingRepo.findAll();
    const shipMatch = shippingRecords.find((s) => s.orderId === order.id);
    if (shipMatch) {
      let shipStatus: ShippingRecord['status'] = 'in_transit';
      let message = `Order fulfillment status changed to ${normalizedStatus}.`;
      let location = 'Central Distribution Hub';

      if (normalizedStatus === 'delivered') {
        shipStatus = 'delivered';
        message = 'Consignment successfully delivered to consignee.';
        location = `${order.shippingAddress?.city || 'Local Hub'}, Delivery Station`;
      } else if (normalizedStatus === 'on_the_way') {
        shipStatus = 'out_for_delivery';
        message = 'Consignment is on the way with courier delivery agent.';
        location = `${order.shippingAddress?.city || 'Local Delivery Agent'}`;
      } else if (normalizedStatus === 'shipped') {
        shipStatus = 'in_transit';
        message = 'Package dispatched from fulfillment hub via freight carrier.';
        location = 'Regional Logistics Hub';
      } else if (normalizedStatus === 'processing') {
        shipStatus = 'pending';
        message = 'Warehouse team packaging items and assigning shipment airway bill.';
        location = 'Main Warehouse & Fulfillment Center';
      } else if (normalizedStatus === 'open' || normalizedStatus === 'pending') {
        shipStatus = 'pending';
        message = 'Order registered in fulfillment backlog.';
        location = 'Fulfillment Center';
      } else if (normalizedStatus === 'cancelled') {
        shipStatus = 'pending';
        message = 'Order cancelled in warehouse ledger.';
        location = 'Administration';
      }

      shipMatch.status = shipStatus;
      shipMatch.updates.push({
        status: `Status: ${normalizedStatus.replace(/_/g, ' ').toUpperCase()}`,
        location,
        message,
        timestamp: new Date().toISOString()
      });
      await shippingRepo.update(shipMatch.id, shipMatch);
    }

    res.json(updated);
  } catch (error) {
    console.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
