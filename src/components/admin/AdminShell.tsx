'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
];

export function AdminShell({
  children,
  adminEmail,
  adminRole,
}: {
  children: React.ReactNode;
  adminEmail: string;
  adminRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface border-r border-border transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <span className="font-heading text-xl font-bold text-gold">Golden Tiger</span>
          </Link>
          <button
            className="lg:hidden text-muted hover:text-text"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'text-muted hover:text-text hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-muted truncate">{adminEmail}</p>
            <p className="text-xs text-gold">{adminRole}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted hover:text-text border border-border rounded-lg transition-colors"
            >
              <Store className="w-3 h-3" />
              Store
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 border border-danger/30 rounded-lg transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-surface sticky top-0 z-30">
          <button
            className="text-muted hover:text-text"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-heading text-lg font-bold text-gold">Admin</span>
          <div className="w-6" />
        </header>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
