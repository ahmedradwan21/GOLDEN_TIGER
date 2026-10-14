import Link from 'next/link';
import { PawPrint } from 'lucide-react';

export function Logo({
  size = 'md',
  showTagline = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const iconSize =
    size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const circleSize =
    size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';

  return (
    <Link
      href="/"
      className="flex items-center gap-2 focus-ring rounded-lg"
      aria-label="The Golden Tiger home"
    >
      <div
        className={`${circleSize} rounded-full bg-gold-gradient flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.25)]`}
      >
        <PawPrint className={`${iconSize} text-background`} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`font-heading ${textSize} font-bold text-text tracking-tight`}
        >
          The Golden Tiger
        </span>
        {showTagline && (
          <span className="hidden sm:block text-[0.625rem] uppercase tracking-[0.2em] text-gold mt-0.5">
            Premium Marketplace
          </span>
        )}
      </div>
    </Link>
  );
}
