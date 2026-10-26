'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ChartBar as BarChart3, Package, ShoppingCart, LogOut, Menu, X, Store, Crown, Award, Flame, MessageSquare, FileText, Briefcase, Megaphone, Share2, GalleryHorizontal } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { DEFAULT_PROGRAM_NAME, localizedProgramName, type LoyaltySettings } from '@/lib/loyalty-settings';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

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
  const { t, dir, locale } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [programSettings, setProgramSettings] = useState<LoyaltySettings>({ ...DEFAULT_PROGRAM_NAME });

  useEffect(() => {
    fetch('/api/loyalty/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.settings) setProgramSettings(d.settings); })
      .catch(() => {});
  }, []);

  const navItems = [
    { href: '/admin', label: t('admin.nav.overview'), icon: LayoutDashboard },
    { href: '/admin/analytics', label: t('admin.nav.analytics'), icon: BarChart3 },
    { href: '/admin/inventory', label: t('admin.nav.inventory'), icon: Package },
    { href: '/admin/banners', label: t('admin.nav.banners'), icon: GalleryHorizontal },
    { href: '/admin/brands', label: t('admin.nav.brands'), icon: Store },
    { href: '/admin/categories', label: t('admin.nav.categories'), icon: Package },
    { href: '/admin/coupons', label: t('admin.nav.coupons'), icon: Award },
    { href: '/admin/orders', label: t('admin.nav.orders'), icon: ShoppingCart },
    { href: '/admin/loyalty', label: t('admin.nav.loyalty'), icon: Crown },
    { href: '/admin/loyalty-tiers', label: localizedProgramName(programSettings, locale), icon: Award },
    { href: '/admin/campaigns', label: t('admin.nav.campaigns'), icon: Flame },
    { href: '/admin/reviews', label: t('admin.nav.reviews'), icon: MessageSquare },
    { href: '/admin/content', label: t('admin.nav.content'), icon: FileText },
    { href: '/admin/careers', label: t('admin.nav.careers'), icon: Briefcase },
    { href: '/admin/announcement', label: t('admin.nav.announcement'), icon: Megaphone },
    { href: '/admin/community', label: t('admin.nav.community'), icon: Share2 },
  ];

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const isRtl = dir === 'rtl';

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
        className={`fixed top-0 z-50 h-full w-64 bg-surface border-border transition-transform duration-300 lg:translate-x-0 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        } ${
          sidebarOpen
            ? 'translate-x-0'
            : isRtl
              ? 'translate-x-full'
              : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <span className="font-heading text-xl font-bold text-gold">{t('admin.title')}</span>
          </Link>
          <button
            className="lg:hidden text-muted hover:text-text"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
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
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <LanguageSwitcher />
            <ThemeSwitcher compact />
          </div>
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
              {t('admin.action.store')}
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 border border-danger/30 rounded-lg transition-colors"
            >
              <LogOut className="w-3 h-3" />
              {t('admin.action.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={isRtl ? 'lg:mr-64' : 'lg:ml-64'}>
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-surface sticky top-0 z-30">
          <button
            className="text-muted hover:text-text"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-heading text-lg font-bold text-gold">{t('admin.subtitle')}</span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeSwitcher compact />
          </div>
        </header>

        {/* Desktop top bar with switchers */}
        <div className="hidden lg:flex items-center justify-end gap-2 h-14 px-8 border-b border-border bg-surface">
          <LanguageSwitcher />
          <ThemeSwitcher compact />
        </div>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
