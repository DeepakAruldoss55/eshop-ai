import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Category } from '../../types';
import { api } from '../../services/api';
import { PaginationControls } from './PaginationControls';
import {
  Search,
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Download,
  Star,
  Plus,
  Edit3,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

interface AdminProductsTableProps {
  onProductCountChange?: (count: number) => void;
}

interface ProductFormData {
  id: string;
  title: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  stock: string;
  featured: boolean;
  tags: string;
  image: string;
  specifications: { key: string; value: string }[];
}

const PRESET_IMAGES = [
  { label: 'Custom or Manual URL', url: '' },
  { label: 'Studio Headphones (Audio)', url: '/images/products/headphones-1.jpg' },
  { label: 'Titan Smartwatch (Wearables)', url: '/images/products/smartwatch-1.jpg' },
  { label: 'ZenPulse Earbuds (Audio)', url: '/images/products/earbuds-1.jpg' },
  { label: 'NeoBook Laptop (Computers)', url: '/images/products/laptop-1.jpg' },
  { label: 'Cinema Drone (Cameras)', url: '/images/products/drone-1.jpg' },
  { label: 'Mirrorless Camera (Cameras)', url: '/images/products/camera-1.jpg' },
  { label: 'Mechanical Keyboard (Computers)', url: '/images/products/keyboard-1.jpg' },
  { label: 'Ultrawide Curved Monitor', url: '/images/products/curved-monitor-1.jpg' },
  { label: 'Hi-Res Speaker (Audio)', url: '/images/products/speaker-1.jpg' },
  { label: 'Vital Smart Band (Wearables)', url: '/images/products/smartband-1.jpg' },
  { label: '65W GaN Fast Charger (Accessories)', url: '/images/products/charger-1.jpg' },
  { label: 'MagSafe Wireless Stand (Accessories)', url: '/images/products/magsafe-stand-1.jpg' },
  { label: 'Smart Home Hub (Smart Home)', url: '/images/products/smarthome-hub-1.jpg' },
  { label: 'Ergonomic Precision Mouse', url: '/images/products/mouse-1.jpg' }
];

const emptyFormData: ProductFormData = {
  id: '',
  title: '',
  description: '',
  price: '',
  compareAtPrice: '',
  categoryId: '',
  stock: '25',
  featured: false,
  tags: 'New Arrival, Flagship',
  image: '/images/products/headphones-1.jpg',
  specifications: [
    { key: 'Warranty', value: '1 Year Manufacturer' },
    { key: 'Condition', value: 'Brand New In Box' }
  ]
};

export const AdminProductsTable: React.FC<AdminProductsTableProps> = ({ onProductCountChange }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Pagination (ERP default 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form state for add / edit
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
      setProducts(prods);
      setCategories(cats);
      onProductCountChange?.(prods.length);
    } catch (error) {
      console.error('Failed to load products:', error);
      showNotice('Failed to load products catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setStockFilter('all');
    setSelectedSort('newest');
    setCurrentPage(1);
    fetchProductsAndCategories();
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (stockFilter === 'low') {
      result = result.filter((p) => p.stock > 0 && p.stock <= 15);
    } else if (stockFilter === 'out') {
      result = result.filter((p) => p.stock === 0);
    } else if (stockFilter === 'healthy') {
      result = result.filter((p) => p.stock > 15);
    }

    if (selectedSort === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (selectedSort === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (selectedSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === 'stock-asc') {
      result.sort((a, b) => a.stock - b.stock);
    } else if (selectedSort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [products, search, selectedCategory, stockFilter, selectedSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, stockFilter, selectedSort, pageSize]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.price * p.stock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= 15).length;
  }, [products]);

  const exportToCSV = () => {
    if (products.length === 0) return;
    const headers = ['SKU_ID,Title,Category,Price,CompareAtPrice,Stock,Rating,Reviews,CreatedDate'];
    const rows = filteredProducts.map((p) =>
      [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.categoryName}"`,
        p.price,
        p.compareAtPrice || '',
        p.stock,
        p.rating,
        p.reviewCount,
        p.createdAt.split('T')[0]
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    const defaultCat = categories[0]?.id || '';
    setFormData({
      ...emptyFormData,
      categoryId: defaultCat
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product: Product) => {
    const specs = Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value }));
    if (specs.length === 0) {
      specs.push({ key: '', value: '' });
    }

    setFormData({
      id: product.id,
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : '',
      categoryId: product.categoryId,
      stock: product.stock.toString(),
      featured: product.featured || false,
      tags: product.tags?.join(', ') || '',
      image: product.images?.[0] || '/images/products/headphones-1.jpg',
      specifications: specs
    });
    setEditingProduct(product);
  };

  // Handle Specifications change in Form
  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const handleAddSpecRow = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: '', value: '' }]
    });
  };

  const handleRemoveSpecRow = (index: number) => {
    const newSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      specifications: newSpecs.length > 0 ? newSpecs : [{ key: '', value: '' }]
    });
  };

  // Create Product Submit Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotice('Product title is required', 'error');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showNotice('Please enter a valid unit price greater than $0', 'error');
      return;
    }
    if (!formData.categoryId) {
      showNotice('Please select a department category', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // Build specifications object
      const specObj: Record<string, string> = {};
      formData.specifications.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specObj[s.key.trim()] = s.value.trim();
        }
      });

      const parsedTags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<Product> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: priceNum,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        categoryId: formData.categoryId,
        stock: Math.max(0, parseInt(formData.stock, 10) || 0),
        featured: formData.featured,
        tags: parsedTags.length > 0 ? parsedTags : ['New Arrival'],
        images: [formData.image.trim() || '/images/products/headphones-1.jpg'],
        specifications: specObj
      };

      if (formData.id.trim()) {
        payload.id = formData.id.trim();
      }

      const created = await api.createProduct(payload);
      setIsAddModalOpen(false);
      showNotice(`SKU "${created.id}" (${created.title}) added to inventory`);
      fetchProductsAndCategories();
    } catch (error: any) {
      console.error('Failed to create product:', error);
      showNotice(error.message || 'Failed to create product SKU', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Product Submit Handler
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!formData.title.trim()) {
      showNotice('Product title is required', 'error');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showNotice('Please enter a valid unit price greater than $0', 'error');
      return;
    }
    if (!formData.categoryId) {
      showNotice('Please select a department category', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const specObj: Record<string, string> = {};
      formData.specifications.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specObj[s.key.trim()] = s.value.trim();
        }
      });

      const parsedTags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updates: Partial<Product> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: priceNum,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        categoryId: formData.categoryId,
        stock: Math.max(0, parseInt(formData.stock, 10) || 0),
        featured: formData.featured,
        tags: parsedTags,
        images: [formData.image.trim() || '/images/products/headphones-1.jpg'],
        specifications: specObj
      };

      await api.updateProduct(editingProduct.id, updates);
      setEditingProduct(null);
      showNotice(`SKU "${editingProduct.id}" updated successfully`);
      fetchProductsAndCategories();
    } catch (error: any) {
      console.error('Failed to update product:', error);
      showNotice(error.message || 'Failed to update product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Product Handler
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      setSubmitting(true);
      await api.deleteProduct(deletingProduct.id);
      showNotice(`SKU "${deletingProduct.id}" deleted from ledger`);
      setDeletingProduct(null);
      fetchProductsAndCategories();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      showNotice(error.message || 'Failed to delete product SKU', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification Alert */}
      {actionMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-3.5 py-2.5 rounded shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-rose-900 text-rose-100 border border-rose-700'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Top ERP KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Catalog SKUs
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{products.length} Items</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active retail listings</div>
          </div>
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Inventory Valuation
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Current stock × unit price</div>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Warnings
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">{lowStockCount} SKUs</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Stock balance &le; 15 units</div>
          </div>
          <div className="w-9 h-9 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Featured Flagships
            </div>
            <div className="text-xl font-bold font-mono text-blue-700 mt-1">
              {products.filter((p) => p.featured).length} Items
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Promoted storefront catalog</div>
          </div>
          <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Package className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main ERP Table Box */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Action & Filter Toolbar */}
        <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Product Master & Stock Ledger</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 text-slate-700">
              {totalItems} items
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[190px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, title, tags..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white text-slate-800 placeholder-slate-400 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="product-search-input"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="product-category-filter"
            >
              <option value="all">All Departments</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="product-stock-filter"
            >
              <option value="all">All Stock Status</option>
              <option value="healthy">In Stock (&gt; 15)</option>
              <option value="low">Low Stock (&le; 15)</option>
              <option value="out">Out of Stock (0)</option>
            </select>

            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="product-sort-select"
            >
              <option value="newest">Added (Newest)</option>
              <option value="price-low">Price (Low–High)</option>
              <option value="price-high">Price (High–Low)</option>
              <option value="rating">Rating (Highest)</option>
              <option value="stock-asc">Stock (Lowest First)</option>
              <option value="title">Title (A–Z)</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-xs font-medium transition-colors shadow-sm"
              title="Export Inventory to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {/* Reset Filters & Refresh */}
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
              title="Reset Filters & Refresh"
              id="product-reset-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>

            {/* Add New Product SKU Button */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition-colors shadow-sm"
              id="add-product-modal-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Product SKU</span>
            </button>
          </div>
        </div>

        {/* Dense ERP Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="admin-products-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-24">SKU Code</th>
                <th className="py-2.5 px-3.5">Product Title & Specifications</th>
                <th className="py-2.5 px-3.5">Department</th>
                <th className="py-2.5 px-3.5 text-right">Unit Price</th>
                <th className="py-2.5 px-3.5 text-center">In-Stock Balance</th>
                <th className="py-2.5 px-3.5">Customer Rating</th>
                <th className="py-2.5 px-3.5">Catalog Tags</th>
                <th className="py-2.5 px-3.5 text-right">Date Added</th>
                <th className="py-2.5 px-3.5 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <p className="mb-2">No products match the selected criteria.</p>
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm"
                      id="product-empty-reset-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/50 transition-colors">
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-700">
                      {product.id}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="max-w-xs">
                          <div className="font-semibold text-slate-900 truncate" title={product.title}>
                            {product.title}
                          </div>
                          {product.featured && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Featured Item
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {product.categoryName}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                      ${Number(product.price).toFixed(2)}
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div className="text-[10px] text-slate-400 line-through font-normal">
                          ${product.compareAtPrice.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                          product.stock > 15
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : product.stock > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {product.reviewCount > 0 && product.rating > 0 ? (
                        <div className="flex items-center space-x-1 text-slate-700">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span className="font-semibold text-xs">{Number(product.rating).toFixed(1)}</span>
                          <span className="text-[11px] text-slate-400">({product.reviewCount})</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-slate-400 text-xs">
                          <Star className="w-3 h-3 text-slate-300" />
                          <span className="text-slate-500 text-[11px]">Unrated</span>
                          <span className="text-[10px] text-slate-400">(0)</span>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {product.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono text-slate-600 text-[11px]">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions Column */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setViewingProduct(product)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="View Product Specifications"
                          id={`view-prod-${product.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit SKU"
                          id={`edit-prod-${product.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete SKU"
                          id={`delete-prod-${product.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standard ERP Pagination */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          itemName="SKUs"
        />
      </div>

      {/* ===================== ADD / EDIT PRODUCT MODAL ===================== */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-2xl bg-white border border-slate-300 rounded-lg shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingProduct ? `Edit Product SKU: ${editingProduct.id}` : 'Register New Product SKU'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {editingProduct
                      ? 'Modify inventory specs, pricing, and storefront catalog settings'
                      : 'Create a new stock-keeping unit in the enterprise master ledger'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="p-5 space-y-4 text-xs">
              {/* Row 1: SKU & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="flex items-center justify-between text-slate-700 font-semibold mb-1 text-xs">
                    <span>SKU Code</span>
                    {!editingProduct && <span className="font-normal text-slate-400 text-[10px]">Optional</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!!editingProduct}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. prod_015"
                    className={`w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono h-8 ${
                      editingProduct ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:outline-none focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center text-slate-700 font-semibold mb-1 text-xs">
                    <span>Product Title</span>
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Quantum Studio Wireless Headphones"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium h-8"
                    id="product-form-title"
                  />
                </div>
              </div>

              {/* Row 2: Department & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    Department Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer shadow-sm bg-white h-8"
                    id="product-form-category"
                  >
                    <option value="" disabled>Select Department</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center h-8 px-3 rounded border border-slate-200 bg-slate-50/70">
                  <label className="inline-flex items-center space-x-2 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      id="product-form-featured"
                    />
                    <span className="text-slate-800 font-semibold text-xs truncate">
                      Promote as Featured Flagship item
                    </span>
                  </label>
                </div>
              </div>

              {/* Row 3: Pricing & Inventory */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    Unit Price ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 h-8">
                    <span className="inline-flex items-center px-2.5 bg-slate-100 border-r border-slate-200 text-slate-500 font-mono text-xs select-none">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="199.99"
                      className="flex-1 px-2.5 py-1.5 focus:outline-none text-xs font-mono font-semibold"
                      id="product-form-price"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    Compare-at / MSRP ($) <span className="text-slate-400 font-normal text-[10px]">(optional)</span>
                  </label>
                  <div className="flex rounded border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 h-8">
                    <span className="inline-flex items-center px-2.5 bg-slate-100 border-r border-slate-200 text-slate-500 font-mono text-xs select-none">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.compareAtPrice}
                      onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                      placeholder="249.99"
                      className="flex-1 px-2.5 py-1.5 focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    In-Stock Balance <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono font-semibold h-8"
                    id="product-form-stock"
                  />
                </div>
              </div>

              {/* Row 4: Image Picker & Live Preview */}
              <div>
                <label className="flex items-center justify-between text-slate-700 font-semibold mb-1 text-xs">
                  <span>Product Image Asset</span>
                  <span className="font-normal text-slate-400 text-[10px]">Preset or Custom URL</span>
                </label>
                <div className="p-3 bg-slate-50/80 rounded border border-slate-200 space-y-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded border border-slate-300 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({ ...formData, image: e.target.value });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white text-slate-700 cursor-pointer h-8 shadow-sm"
                      >
                        {PRESET_IMAGES.map((p, idx) => (
                          <option key={idx} value={p.url}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="/images/products/... or https://..."
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono h-8 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Tags */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Catalog Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. Best Seller, ANC, Wireless, 4K"
                    className="w-full pl-8 pr-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Row 6: Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive technical specifications and merchandise summary..."
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Row 7: Specifications Key-Values */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-semibold flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Technical Specifications</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Spec Property</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                        placeholder="Feature (e.g. Battery)"
                        className="w-1/3 px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                        placeholder="Value (e.g. Up to 45 hours)"
                        className="flex-1 px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Remove Spec"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50 text-xs"
                  id="save-product-submit-btn"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving SKU...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Product SKU' : 'Register Product SKU'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-rose-50/70 border-b border-rose-100 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-950">Confirm SKU Catalog Deletion</h4>
                <p className="text-[11px] text-rose-700">Permanent inventory write-off</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p>
                Are you sure you want to permanently delete the following SKU from the product master ledger?
              </p>

              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center space-x-3">
                <div className="w-10 h-10 rounded border border-slate-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {deletingProduct.images && deletingProduct.images[0] ? (
                    <img
                      src={deletingProduct.images[0]}
                      alt={deletingProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{deletingProduct.title}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    SKU: {deletingProduct.id} • ${deletingProduct.price.toFixed(2)} • {deletingProduct.stock} units
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Warning:</strong> Deleting this item will remove it from the storefront catalog and inventory valuation records immediately.
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={submitting}
                className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50 text-xs"
                id="confirm-delete-product-btn"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting SKU...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product SKU</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW PRODUCT SPECIFICATIONS MODAL ===================== */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-xl bg-white border border-slate-300 rounded-lg shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {viewingProduct.id}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-600">{viewingProduct.categoryName}</span>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 rounded border border-slate-200 bg-slate-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {viewingProduct.images && viewingProduct.images[0] ? (
                    <img
                      src={viewingProduct.images[0]}
                      alt={viewingProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 leading-tight">{viewingProduct.title}</h3>
                  <div className="mt-2 flex items-center space-x-3">
                    <span className="text-lg font-bold font-mono text-slate-900">
                      ${viewingProduct.price.toFixed(2)}
                    </span>
                    {viewingProduct.compareAtPrice && viewingProduct.compareAtPrice > viewingProduct.price && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        ${viewingProduct.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        viewingProduct.stock > 15
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : viewingProduct.stock > 0
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}
                    >
                      {viewingProduct.stock} units in stock
                    </span>
                  </div>

                  <div className="mt-2 flex items-center space-x-2">
                    {viewingProduct.reviewCount > 0 && viewingProduct.rating > 0 ? (
                      <div className="flex items-center space-x-1 text-slate-700">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-semibold">{Number(viewingProduct.rating).toFixed(1)}</span>
                        <span className="text-slate-400">({viewingProduct.reviewCount} reviews)</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-slate-400 text-xs">
                        <Star className="w-3.5 h-3.5 text-slate-300" />
                        <span className="font-medium text-slate-500">No customer reviews yet</span>
                      </div>
                    )}
                    {viewingProduct.featured && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Featured Flagship
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">Description</h5>
                <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                  {viewingProduct.description || 'No description provided.'}
                </p>
              </div>

              {viewingProduct.tags && viewingProduct.tags.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1.5">Catalog Tags</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProduct.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1.5">
                  Technical Specifications
                </h5>
                {Object.keys(viewingProduct.specifications || {}).length > 0 ? (
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-slate-200">
                        {Object.entries(viewingProduct.specifications).map(([key, value]) => (
                          <tr key={key} className="even:bg-slate-50/50">
                            <td className="px-3 py-1.5 font-semibold text-slate-600 w-1/3 bg-slate-50/70 border-r border-slate-200">
                              {key}
                            </td>
                            <td className="px-3 py-1.5 text-slate-800 font-mono text-[11px]">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-xs">No specifications recorded.</p>
                )}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Added: {new Date(viewingProduct.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingProduct;
                    setViewingProduct(null);
                    handleOpenEditModal(prod);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit SKU</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
