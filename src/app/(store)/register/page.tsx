'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader as Loader2, Mail, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/layout/Logo';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { authErrorKey } from '@/lib/auth/errors';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorCode(null);
    if (password.length < 8) {
      toast.error(t('auth.toast.passwordTooShort'));
      return;
    }
    setLoading(true);
    const result = await register(email, password, name || undefined);
    setLoading(false);
    if (result.success) {
      toast.success(t('auth.toast.accountCreated'));
      router.push('/account');
    } else {
      setErrorCode(result.code ?? 'SERVER_ERROR');
      toast.error(t(authErrorKey(result.code)));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo showTagline />
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 sm:p-8">
          <h1 className="font-heading text-2xl font-bold text-text mb-1">{t('register.title')}</h1>
          <p className="text-sm text-muted mb-6">{t('register.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('register.nameOptional')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
                  placeholder={t('placeholder.fullName')}
                  autoComplete="name"
                />
              </div>
            </div>
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
              <label htmlFor="register-password" className="block text-xs font-medium text-muted mb-1.5">{t('register.passwordLabel')}</label>
                <PasswordInput
                  id="register-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
            </div>
            {errorCode && (
              <div role="alert" className="text-sm space-y-2">
                <p className="text-destructive">{t(authErrorKey(errorCode))}</p>
                {errorCode === 'EMAIL_ALREADY_REGISTERED' && (
                  <Link href="/login" className="inline-block text-gold hover:text-gold-light font-medium underline">
                    {t('auth.goToLogin')}
                  </Link>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 gold-button rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('register.createAccount')}
            </button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            {t('register.haveAccount')}{' '}
            <Link href="/login" className="text-gold hover:text-gold-light transition-colors font-medium">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
