'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/layout/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    const result = await register(email, password, name || undefined);
    setLoading(false);
    if (result.success) {
      toast.success('Account created! Welcome to The Golden Tiger.');
      router.push('/account');
    } else {
      toast.error(result.error ?? 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo showTagline />
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 sm:p-8">
          <h1 className="font-heading text-2xl font-bold text-text mb-1">Create Account</h1>
          <p className="text-sm text-muted mb-6">Join The Golden Tiger for a premium shopping experience.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Name (optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
                  placeholder="john@example.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Password (min 8 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 gold-button rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:text-gold-light transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
