'use client';

import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setEmail('');
      toast.success('Welcome to The Golden Tiger! Check your inbox for a confirmation.');
    }, 800);
  }

  return (
    <section className="py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-surface-elevated border border-border rounded-2xl p-8 sm:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
          <div className="relative max-w-lg mx-auto text-center">
            <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-gold" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-text mb-2">
              Join The Golden Tiger Club
            </h2>
            <p className="text-sm text-muted mb-6">
              Get exclusive deals, early access to new products, and 10% off your first order.
            </p>
            {done ? (
              <div className="flex items-center justify-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You are subscribed! Welcome aboard.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 h-11 px-4 rounded-lg bg-surface border border-border text-sm text-text placeholder:text-muted focus-ring"
                  aria-label="Email address"
                  autoComplete="email"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="gold-button rounded-lg px-6 h-11 text-sm font-semibold"
                >
                  {loading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
