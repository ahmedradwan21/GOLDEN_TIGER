'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-surface-elevated focus-ring text-text transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-surface-elevated p-1">
      {([
        { mode: 'light' as const, icon: Sun, label: 'Light' },
        { mode: 'dark' as const, icon: Moon, label: 'Dark' },
        { mode: 'system' as const, icon: Monitor, label: 'System' },
      ]).map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className={cn(
            'flex items-center justify-center h-8 w-8 rounded-md transition-all',
            theme === mode
              ? 'bg-gold/20 text-gold'
              : 'text-muted hover:text-text'
          )}
          aria-label={label}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
