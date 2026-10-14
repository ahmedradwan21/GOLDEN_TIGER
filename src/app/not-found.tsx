import Link from 'next/link';
import { PawPrint, Home, Search } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <Logo showTagline />
      <div className="mt-12 text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
          <PawPrint className="h-10 w-10 text-gold/60" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-text mb-3">404</h1>
        <p className="text-sm text-muted mb-2">
          The page you are looking for has wandered off into the jungle.
        </p>
        <p className="text-sm text-muted mb-8">
          Let us help you find your way back to The Golden Tiger.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 gold-button rounded-lg px-6 py-3 text-sm font-semibold"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/category/electronics"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
          >
            <Search className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
