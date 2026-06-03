'use client';

import { useState, useEffect } from 'react';
import { Package, Search, PlusCircle, Edit3, Trash2, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { formatINR, formatQuantity } from '@/lib/priceCalculator';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  baseUnit: 'g' | 'kg' | 'mL' | 'L' | 'unit';
  stockQuantity: string;
  pricePerBaseUnitPaise: number;
  isActive: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBaseUnit, setFormBaseUnit] = useState<'g' | 'mL' | 'unit'>('g');
  const [formStock, setFormStock] = useState('0');
  const [formPriceINR, setFormPriceINR] = useState('0.00');
  const [formIsActive, setFormIsActive] = useState(true);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);

      const cats: string[] = ['All'];
      data.forEach((p: Product) => {
        if (p.category && !cats.includes(p.category)) {
          cats.push(p.category);
        }
      });
      setCategories(cats);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('');
    setFormCategory('');
    setFormDescription('');
    setFormBaseUnit('g');
    setFormStock('0');
    setFormPriceINR('0.00');
    setFormIsActive(true);
    setFormError(null);
    setIsOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku || '');
    setFormCategory(p.category || '');
    setFormDescription(p.description || '');
    setFormBaseUnit(p.baseUnit as any);
    setFormStock(parseFloat(p.stockQuantity).toString());
    setFormPriceINR((p.pricePerBaseUnitPaise / 100).toFixed(2));
    setFormIsActive(p.isActive);
    setFormError(null);
    setIsOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const pricePaise = Math.round(parseFloat(formPriceINR) * 100);
    if (isNaN(pricePaise) || pricePaise < 0) {
      setFormError('Please enter a valid price.');
      setFormSubmitting(false);
      return;
    }

    const payload = {
      name: formName,
      sku: formSku || null,
      category: formCategory || null,
      description: formDescription || null,
      baseUnit: formBaseUnit,
      stockQuantity: parseFloat(formStock) || 0,
      pricePerBaseUnitPaise: pricePaise,
      isActive: formIsActive,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? (It will be soft-deleted and hidden from sellers)')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete product.');
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error deleting product.');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'All' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-400">View and update prices, stocks, and details of products in the catalog.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all duration-300"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-800 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-500/10 bg-red-500/5 text-red-400">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error Loading Catalog</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-gray-800 bg-gray-900/30 text-gray-500">
          <Package className="h-10 w-10 mb-3" />
          <p className="font-semibold text-gray-400">No Products Available</p>
          <p className="text-sm mt-1">Try creating a product or adjusting filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/20 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-gray-400">
              <thead className="border-b border-gray-800 bg-gray-900/60 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Available Stock</th>
                  <th className="px-6 py-4 text-right">Base Price (INR)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-200">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">{p.description || 'No description.'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{p.sku || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-gray-850 px-2 py-0.5 text-xs font-medium text-gray-400 border border-gray-800">
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-300">
                      {formatQuantity(p.stockQuantity, p.baseUnit)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-400">
                      {formatINR(p.pricePerBaseUnitPaise)} / {p.baseUnit}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        p.isActive 
                          ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' 
                          : 'bg-red-400/10 text-red-400 ring-red-400/20'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-blue-400 border border-transparent hover:border-gray-700 transition-all"
                          title="Edit Product"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 border border-transparent hover:border-gray-700 transition-all"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal (Add / Edit) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-200">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center space-x-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name & SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ethanol 99%"
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">SKU (Unique Code)</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. ETH-99-L"
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs uppercase"
                  />
                </div>
              </div>

              {/* Category & Base Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Solvents"
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Internal Base Unit</label>
                  <select
                    value={formBaseUnit}
                    disabled={!!editingProduct} // Cannot change base unit of existing product due to database integrity
                    onChange={(e) => setFormBaseUnit(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="g">g (Grams) - Weight</option>
                    <option value="mL">mL (Millilitres) - Volume</option>
                    <option value="unit">unit (Item Count) - Count</option>
                  </select>
                </div>
              </div>

              {/* Stock Quantity & Base Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Stock Quantity (Base Unit)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Price per Base Unit (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formPriceINR}
                    onChange={(e) => setFormPriceINR(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter product description..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none placeholder-gray-600"
                />
              </div>

              {/* Active Toggle (Edit only) */}
              {editingProduct && (
                <div className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-800 bg-gray-950 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-300">
                    Product is active and visible to sellers
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-800/80 mt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:shadow-none transition-all duration-300"
                >
                  {formSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
