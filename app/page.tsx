'use client';

import Link from 'next/link';
import { Shield, ShoppingBag, ArrowRight, Package } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="text-center max-w-2xl space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25">
          <Package className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          AasaMedChem Portal
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">
          Welcome to the Inventory & Order Management System. Please select your access portal to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Card 1: Admin Portal */}
        <div className="group relative rounded-2xl border border-gray-800 bg-gray-900/40 p-8 shadow-2xl backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-200">Admin Portal</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Manage product listings, track real-time stock levels, review incoming quotations, perform unit conversion audits, and approve or reject purchase requests.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-8 flex items-center justify-center space-x-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all duration-300"
          >
            <span>Enter Admin Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Card 2: Seller Portal */}
        <div className="group relative rounded-2xl border border-gray-800 bg-gray-900/40 p-8 shadow-2xl backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-200">Seller Portal</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Browse the chemical and medical inventory catalog, search products by categories and SKUs, view live price previews in multiple units, and request quotes.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-8 flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all duration-300"
          >
            <span>Enter Seller Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
