import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nProvider } from '@/context/I18nContext';
import { Toaster } from 'sonner';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'The Golden Tiger | Premium Marketplace',
    template: '%s | The Golden Tiger',
  },
  description:
    'The Golden Tiger - a premium online marketplace for electronics, fashion, home goods, beauty, and more. Shop curated products with fast shipping and 30-day returns.',
  openGraph: {
    title: 'The Golden Tiger | Premium Marketplace',
    description:
      'A premium online marketplace for electronics, fashion, home goods, beauty, and more.',
    type: 'website',
    siteName: 'The Golden Tiger',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Golden Tiger | Premium Marketplace',
    description:
      'A premium online marketplace for electronics, fashion, home goods, beauty, and more.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const themeColor = '#0B0B0F';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased">
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <CartProvider>
                <PageViewTracker />
                {children}
                <Toaster
                  position="bottom-right"
                  theme="dark"
                  toastOptions={{
                    style: {
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    },
                  }}
                />
              </CartProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
