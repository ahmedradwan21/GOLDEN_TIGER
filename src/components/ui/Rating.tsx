import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function Rating({
  rating,
  reviewCount,
  size = 'sm',
  showCount = true,
  className,
}: RatingProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      aria-label={`Rating: ${rating} out of 5${reviewCount ? `, ${reviewCount} reviews` : ''}`}
    >
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating);
          const half = !filled && star - 0.5 <= rating;
          return (
            <Star
              key={star}
              className={cn(
                starSize,
                filled
                  ? 'fill-gold text-gold'
                  : half
                    ? 'fill-gold/50 text-gold'
                    : 'fill-border text-border'
              )}
            />
          );
        })}
      </div>
      {showCount && reviewCount !== undefined && (
        <span className="text-xs text-muted">
          {rating.toFixed(1)} ({reviewCount.toLocaleString()})
        </span>
      )}
      {showCount && reviewCount === undefined && (
        <span className="text-xs text-muted">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
