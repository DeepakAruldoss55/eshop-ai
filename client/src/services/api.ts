import type {
  Category,
  Product,
  Customer,
  CustomerAddress,
  Order,
  ShippingMethod,
  ShippingRecord,
  DbOverview,
  Expense,
  ExpenseStats,
  PaginatedResult
} from '../types';

const API_BASE = '/api';

export const api = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create category');
    }
    return res.json();
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update category');
    }
    return res.json();
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string; id?: string }> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete category');
    }
    return res.json();
  },

  // Products
  async getProducts(params?: {
    category?: string;
    search?: string;
    tag?: string;
    featured?: boolean;
    sort?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.tag) query.append('tag', params.tag);
    if (params?.featured) query.append('featured', 'true');
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string; id?: string }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete product');
    }
    return res.json();
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  // Customer Addresses
  async getCustomerAddresses(customerId?: string): Promise<CustomerAddress[]> {
    const url = customerId
      ? `${API_BASE}/customer-addresses?customerId=${customerId}`
      : `${API_BASE}/customer-addresses`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch customer addresses');
    return res.json();
  },

  async createCustomerAddress(address: Partial<CustomerAddress>): Promise<CustomerAddress> {
    const res = await fetch(`${API_BASE}/customer-addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address)
    });
    if (!res.ok) throw new Error('Failed to create address');
    return res.json();
  },

  // Shipping
  async getShippingMethods(): Promise<ShippingMethod[]> {
    const res = await fetch(`${API_BASE}/shipping/methods`);
    if (!res.ok) throw new Error('Failed to fetch shipping methods');
    return res.json();
  },

  async trackShipment(trackingNumber: string): Promise<ShippingRecord> {
    const res = await fetch(`${API_BASE}/shipping/track/${encodeURIComponent(trackingNumber)}`);
    if (!res.ok) throw new Error('Shipment tracking number not found');
    return res.json();
  },

  async getAllShippingRecords(): Promise<ShippingRecord[]> {
    const res = await fetch(`${API_BASE}/shipping`);
    if (!res.ok) throw new Error('Failed to fetch shipping records');
    return res.json();
  },

  // Orders
  async getOrders(customerId?: string): Promise<Order[]> {
    const url = customerId
      ? `${API_BASE}/orders?customerId=${customerId}`
      : `${API_BASE}/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async createOrder(orderPayload: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: {
      productId: string;
      title: string;
      price: number;
      quantity: number;
      image: string;
    }[];
    shippingAddress: CustomerAddress;
    shippingMethod: ShippingMethod;
    paymentMethod: string;
  }): Promise<{ order: Order; shipping: ShippingRecord }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update order status');
    }
    return res.json();
  },

  // Expenses (Admin Expense Database)
  async getExpenses(params?: {
    category?: string;
    status?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Expense[] | PaginatedResult<Expense>> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const res = await fetch(`${API_BASE}/expenses${queryString ? `?${queryString}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async getExpenseStats(): Promise<ExpenseStats> {
    const res = await fetch(`${API_BASE}/expenses/stats`);
    if (!res.ok) throw new Error('Failed to fetch expense statistics');
    return res.json();
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },

  async deleteExpense(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
  },

  // JSON Database Inspector
  async getDatabaseOverview(): Promise<DbOverview> {
    const res = await fetch(`${API_BASE}/data/all`);
    if (!res.ok) throw new Error('Failed to fetch database files');
    return res.json();
  },

  async resetDatabase(): Promise<void> {
    const res = await fetch(`${API_BASE}/data/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
  }
};

