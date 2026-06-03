'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingBag, Loader2, Info } from 'lucide-react';
import OrderForm from '@/components/OrderForm';
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
}

export default function SellerBrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);

  // Order modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to load products.');
      const data = await res.json();
      setProducts(data);

      // Extract unique categories
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

  // Filtered products list
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Browse Inventory</h1>
          <p className="mt-1 text-sm text-gray-400">Search and request pricing quotations for chemical & pharmaceutical supplies.</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
        {/* Search */}
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

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm flex items-center space-x-1">
            <Filter className="h-4 w-4" />
            <span>Category:</span>
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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

      {/* Loading state */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-500/10 bg-red-500/5 text-red-400">
          <Info className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error Loading Products</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-gray-800 bg-gray-900/30 text-gray-500">
          <ShoppingBag className="h-10 w-10 mb-3" />
          <p className="font-semibold text-gray-400">No Products Found</p>
          <p className="text-sm mt-1">Try resetting your search query or category filters.</p>
        </div>
      ) : (
        /* Grid of Product Cards */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const hasStock = parseFloat(product.stockQuantity) > 0;
            return (
              <div
                key={product.id}
                className="flex flex-col rounded-2xl border border-gray-800/80 bg-gray-900/40 p-6 shadow-md hover:border-gray-700/80 hover:shadow-lg transition-all duration-300"
              >
                {/* Product Name & Category */}
                <div className="flex-1">
                  <div className="flex items-start justify-between space-x-2">
                    <h3 className="font-semibold text-gray-200 text-lg line-clamp-1">{product.name}</h3>
                    <span className="inline-flex shrink-0 items-center rounded-md bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20">
                      {product.category || 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {product.sku || 'N/A'}</p>
                  
                  <p className="text-sm text-gray-400 mt-4 line-clamp-2 min-h-[40px]">
                    {product.description || 'No description available.'}
                  </p>
                </div>

                {/* Stock & Price */}
                <div className="mt-6 border-t border-gray-800/80 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Available Stock</span>
                    <span className={`font-semibold ${hasStock ? 'text-gray-300' : 'text-red-500'}`}>
                      {hasStock ? formatQuantity(product.stockQuantity, product.baseUnit) : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Unit Price</span>
                    <span className="font-semibold text-blue-400">
                      {formatINR(product.pricePerBaseUnitPaise)} / {product.baseUnit}
                    </span>
                  </div>

                  {/* Order Button */}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    disabled={!hasStock}
                    className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-blue-600/10 border border-blue-500/20 px-4 py-2.5 text-sm font-semibold text-blue-400 hover:bg-blue-600 hover:text-white disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent transition-all duration-300"
                  >
                    <span>Place Quotation</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Modal Form */}
      <OrderForm
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
