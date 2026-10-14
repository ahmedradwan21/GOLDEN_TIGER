import Link from 'next/link';
import { PawPrint, ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';
import { Logo } from './Logo';

const footerLinks = [
  {
    title: 'Shop',
    links: [
      { label: 'Electronics', href: '/category/electronics' },
      { label: 'Fashion', href: '/category/fashion' },
      { label: 'Home & Kitchen', href: '/category/home-kitchen' },
      { label: 'Beauty', href: '/category/beauty' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '#' },
      { label: 'Shipping Info', href: '#' },
      { label: 'Returns & Exchanges', href: '#' },
      { label: 'FAQ', href: '#' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      {/* Trust bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
            { icon: RefreshCw, title: '30-Day Returns', desc: 'Hassle-free returns' },
            { icon: ShieldCheck, title: 'Secure Payments', desc: 'Encrypted checkout' },
            { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
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
            <p className="mt-4 text-sm text-muted max-w-xs">
              The Golden Tiger is your premium marketplace for curated products
              across electronics, fashion, home, and more.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-gold/60" />
              <span className="text-xs text-muted">Proudly powered by The Golden Tiger</span>
            </div>
          </div>
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-text mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} The Golden Tiger. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Built with care for premium shoppers.
          </p>
        </div>
      </div>
    </footer>
  );
}
