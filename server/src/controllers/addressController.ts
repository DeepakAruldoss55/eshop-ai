import { Request, Response } from 'express';
import { addressRepo } from '../models/JsonRepository.js';
import type { CustomerAddress } from '../types/index.js';
import crypto from 'crypto';

export const getAddresses = async (req: Request, res: Response) => {
  try {
    let addresses = await addressRepo.findAll();
    const { customerId } = req.query;

    if (customerId && typeof customerId === 'string') {
      addresses = addresses.filter((a) => a.customerId === customerId);
    }

    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer addresses' });
  }
};

export const getAddressById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const address = await addressRepo.findById(id);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch address' });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      type,
      isDefault,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country
    } = req.body;

    if (!customerId || !fullName || !addressLine1 || !city || !postalCode) {
      return res.status(400).json({ error: 'Required address fields missing' });
    }

    const newAddress: CustomerAddress = {
      id: `addr_${crypto.randomUUID().slice(0, 8)}`,
      customerId,
      type: type || 'home',
      isDefault: Boolean(isDefault),
      fullName,
      phone: phone || '',
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state: state || '',
      postalCode,
      country: country || 'India',
    };

    if (newAddress.isDefault) {
      const all = await addressRepo.findAll();
      for (const a of all) {
        if (a.customerId === customerId && a.isDefault) {
          a.isDefault = false;
        }
      }
      await addressRepo.save(all);
    }

    const created = await addressRepo.create(newAddress);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer address' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await addressRepo.update(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer address' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await addressRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
};
