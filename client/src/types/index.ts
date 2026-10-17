export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount?: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  categoryName: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  tags: string[];
  specifications: Record<string, string>;
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDeliveryDays: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  shippingAddress: CustomerAddress;
  shippingMethod: ShippingMethod;
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  status: 'open' | 'pending' | 'processing' | 'shipped' | 'on_the_way' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  trackingNumber?: string;
}

export interface ShippingUpdate {
  status: string;
  location: string;
  message: string;
  timestamp: string;
}

export interface ShippingRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered';
  estimatedDeliveryDate: string;
  updates: ShippingUpdate[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  recurring: 'Monthly' | 'One-time' | 'Quarterly' | 'Yearly';
  paymentMethod: string;
  status: 'Paid' | 'Pending' | 'Scheduled';
  receiptRef?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseStats {
  totalExpenseAmount: number;
  totalExpenseCount: number;
  byCategory: Record<string, { count: number; total: number }>;
  byStatus: Record<string, { count: number; total: number }>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DbOverview {
  timestamp: string;
  summary: {
    categoriesCount: number;
    productsCount: number;
    customersCount: number;
    customerAddressesCount: number;
    ordersCount: number;
    shippingRecordsCount: number;
    expensesCount?: number;
  };
  files: {
    categories: Category[];
    products: Product[];
    customers: Customer[];
    customer_addresses: CustomerAddress[];
    orders: Order[];
    shipping: ShippingRecord[];
    expenses?: Expense[];
  };
}

