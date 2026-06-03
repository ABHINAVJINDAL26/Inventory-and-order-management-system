'use client';

import { useState, useEffect } from 'react';
import { History, Loader2, Info, ChevronDown, ChevronUp, Calendar, CornerDownRight } from 'lucide-react';
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
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expandable list state
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
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

    fetchOrders();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Quotation History</h1>
        <p className="mt-1 text-sm text-gray-400">View and track the status of all your placed chemical quotations.</p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-500/10 bg-red-500/5 text-red-400">
          <Info className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error Loading Orders</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-gray-800 bg-gray-900/30 text-gray-500">
          <History className="h-10 w-10 mb-3" />
          <p className="font-semibold text-gray-400">No Quotations Found</p>
          <p className="text-sm mt-1">You haven't placed any quotations yet.</p>
        </div>
      ) : (
        /* Orders list */
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

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
                      <p className="text-sm font-semibold text-gray-300">Order ID: {order.id.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:space-x-8">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-500">Total Price</p>
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

                {/* Collapsible Order items breakdown */}
                {isExpanded && (
                  <div className="border-t border-gray-800/80 bg-gray-950/40 p-6 space-y-4">
                    {order.notes && (
                      <div className="rounded-lg bg-gray-900/60 p-3 border border-gray-800/50 text-xs text-gray-400">
                        <span className="font-semibold text-gray-300">Notes:</span> {order.notes}
                      </div>
                    )}

                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Items Breakdown</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl border border-gray-800 bg-gray-900/30 text-sm"
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

                          <div className="mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-3 gap-6 text-left md:text-right">
                            <div>
                              <p className="text-xs text-gray-500">Ordered Quantity</p>
                              <p className="font-semibold text-gray-300 mt-0.5">
                                {formatQuantity(item.orderedQuantity, item.orderedUnit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Conversion (Base Unit)</p>
                              <p className="font-semibold text-gray-400 mt-0.5">
                                {formatQuantity(item.baseQuantity, item.baseUnit)}
                              </p>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <p className="text-xs text-gray-500 font-medium">Line Total</p>
                              <p className="font-bold text-blue-400 mt-0.5">
                                {formatINR(item.lineTotalPaise)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
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
