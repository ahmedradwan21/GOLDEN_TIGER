'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  className,
  priority,
  onClick,
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-surface-elevated border border-border rounded-lg',
          className
        )}
        style={
          !fill && width && height
            ? { width, height }
            : undefined
        }
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? alt : undefined}
      >
        <PawPrint className="h-10 w-10 text-gold/50" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setErrored(true)}
      onClick={onClick}
    />
  );
}
