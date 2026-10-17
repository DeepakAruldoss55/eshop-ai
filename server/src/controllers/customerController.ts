import { Request, Response } from 'express';
import { customerRepo } from '../models/JsonRepository.js';
import type { Customer } from '../types/index.js';
import crypto from 'crypto';

export const getCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await customerRepo.findAll();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const customer = await customerRepo.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, avatar } = req.body;
    if (!firstName || !email) {
      return res.status(400).json({ error: 'First name and email are required' });
    }

    const newCustomer: Customer = {
      id: `cust_${crypto.randomUUID().slice(0, 8)}`,
      firstName,
      lastName: lastName || '',
      email,
      phone: phone || '',
      avatar: avatar || '/images/customers/customer-1.jpeg',
      createdAt: new Date().toISOString()
    };

    const created = await customerRepo.create(newCustomer);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await customerRepo.update(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
};
