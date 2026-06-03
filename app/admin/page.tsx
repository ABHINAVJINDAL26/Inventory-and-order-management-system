import { db } from '@/lib/db';
import { products, orders, users } from '@/drizzle/schema';
import { count, eq, sum, or } from 'drizzle-orm';
import { formatINR } from '@/lib/priceCalculator';
import Link from 'next/link';
import { Package, ShoppingCart, Users, TrendingUp, ArrowRight, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Query 1: Total products count
  const [productsCountRes] = await db.select({ value: count() }).from(products);
  const totalProducts = productsCountRes?.value || 0;

  // Query 2: Pending orders count
  const [pendingOrdersRes] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.status, 'pending'));
  const pendingOrders = pendingOrdersRes?.value || 0;

  // Query 3: Sellers count
  const [sellersRes] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, 'seller'));
  const totalSellers = sellersRes?.value || 0;

  // Query 4: Total revenue from confirmed/fulfilled orders
  const [revenueRes] = await db
    .select({ value: sum(orders.totalPaise) })
    .from(orders)
    .where(
      or(
        eq(orders.status, 'confirmed'),
        eq(orders.status, 'fulfilled')
      )
    );
  const totalRevenuePaise = parseInt(revenueRes?.value || '0', 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-500" />
          <span>Admin Control Panel</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">Overview of inventory levels, registered sellers, and pending sales orders.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Revenue</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">{formatINR(totalRevenuePaise)}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">From confirmed & fulfilled quotations.</p>
        </div>

        {/* Stat 2: Pending Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Quotations</p>
              <h3 className="text-2xl font-bold text-yellow-400 mt-1.5">{pendingOrders}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">Awaiting admin review.</p>
        </div>

        {/* Stat 3: Total Products */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catalog Size</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1.5">{totalProducts}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">Total active & inactive products.</p>
        </div>

        {/* Stat 4: Active Sellers */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered Sellers</p>
              <h3 className="text-2xl font-bold text-purple-400 mt-1.5">{totalSellers}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">Registered seller accounts.</p>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-8">
        {/* Link 1: Manage Inventory */}
        <Link
          href="/admin/products"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-gray-850 bg-gradient-to-r from-gray-900/60 to-gray-900/30 p-6 shadow-md hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-gray-200 group-hover:text-blue-400 transition-colors">Manage Product Catalog</h3>
            <p className="text-sm text-gray-500">Create new products, update stock quantities, adjust rates, and soft delete items.</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-850 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <ArrowRight className="h-5 w-5" />
          </div>
        </Link>

        {/* Link 2: Review Orders */}
        <Link
          href="/admin/orders"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-gray-850 bg-gradient-to-r from-gray-900/60 to-gray-900/30 p-6 shadow-md hover:border-yellow-500/30 transition-all duration-300"
        >
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Process Quotation Orders</h3>
            <p className="text-sm text-gray-500">Review pending orders, inspect unit conversions, snapshot rates, and confirm or reject status.</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-850 text-gray-400 group-hover:bg-yellow-500 group-hover:text-white transition-all duration-300">
            <ArrowRight className="h-5 w-5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
