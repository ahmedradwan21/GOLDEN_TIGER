'use client';

import Link from 'next/link';
import { TriangleAlert as AlertTriangle, Chrome as Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-background">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-danger" />
        </div>

        {isDev ? (
          <>
            <h1 className="font-heading text-2xl font-bold text-text mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-muted mb-4">
              An unexpected error occurred. Please try again or return to the homepage.
            </p>
            {error?.message && (
              <pre className="text-left text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg p-4 mb-6 overflow-auto max-h-40">
                {error.message}
              </pre>
            )}
            {error?.digest && (
              <p className="text-xs text-muted mb-6">
                Digest: {error.digest}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold text-text mb-3" dir="rtl">
              نعمل على تحديث الأنظمة حالياً
            </h1>
            <p className="text-sm text-muted mb-8" dir="rtl">
              نعتذر عن الإزعاج. فريقنا يعمل على تحسين تجربتك. يرجى المحاولة مرة أخرى بعد لحظات.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 gold-button rounded-lg px-6 py-3 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            {isDev ? 'Try Again' : 'إعادة المحاولة'}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
          >
            <Home className="h-4 w-4" />
            {isDev ? 'Back to Home' : 'العودة للرئيسية'}
          </Link>
        </div>
      </div>
    </div>
  );
}
