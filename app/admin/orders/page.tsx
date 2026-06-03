'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Info, ChevronDown, ChevronUp, Check, X, Truck, User, Calendar, CornerDownRight, AlertCircle, RefreshCw } from 'lucide-react';
import { formatINR, formatQuantity } from '@/lib/priceCalculator';

interface OrderItem {
  id: string;
  productId: string;
  orderedUnit: string;
  orderedQuantity: string;
  baseUnit: string;
  baseQuantity: string;
  unitPricePaise: number;
  lineTotalPaise: number;
  product: {
    name: string;
    sku: string | null;
  };
}

interface Order {
  id: string;
  sellerId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'fulfilled';
  totalPaise: number;
  notes: string | null;
  createdAt: string;
  seller: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expandable list state
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Status transition loading state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to load orders.');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    setUpdatingId(id);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status.');
      }

      // Update local state
      setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    } catch (err: any) {
      setUpdateError(err.message || 'Error updating order status.');
      // Keep expanded if error occurs so they see the message
      setExpandedOrder(id);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
    setUpdateError(null);
  };

  const getStatusBadge = (status: Order['status']) => {
    const styles = {
      pending: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/25',
      confirmed: 'bg-blue-400/10 text-blue-400 ring-blue-400/25',
      rejected: 'bg-red-400/10 text-red-400 ring-red-400/25',
      fulfilled: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/25',
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      order.seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Incoming Quotations</h1>
        <p className="mt-1 text-sm text-gray-400">Review pending quotes, verify unit conversions, snapshot prices, and confirm orders.</p>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
            <User className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by seller name or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-800 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-500/10 bg-red-500/5 text-red-400">
          <Info className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error Loading Quotations</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-gray-800 bg-gray-900/30 text-gray-500">
          <ShoppingBag className="h-10 w-10 mb-3" />
          <p className="font-semibold text-gray-400">No Quotations Found</p>
          <p className="text-sm mt-1">No orders matched your search filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40 transition-all duration-300"
              >
                {/* Accordion Trigger Header */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-6 cursor-pointer hover:bg-gray-800/20 transition-all space-y-4 md:space-y-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 text-gray-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-gray-300">ID: {order.id.slice(0, 8)}...</p>
                        <span className="text-xs text-gray-600">•</span>
                        <p className="text-xs font-semibold text-gray-400">{order.seller.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:space-x-8">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-500">Quotation Total</p>
                      <p className="text-base font-bold text-blue-400 mt-0.5">{formatINR(order.totalPaise)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(order.status)}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Collapsible details body */}
                {isExpanded && (
                  <div className="border-t border-gray-800/80 bg-gray-950/40 p-6 space-y-5">
                    {/* Error Alerts */}
                    {updateError && (
                      <div className="flex items-center space-x-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                        <span>{updateError}</span>
                      </div>
                    )}

                    {/* Metadata details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="rounded-xl bg-gray-900/60 p-4 border border-gray-800/50 space-y-1.5">
                        <p className="text-gray-500 font-semibold uppercase tracking-wider">Seller Information</p>
                        <p className="text-gray-300 font-medium">{order.seller.name}</p>
                        <p className="text-gray-400">{order.seller.email}</p>
                      </div>

                      {order.notes && (
                        <div className="rounded-xl bg-gray-900/60 p-4 border border-gray-800/50 space-y-1.5">
                          <p className="text-gray-500 font-semibold uppercase tracking-wider">Seller's Notes</p>
                          <p className="text-gray-300">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Items Breakdown list */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Conversion & Pricing Breakdown</h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/30 text-sm space-y-4 lg:space-y-0"
                          >
                            <div className="flex items-start space-x-3">
                              <CornerDownRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-200">{item.product.name}</p>
                                {item.product.sku && (
                                  <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {item.product.sku}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left lg:text-right text-xs">
                              <div>
                                <p className="text-gray-500">Ordered Quantity</p>
                                <p className="font-semibold text-gray-300 mt-0.5">
                                  {formatQuantity(item.orderedQuantity, item.orderedUnit)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Base Unit Math</p>
                                <p className="font-semibold text-gray-400 mt-0.5">
                                  {formatQuantity(item.baseQuantity, item.baseUnit)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Price Snapshot</p>
                                <p className="font-semibold text-gray-400 mt-0.5">
                                  {formatINR(item.unitPricePaise)} / {item.baseUnit}
                                </p>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <p className="text-gray-500 font-medium">Line Total</p>
                                <p className="font-bold text-blue-400 mt-0.5">
                                  {formatINR(item.lineTotalPaise)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-800/80">
                      {isUpdating ? (
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <span>Updating status...</span>
                        </div>
                      ) : (
                        <>
                          {/* Confirm Button */}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'confirmed')}
                              className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 px-3.5 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Confirm Quotation</span>
                            </button>
                          )}

                          {/* Fulfil Button */}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'fulfilled')}
                              className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Mark as Fulfilled</span>
                            </button>
                          )}

                          {/* Reject Button */}
                          {order.status !== 'rejected' && order.status !== 'fulfilled' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'rejected')}
                              className="inline-flex items-center space-x-1.5 rounded-lg bg-red-600/10 border border-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject Quotation</span>
                            </button>
                          )}

                          {/* Re-open Rejected Button */}
                          {order.status === 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'pending')}
                              className="inline-flex items-center space-x-1.5 rounded-lg bg-yellow-600/10 border border-yellow-500/20 px-3.5 py-2 text-xs font-semibold text-yellow-400 hover:bg-yellow-600 hover:text-white transition-all"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Restore to Pending</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
