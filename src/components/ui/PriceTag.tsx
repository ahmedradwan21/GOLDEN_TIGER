import { formatPrice } from '@/lib/pricing';
import { cn, discountPercent } from '@/lib/utils';

interface PriceTagProps {
  price: number;
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceTag({
  price,
  compareAtPrice,
  size = 'md',
  className,
}: PriceTagProps) {
  const discount = discountPercent(price, compareAtPrice);
  const priceSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const compareSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn('font-semibold text-text', priceSize)}>
        {formatPrice(price)}
      </span>
      {discount !== null && compareAtPrice && (
        <>
          <span className={cn('text-muted line-through', compareSize)}>
            {formatPrice(compareAtPrice)}
          </span>
          <span className="text-xs font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded">
            {discount}% off
          </span>
        </>
      )}
    </div>
  );
}
