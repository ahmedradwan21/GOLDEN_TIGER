'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>) {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();
  const label = t(visible ? 'auth.hidePassword' : 'auth.showPassword');

  return (
    <div className="relative">
      <Lock aria-hidden="true" className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className="w-full h-10 ps-10 pe-12 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute end-0 top-0 text-muted hover:text-text"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
      </Button>
    </div>
  );
}