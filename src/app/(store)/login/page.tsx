'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader as Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/layout/Logo';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { authErrorKey } from '@/lib/auth/errors';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success(t('auth.toast.welcomeBack'));
      router.push(redirect);
    } else {
      const key = authErrorKey(result.code);
      setErrorKey(key);
      toast.error(t(key));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo showTagline />
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 sm:p-8">
          <h1 className="font-heading text-2xl font-bold text-text mb-1">{t('login.welcome')}</h1>
          <p className="text-sm text-muted mb-6">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('common.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
                  placeholder={t('placeholder.email')}
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-muted mb-1.5">{t('common.password')}</label>
                <PasswordInput
                  id="login-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
            </div>
            {errorKey && <p role="alert" className="text-sm text-destructive">{t(errorKey)}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 gold-button rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('login.signIn')}
            </button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            {t('login.noAccount')}{' '}
            <Link href="/register" className="text-gold hover:text-gold-light transition-colors font-medium">
              {t('login.createOne')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
