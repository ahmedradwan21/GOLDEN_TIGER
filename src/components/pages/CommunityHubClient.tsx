'use client';

import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type CommunityLink = Database['public']['Tables']['social_community_links']['Row'];

type PlatformKey =
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'instagram'
  | 'messenger';

interface PlatformStyle {
  bg: string;
  hoverBg: string;
  ring: string;
  icon: (props: { className?: string }) => JSX.Element;
}

const PLATFORM_STYLES: Record<PlatformKey, PlatformStyle> = {
  whatsapp: {
    bg: 'bg-[#25D366]/10',
    hoverBg: 'group-hover:bg-[#25D366]',
    ring: 'ring-[#25D366]/30',
    icon: WhatsAppIcon,
  },
  telegram: {
    bg: 'bg-[#229ED9]/10',
    hoverBg: 'group-hover:bg-[#229ED9]',
    ring: 'ring-[#229ED9]/30',
    icon: TelegramIcon,
  },
  facebook: {
    bg: 'bg-[#1877F2]/10',
    hoverBg: 'group-hover:bg-[#1877F2]',
    ring: 'ring-[#1877F2]/30',
    icon: FacebookIcon,
  },
  instagram: {
    bg: 'bg-gradient-to-br from-[#F58529]/15 via-[#DD2A7B]/15 to-[#8134AF]/15',
    hoverBg: 'group-hover:bg-gradient-to-br group-hover:from-[#F58529] group-hover:via-[#DD2A7B] group-hover:to-[#8134AF]',
    ring: 'ring-[#DD2A7B]/30',
    icon: InstagramIcon,
  },
  messenger: {
    bg: 'bg-[#00B2FF]/10',
    hoverBg: 'group-hover:bg-[#00B2FF]',
    ring: 'ring-[#00B2FF]/30',
    icon: MessengerIcon,
  },
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.464.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.531 6.998-3.02 3.332-1.387 4.027-1.628 4.48-1.636z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.293l-3.056-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.293z" />
    </svg>
  );
}

function getPlatformStyle(platform: string): PlatformStyle {
  return (
    PLATFORM_STYLES[platform as PlatformKey] ?? {
      bg: 'bg-gold/10',
      hoverBg: 'group-hover:bg-gold',
      ring: 'ring-gold/30',
      icon: WhatsAppIcon,
    }
  );
}

export function CommunityHubClient({ links }: { links: CommunityLink[] }) {
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  return (
    <section className="min-h-[70vh] max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold/10 text-gold mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text">
          {isRtl ? 'مجتمع النمر الذهبي' : 'The Golden Tiger Community'}
        </h1>
        <p className="mt-3 text-muted text-sm sm:text-base leading-relaxed">
          {isRtl
            ? 'انضم إلى قنواتنا على منصات التواصل للحصول على أحدث العروض والكوبونات الحصرية والتحديثات الفورية.'
            : 'Join our channels across social platforms for the latest offers, exclusive coupons, and instant updates.'}
        </p>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-border bg-surface">
          <p className="text-muted">
            {isRtl
              ? 'لا توجد قنوات متاحة حالياً. تفضل بزيارتنا قريباً.'
              : 'No channels are available right now. Please check back soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {links.map((link) => {
            const style = getPlatformStyle(link.platform);
            const Icon = style.icon;
            const name = isRtl ? link.name_ar : link.name_en;
            const description = isRtl ? link.description_ar : link.description_en;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                  isRtl && 'text-right',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-14 h-14 rounded-xl ring-1 text-white transition-colors duration-300',
                    style.bg,
                    style.hoverBg,
                    style.ring,
                    'text-current group-hover:text-white',
                  )}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-text">{name}</h2>
                  {description ? (
                    <p className="mt-1.5 text-sm text-muted leading-relaxed">
                      {description}
                    </p>
                  ) : null}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium text-gold',
                    isRtl && 'flex-row-reverse',
                  )}
                >
                  <span>{isRtl ? 'انضم الآن' : 'Join now'}</span>
                  <ArrowRight className={cn('w-4 h-4', isRtl && 'rotate-180')} />
                </div>
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/"
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-gold transition-colors',
            isRtl && 'flex-row-reverse',
          )}
        >
          <ArrowRight className={cn('w-4 h-4', isRtl && 'rotate-180')} />
          {isRtl ? 'العودة للرئيسية' : 'Back to home'}
        </Link>
      </div>
    </section>
  );
}
