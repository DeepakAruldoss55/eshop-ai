import { Request, Response } from 'express';
import { shippingRepo } from '../models/JsonRepository.js';
import type { ShippingMethod } from '../types/index.js';

export const AVAILABLE_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ship_standard',
    name: 'Standard Carbon-Neutral',
    description: 'Eco-friendly ground delivery in 3-5 business days',
    cost: 0.00,
    estimatedDeliveryDays: '3-5 Days',
  },
  {
    id: 'ship_express',
    name: 'Express Priority Dispatch',
    description: 'Guaranteed 24-48 hours delivery with real-time GPS tracking',
    cost: 15.00,
    estimatedDeliveryDays: '1-2 Days',
  },
  {
    id: 'ship_overnight',
    name: 'Overnight Air Courier',
    description: 'Priority overnight dispatch arriving next morning by 10:30 AM',
    cost: 29.00,
    estimatedDeliveryDays: 'Next Morning',
  }
];

export const getShippingMethods = (_req: Request, res: Response) => {
  res.json(AVAILABLE_SHIPPING_METHODS);
};

export const getShippingRecords = async (_req: Request, res: Response) => {
  try {
    const records = await shippingRepo.findAll();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipping records' });
  }
};

export const trackShipment = async (req: Request, res: Response) => {
  try {
    const trackingNumber = req.params.trackingNumber as string;
    const records = await shippingRepo.findAll();
    const match = records.find(
      (r) => r.trackingNumber.toUpperCase() === trackingNumber.toUpperCase()
    );
    if (!match) {
      return res.status(404).json({ error: 'Tracking record not found for this tracking number' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track shipment' });
  }
};

export const updateShippingCheckpoint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, location, message } = req.body;
    const record = await shippingRepo.findById(id);
    if (!record) {
      return res.status(404).json({ error: 'Shipping record not found' });
    }

    const newUpdate = {
      status: status || record.status,
      location: location || 'Transit Facility',
      message: message || 'Package in transit',
      timestamp: new Date().toISOString()
    };

    record.updates.push(newUpdate);
    if (status) {
      record.status = status;
    }

    const updated = await shippingRepo.update(id, record);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shipping record' });
  }
};
