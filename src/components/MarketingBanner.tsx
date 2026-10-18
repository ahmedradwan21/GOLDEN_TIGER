'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

interface MarketingSlide {
  id: string;
  headline: string;
  subtext: string;
  image: string;
  ctaText: string;
  ctaHref: string;
  sponsor?: string;
}

interface MarketingBannerProps {
  slides?: MarketingSlide[];
  className?: string;
}

const defaultSlides: MarketingSlide[] = [
  {
    id: 'mk-1',
    headline: 'سوبر ماركت ويك إند',
    subtext: 'خصومات تصل إلى 50% على كل احتياجاتك الأسبوعية',
    image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&h=400&w=1200',
    ctaText: 'تسوق الآن',
    ctaHref: '/category/home-kitchen',
    sponsor: 'برعاية vileda',
  },
  {
    id: 'mk-2',
    headline: 'عروض الإلكترونيات الأسبوعية',
    subtext: 'أحدث الأجهزة بأسعار لا تُقاوم — لفترة محدودة',
    image: 'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&h=400&w=1200',
    ctaText: 'اكتشف العروض',
    ctaHref: '/category/electronics',
    sponsor: 'ValU',
  },
  {
    id: 'mk-3',
    headline: 'أسبوع الموضة',
    subtext: 'تشكيلة خريف 2026 وصلت — تسوق قبل النفاد',
    image: 'https://images.pexels.com/photos/1488470/pexels-photo-1488470.jpeg?auto=compress&cs=tinysrgb&h=400&w=1200',
    ctaText: 'تصفح المجموعة',
    ctaHref: '/category/fashion',
  },
];

export function MarketingBanner({ slides = defaultSlides, className }: MarketingBannerProps) {
  const { dir } = useI18n();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [paused, next, slides.length]);

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`;
    }
  }, [current]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (dir === 'rtl') {
        if (diff > 0) next();
        else prev();
      } else {
        if (diff > 0) prev();
        else next();
      }
    }
    touchStartX.current = null;
  }

  if (slides.length === 0) return null;

  return (
    <section
      className={cn('relative w-full overflow-hidden', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex transition-transform duration-700 ease-out"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative w-full shrink-0">
            <div className="relative h-[180px] sm:h-[220px] lg:h-[280px] overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600">
              <div className="absolute inset-0 flex items-center justify-between px-6 sm:px-10 lg:px-16">
                <div className={cn('flex-1 z-10', dir === 'rtl' && 'text-right')}>
                  {slide.sponsor && (
                    <span className="inline-block mb-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                      {slide.sponsor}
                    </span>
                  )}
                  <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
                    {slide.headline}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90 mb-4 max-w-md">
                    {slide.subtext}
                  </p>
                  <Link
                    href={slide.ctaHref}
                    className="inline-flex items-center justify-center bg-white text-orange-600 rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-orange-50 transition-colors"
                  >
                    {slide.ctaText}
                  </Link>
                </div>
                <div className="hidden sm:block relative w-40 h-32 lg:w-56 lg:h-44 shrink-0 rounded-lg overflow-hidden">
                  <SafeImage
                    src={slide.image}
                    alt={slide.headline}
                    fill
                    sizes="224px"
                    className="object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-orange-600 hover:bg-white transition-colors',
              dir === 'rtl' ? 'right-4' : 'left-4'
            )}
            aria-label="السابق"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-orange-600 hover:bg-white transition-colors',
              dir === 'rtl' ? 'left-4' : 'right-4'
            )}
            aria-label="التالي"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                )}
                aria-label={`${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
