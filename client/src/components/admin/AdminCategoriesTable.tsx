import React, { useState, useEffect, useMemo } from 'react';
import type { Category } from '../../types';
import { api } from '../../services/api';
import { PaginationControls } from './PaginationControls';
import {
  Search,
  FolderTree,
  RefreshCw,
  Package,
  Download,
  Plus,
  Edit3,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

interface AdminCategoriesTableProps {
  onCategoryCountChange?: (count: number) => void;
}

interface CategoryFormData {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

const PRESET_CATEGORY_IMAGES = [
  { label: 'Custom URL or Manual Input', url: '' },
  { label: 'Electronics & Smart Devices', url: '/images/categories/electronics.jpg' },
  { label: 'Audio & Acoustics', url: '/images/categories/audio.jpg' },
  { label: 'Computing & Workstations', url: '/images/categories/computing.jpg' },
  { label: 'Photography & Cinema', url: '/images/categories/photography.jpg' },
  { label: 'Smart Wearables & Health', url: '/images/categories/wearables.jpg' },
  { label: 'Minimal Accessories', url: '/images/categories/accessories.jpg' }
];

const emptyFormData: CategoryFormData = {
  id: '',
  name: '',
  slug: '',
  description: '',
  image: '/images/categories/electronics.jpg'
};

export const AdminCategoriesTable: React.FC<AdminCategoriesTableProps> = ({ onCategoryCountChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');

  // Pagination (ERP default 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form data for add / edit
  const [formData, setFormData] = useState<CategoryFormData>(emptyFormData);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
      onCategoryCountChange?.(data.length);
    } catch (error) {
      console.error('Failed to load categories:', error);
      showNotice('Failed to load departments ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setSortOrder('name-asc');
    setCurrentPage(1);
    fetchCategories();
  };

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'products-desc') {
      result.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
    } else if (sortOrder === 'products-asc') {
      result.sort((a, b) => (a.productCount || 0) - (b.productCount || 0));
    }

    return result;
  }, [categories, search, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, pageSize]);

  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const totalProducts = categories.reduce((acc, c) => acc + (c.productCount || 0), 0);

  const exportToCSV = () => {
    if (categories.length === 0) return;
    const headers = ['CategoryID,Name,Slug,ProductCount,Description'];
    const rows = filteredCategories.map((c) =>
      [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        c.slug,
        c.productCount || 0,
        `"${c.description.replace(/"/g, '""')}"`
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `categories_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData(emptyFormData);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (category: Category) => {
    setFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '/images/categories/electronics.jpg'
    });
    setEditingCategory(category);
  };

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice('Department name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<Category> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image.trim() || '/images/categories/electronics.jpg'
      };

      if (formData.id.trim()) {
        payload.id = formData.id.trim();
      }
      if (formData.slug.trim()) {
        payload.slug = formData.slug.trim();
      }

      const created = await api.createCategory(payload);
      setIsAddModalOpen(false);
      showNotice(`Department "${created.name}" created successfully`);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to create category:', error);
      showNotice(error.message || 'Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Category Handler
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!formData.name.trim()) {
      showNotice('Department name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const updates: Partial<Category> = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim(),
        image: formData.image.trim() || '/images/categories/electronics.jpg'
      };

      await api.updateCategory(editingCategory.id, updates);
      setEditingCategory(null);
      showNotice(`Department "${formData.name.trim()}" updated successfully`);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      showNotice(error.message || 'Failed to update department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Category Handler
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      setSubmitting(true);
      await api.deleteCategory(deletingCategory.id);
      showNotice(`Department "${deletingCategory.name}" removed from ledger`);
      setDeletingCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      showNotice(error.message || 'Failed to delete department', 'error');
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Departments
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{categories.length} Units</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Merchandise classifications</div>
          </div>
          <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <FolderTree className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Catalog SKUs
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{totalProducts} SKUs</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across active store catalog</div>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Avg SKUs / Department
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {categories.length > 0 ? (totalProducts / categories.length).toFixed(1) : 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Catalog distribution density</div>
          </div>
          <div className="w-9 h-9 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <FolderTree className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main ERP Table Box */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Categories & Departments Master</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 text-slate-700">
              {totalItems} departments
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search department, slug..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white text-slate-800 placeholder-slate-400 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="category-search-input"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              id="category-sort-select"
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="products-desc">SKU Count (High–Low)</option>
              <option value="products-asc">SKU Count (Low–High)</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-xs font-medium transition-colors shadow-sm"
              title="Export Categories to CSV"
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
              id="category-reset-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>

            {/* Add New Department Button */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition-colors shadow-sm"
              id="add-category-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Department</span>
            </button>
          </div>
        </div>

        {/* Dense ERP Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="admin-categories-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 whitespace-nowrap w-32">Department Code</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Department Name</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Slug Key</th>
                <th className="py-2.5 px-3.5">Scope & Description</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap text-center w-32">Assigned SKUs</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading categories...
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <p className="mb-2">No departments match your search.</p>
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm"
                      id="category-empty-reset-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category) => (
                  <tr key={category.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/50 transition-colors">
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-700">
                      {category.id}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <FolderTree className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-900">{category.name}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      /{category.slug}
                    </td>

                    <td className="py-2.5 px-3.5 text-slate-600 max-w-md">
                      <p className="line-clamp-2 leading-relaxed text-[11px]">{category.description}</p>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center font-mono">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {category.productCount || 0} SKUs
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setViewingCategory(category)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="View Department Overview"
                          id={`view-cat-${category.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(category)}
                          className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Department"
                          id={`edit-cat-${category.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(category)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Department"
                          id={`delete-cat-${category.id}`}
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
          pageSizeOptions={[5, 10, 20]}
          itemName="departments"
        />
      </div>

      {/* ===================== ADD / EDIT DEPARTMENT MODAL ===================== */}
      {(isAddModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-lg bg-white border border-slate-300 rounded-lg shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingCategory ? `Edit Department: ${editingCategory.name}` : 'Register New Merchandise Department'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {editingCategory
                      ? 'Modify category classifications, URL slug, and scope details'
                      : 'Create a new catalog classification division in enterprise master'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCategory(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="p-5 space-y-4 text-xs">
              {/* Row 1: Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="flex items-center justify-between text-slate-700 font-semibold mb-1 text-xs">
                    <span>Department Code</span>
                    {!editingCategory && <span className="font-normal text-slate-400 text-[10px]">Optional</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!!editingCategory}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. cat_gaming"
                    className={`w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono h-8 ${
                      editingCategory ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:outline-none focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center text-slate-700 font-semibold mb-1 text-xs">
                    <span>Department Name</span>
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setFormData({
                        ...formData,
                        name: newName,
                        slug: !editingCategory || !formData.slug ? autoSlug : formData.slug
                      });
                    }}
                    placeholder="e.g. Smart Home & Automation"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium h-8"
                    id="category-form-name"
                  />
                </div>
              </div>

              {/* Row 2: Slug */}
              <div>
                <label className="flex items-center justify-between text-slate-700 font-semibold mb-1 text-xs">
                  <span>URL Slug Key</span>
                  <span className="font-normal text-slate-400 text-[10px]">Auto-generated from name</span>
                </label>
                <div className="flex rounded border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 h-8">
                  <span className="inline-flex items-center px-2.5 bg-slate-100 border-r border-slate-200 text-slate-500 font-mono text-xs select-none">
                    /
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="smart-home"
                    className="flex-1 px-2.5 py-1.5 focus:outline-none text-xs font-mono text-slate-800"
                    id="category-form-slug"
                  />
                </div>
              </div>

              {/* Row 3: Image Picker & Live Preview */}
              <div>
                <label className="flex items-center justify-between text-slate-700 font-semibold mb-1 text-xs">
                  <span>Department Icon / Visual Asset</span>
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
                        value={PRESET_CATEGORY_IMAGES.some((p) => p.url === formData.image) ? formData.image : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({ ...formData, image: e.target.value });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white text-slate-700 cursor-pointer h-8 shadow-sm"
                      >
                        {PRESET_CATEGORY_IMAGES.map((p, idx) => (
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
                      placeholder="Or enter custom URL (/images/categories/... or https://...)"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono h-8 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Scope & Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">Scope & Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of product classifications, sub-categories, and merchandise handled by this department..."
                  className="w-full px-2.5 py-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs leading-relaxed"
                  id="category-form-description"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                  }}
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors text-xs h-8"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50 text-xs h-8"
                  id="save-category-submit-btn"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Department...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Update Department' : 'Register Department'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deletingCategory && (
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
                <h4 className="text-sm font-bold text-rose-950">Confirm Department Deletion</h4>
                <p className="text-[11px] text-rose-700">Permanent category ledger removal</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p>
                Are you sure you want to delete the following department classification from the enterprise master?
              </p>

              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center space-x-3">
                <div className="w-10 h-10 rounded border border-slate-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {deletingCategory.image ? (
                    <img
                      src={deletingCategory.image}
                      alt={deletingCategory.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FolderTree className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{deletingCategory.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Code: {deletingCategory.id} • /{deletingCategory.slug}
                  </div>
                </div>
              </div>

              {(deletingCategory.productCount || 0) > 0 ? (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                  <strong>Warning:</strong> This department currently has{' '}
                  <span className="font-bold font-mono">{deletingCategory.productCount} active catalog SKUs</span>{' '}
                  assigned to it. Deleting this category will leave these items uncategorized on the storefront.
                </div>
              ) : (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  <strong>Notice:</strong> This action cannot be undone. This department classification will be removed immediately.
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
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
                id="confirm-delete-category-btn"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Department</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW DEPARTMENT OVERVIEW MODAL ===================== */}
      {viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-lg bg-white border border-slate-300 rounded-lg shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {viewingCategory.id}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="font-mono text-xs text-slate-500">/{viewingCategory.slug}</span>
              </div>
              <button
                onClick={() => setViewingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded border border-slate-200 bg-slate-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {viewingCategory.image ? (
                    <img
                      src={viewingCategory.image}
                      alt={viewingCategory.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FolderTree className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 leading-tight">{viewingCategory.name}</h3>
                  <div className="mt-2 flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {viewingCategory.productCount || 0} Assigned SKUs
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">Key: /{viewingCategory.slug}</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                  Scope & Merchandise Description
                </h5>
                <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {viewingCategory.description || 'No detailed scope description provided.'}
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Classification Active</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewingCategory(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cat = viewingCategory;
                    setViewingCategory(null);
                    handleOpenEditModal(cat);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Department</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
