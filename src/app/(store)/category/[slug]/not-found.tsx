import Link from 'next/link';
import { PawPrint, Home } from 'lucide-react';

export default function CategoryNotFound() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
        <PawPrint className="h-8 w-8 text-gold/60" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-text mb-2">Category Not Found</h1>
      <p className="text-sm text-muted mb-6">This category does not exist in The Golden Tiger.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 gold-button rounded-lg px-6 py-3 text-sm font-semibold"
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
