'use client';

import Link from 'next/link';
import { PawPrint, ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';
import { Logo } from './Logo';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';

export function Footer() {
  const { t, dir } = useI18n();

  const footerLinks = [
    {
      title: t('footer.shop'),
      links: [
        { label: t('footer.electronics'), href: '/category/electronics' },
        { label: t('footer.fashion'), href: '/category/fashion' },
        { label: t('footer.homeKitchen'), href: '/category/home-kitchen' },
        { label: t('footer.beauty'), href: '/category/beauty' },
      ],
    },
    {
      title: t('footer.customerService'),
      links: [
        { label: t('footer.contactUs'), href: '#' },
        { label: t('footer.shippingInfo'), href: '#' },
        { label: t('footer.returnsExchanges'), href: '#' },
        { label: t('footer.faq'), href: '#' },
      ],
    },
    {
      title: t('footer.about'),
      links: [
        { label: t('footer.ourStory'), href: '#' },
        { label: t('footer.careers'), href: '#' },
        { label: t('footer.privacyPolicy'), href: '#' },
        { label: t('footer.termsOfService'), href: '#' },
      ],
    },
  ];

  const trustItems = [
    { icon: Truck, title: t('footer.freeShipping'), desc: t('footer.onOrdersOver') },
    { icon: RefreshCw, title: t('footer.30DayReturns'), desc: t('footer.hassleFree') },
    { icon: ShieldCheck, title: t('footer.securePayments'), desc: t('footer.encryptedCheckout') },
    { icon: Headphones, title: t('footer.247Support'), desc: t('footer.alwaysHere') },
  ];

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      {/* Trust bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustItems.map((item) => (
            <div key={item.title} className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse text-right')}>
              <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Logo showTagline />
            <p className={cn('mt-4 text-sm text-muted max-w-xs', dir === 'rtl' && 'text-right')}>
              {t('footer.aboutDesc')}
            </p>
            <div className={cn('mt-4 flex items-center gap-2', dir === 'rtl' && 'flex-row-reverse')}>
              <PawPrint className="h-5 w-5 text-gold/60" />
              <span className="text-xs text-muted">{t('footer.proudlyPowered')}</span>
            </div>
          </div>
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className={cn('text-sm font-semibold text-text mb-3', dir === 'rtl' && 'text-right')}>{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={cn('text-sm text-muted hover:text-gold transition-colors', dir === 'rtl' && 'block text-right')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={cn('mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4', dir === 'rtl' && 'sm:flex-row-reverse')}>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} The Golden Tiger. {t('footer.allRightsReserved')}
          </p>
          <p className="text-xs text-muted">
            {t('footer.builtWithCare')}
          </p>
        </div>
      </div>
    </footer>
  );
}
