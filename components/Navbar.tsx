'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Package, ShoppingCart, Shield, History, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session || !session.user) return null;

  const role = (session.user as any).role;
  const name = session.user.name || 'User';

  const isAdmin = role === 'admin';

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
    }`;
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Package className="h-5 w-5" />
            </div>
            <Link href={isAdmin ? '/admin' : '/seller'} className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              AasaMedChem
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {isAdmin ? (
              <>
                <Link href="/admin" className={linkClass('/admin')}>
                  <Shield className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/admin/products" className={linkClass('/admin/products')}>
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </Link>
                <Link href="/admin/orders" className={linkClass('/admin/orders')}>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Quotations</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/seller" className={linkClass('/seller')}>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Browse Products</span>
                </Link>
                <Link href="/seller/orders" className={linkClass('/seller/orders')}>
                  <History className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
              </>
            )}
          </div>

          {/* Profile & LogOut Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 border-l border-gray-800 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-gray-300">{name}</p>
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                  isAdmin 
                    ? 'bg-purple-400/10 text-purple-400 ring-purple-400/20' 
                    : 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'
                }`}>
                  {role.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all duration-300"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex md:hidden items-center justify-center space-x-4 pb-3 border-t border-gray-900 pt-2">
          {isAdmin ? (
            <>
              <Link href="/admin" className={linkClass('/admin')}>
                <span>Dashboard</span>
              </Link>
              <Link href="/admin/products" className={linkClass('/admin/products')}>
                <span>Inventory</span>
              </Link>
              <Link href="/admin/orders" className={linkClass('/admin/orders')}>
                <span>Quotations</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/seller" className={linkClass('/seller')}>
                <span>Browse</span>
              </Link>
              <Link href="/seller/orders" className={linkClass('/seller/orders')}>
                <span>Orders</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
