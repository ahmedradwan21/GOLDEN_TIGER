'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function QuantityStepper({
  quantity,
  min = 1,
  max = 10,
  onChange,
  disabled,
  className,
  size = 'md',
}: QuantityStepperProps) {
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const atMin = quantity <= min;
  const atMax = quantity >= max;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-surface',
        className
      )}
    >
      <button
        type="button"
        onClick={() => !atMin && onChange(quantity - 1)}
        disabled={disabled || atMin}
        aria-label="Decrease quantity"
        className={cn(
          btnSize,
          'flex items-center justify-center rounded-l-lg transition-colors hover:bg-surface-elevated focus-ring text-text disabled:opacity-40 disabled:pointer-events-none'
        )}
      >
        <Minus className={iconSize} />
      </button>
      <span
        className={cn(
          'min-w-[2.5rem] text-center font-medium tabular-nums text-text',
          size === 'sm' ? 'text-sm' : 'text-base'
        )}
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => !atMax && onChange(quantity + 1)}
        disabled={disabled || atMax}
        aria-label="Increase quantity"
        className={cn(
          btnSize,
          'flex items-center justify-center rounded-r-lg transition-colors hover:bg-surface-elevated focus-ring text-text disabled:opacity-40 disabled:pointer-events-none'
        )}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
