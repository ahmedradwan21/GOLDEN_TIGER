'use client';

import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-danger" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-text mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-muted mb-8">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gold-button rounded-lg px-6 py-3 text-sm font-semibold"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
