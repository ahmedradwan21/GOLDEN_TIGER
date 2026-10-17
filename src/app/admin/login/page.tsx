'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Loader as Loader2, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t('auth.toast.loginFailed'));
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError(t('admin.login.networkError'));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/30 mb-4">
            <Lock className="w-7 h-7 text-gold" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-text">{t('admin.login.title')}</h1>
          <p className="text-muted mt-2">{t('admin.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thegoldentiger.com"
                required
                className="pl-10 bg-background"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-10 pr-10 bg-background"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full gold-button h-11"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.login.signIn')}
          </Button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          {t('admin.login.protectedNote')}
        </p>
      </div>
    </div>
  );
}
