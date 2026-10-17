import fs from 'fs/promises';
import path from 'path';
import { DATA_DIRECTORY } from '../config/database.js';
import type {
  Category,
  Product,
  Customer,
  CustomerAddress,
  Order,
  ShippingRecord,
  Expense
} from '../types/index.js';

export class JsonRepository<T extends { id: string }> {
  private filePath: string;

  constructor(public readonly collectionName: string) {
    this.filePath = path.join(DATA_DIRECTORY, `${collectionName}.json`);
  }

  private async ensureFile(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIRECTORY, { recursive: true });
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async findAll(): Promise<T[]> {
    await this.ensureFile();
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      if (!content.trim()) return [];
      return JSON.parse(content) as T[];
    } catch (error) {
      console.error(`Error reading ${this.filePath}:`, error);
      return [];
    }
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll();
    return items.find((item) => item.id === id) || null;
  }

  async create(item: T): Promise<T> {
    const items = await this.findAll();
    items.unshift(item);
    await this.save(items);
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.findAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updates };
    await this.save(items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;

    await this.save(filtered);
    return true;
  }

  async save(items: T[]): Promise<void> {
    await this.ensureFile();
    const tempFile = `${this.filePath}.tmp.${Date.now()}`;
    await fs.writeFile(tempFile, JSON.stringify(items, null, 2), 'utf-8');
    await fs.rename(tempFile, this.filePath);
  }
}

// Repositories instances
export const categoryRepo = new JsonRepository<Category>('categories');
export const productRepo = new JsonRepository<Product>('products');
export const customerRepo = new JsonRepository<Customer>('customers');
export const addressRepo = new JsonRepository<CustomerAddress>('customer_addresses');
export const orderRepo = new JsonRepository<Order>('orders');
export const shippingRepo = new JsonRepository<ShippingRecord>('shipping');
export const expenseRepo = new JsonRepository<Expense>('expenses');
