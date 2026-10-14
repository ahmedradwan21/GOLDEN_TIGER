'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import type { HeroSlide } from '@/types';

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    timerRef.current = setInterval(next, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next, slides.length]);

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`;
    }
  }, [current]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prev();
      else next();
    }
    touchStartX.current = null;
  }

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-surface"
      aria-roledescription="carousel"
      aria-label="Promotional slides"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        ref={trackRef}
        className="flex transition-transform duration-700 ease-out"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="relative w-full shrink-0"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            aria-hidden={index !== current}
          >
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
              <SafeImage
                src={slide.image}
                alt={slide.headline}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
                <div className="max-w-2xl">
                  {slide.sponsored && (
                    <span className="inline-block mb-3 bg-gold/20 text-gold text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Sponsored
                    </span>
                  )}
                  <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-bold text-text mb-3 leading-tight">
                    {slide.headline}
                  </h2>
                  <p className="text-sm sm:text-lg text-muted mb-5 max-w-md">
                    {slide.subcopy}
                  </p>
                  <Link
                    href={slide.ctaHref}
                    className="inline-flex items-center justify-center gold-button rounded-lg px-6 py-3 text-sm font-semibold"
                  >
                    {slide.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center text-text hover:bg-surface hover:text-gold transition-colors focus-ring"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center text-text hover:bg-surface hover:text-gold transition-colors focus-ring"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={cn(
                'h-2 rounded-full transition-all focus-ring',
                index === current
                  ? 'w-8 bg-gold'
                  : 'w-2 bg-muted/50 hover:bg-muted'
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current}
            />
          ))}
        </div>
      )}
    </section>
  );
}
