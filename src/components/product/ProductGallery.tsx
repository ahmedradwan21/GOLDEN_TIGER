'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight, X, ZoomIn, Package } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import { normalizeProductImages } from '@/lib/product-images';
import { useI18n } from '@/context/I18nContext';
import { pickLocalized } from '@/lib/localize';

interface GalleryMedia {
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
}

interface ProductGalleryProps {
  images?: unknown;
  videoUrls?: unknown;
  title: string;
  titleAr?: string;
}

function getYouTubeThumb(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
  return '';
}

export function ProductGallery({ images, videoUrls, title: titleEn, titleAr }: ProductGalleryProps) {
  const { t, locale } = useI18n();
  const title = pickLocalized(titleEn, titleAr, locale);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const media: GalleryMedia[] = [
    ...normalizeProductImages(images)
      .filter((src) => !failedImages.includes(src))
      .map((src) => ({ type: 'image' as const, src })),
    ...normalizeProductImages(videoUrls).map((url) => ({
      type: 'video' as const,
      src: url,
      thumbnail: getYouTubeThumb(url),
    })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const safeIndex = activeIndex < media.length ? activeIndex : 0;
  const active = media[safeIndex];
  const isVideo = active?.type === 'video';

  const goNext = useCallback(() => {
    setActiveIndex((i) => media.length ? ((i < media.length ? i : 0) + 1) % media.length : 0);
  }, [media.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => media.length ? ((i < media.length ? i : 0) - 1 + media.length) % media.length : 0);
  }, [media.length]);

  useEffect(() => {
    if (activeIndex >= media.length) setActiveIndex(0);
    if (media.length === 0) {
      setLightboxOpen(false);
      setZoomed(false);
    }
  }, [activeIndex, media.length]);

  function handleImageError(src: string) {
    setFailedImages((failed) => failed.includes(src) ? failed : [...failed, src]);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, goNext, goPrev]);

  function handleZoomMove(e: React.MouseEvent) {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  }

  return (
    <div className="space-y-3">
      {/* Main display */}
      <div
        ref={mainRef}
        className="relative aspect-square rounded-xl overflow-hidden bg-surface-elevated border border-border group"
        onMouseEnter={() => active && !isVideo && setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleZoomMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') goNext();
          if (e.key === 'ArrowLeft') goPrev();
        }}
        tabIndex={0}
        role="img"
        aria-label={active ? `${title} - ${t('gallery.imageOf').replace('{n}', String(safeIndex + 1)).replace('{total}', String(media.length))}` : `${title} - ${t('gallery.noImage')}`}
      >
        {!active ? (
          <div className="absolute inset-0 flex items-center justify-center" aria-label={t('gallery.noImage')}>
            <Package className="h-16 w-16 text-muted" aria-hidden="true" />
          </div>
        ) : isVideo ? (
          <VideoFacade url={active.src} thumbnail={active.thumbnail || ''} title={title} />
        ) : (
          <>
            <Image
              src={active.src}
              unoptimized
              onError={() => handleImageError(active.src)}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300"
              style={
                zoomed
                  ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(2)' }
                  : undefined
              }
              priority={safeIndex === 0}
            />
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute top-3 right-3 h-9 w-9 rounded-lg bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center text-text hover:text-gold transition-colors opacity-0 group-hover:opacity-100"
              aria-label={t('gallery.openFullscreen')}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Desktop arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center text-text hover:text-gold transition-colors hidden md:flex"
              aria-label={t('gallery.prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center text-text hover:text-gold transition-colors hidden md:flex"
              aria-label={t('gallery.next')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {media.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'relative shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border-2 transition-all',
              index === safeIndex
                ? 'border-gold ring-1 ring-gold'
                : 'border-border hover:border-muted'
            )}
            aria-label={`${t(item.type === 'video' ? 'gallery.viewVideo' : 'gallery.viewImage')} ${index + 1}`}
            aria-current={index === safeIndex}
          >
            {item.type === 'video' ? (
              <>
                <SafeImage
                  src={item.thumbnail || ''}
                  alt={t('gallery.videoThumb')}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </>
            ) : (
              <SafeImage
                src={item.src}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && active && !isVideo && (
        <div
          className="fixed inset-0 z-[60] bg-background/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold z-10"
            aria-label={t('gallery.closeFullscreen')}
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold"
            aria-label={t('gallery.prev')}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative max-w-[90vw] max-h-[85vh] aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image
              src={active.src}
              unoptimized
              onError={() => handleImageError(active.src)}
              alt={title}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold"
            aria-label={t('gallery.next')}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted">
            {safeIndex + 1} / {media.length}
          </span>
        </div>
      )}
    </div>
  );
}

function VideoFacade({ url, thumbnail, title }: { url: string; thumbnail: string; title: string }) {
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const embedUrl = convertToEmbedUrl(url);

  if (loaded) {
    return (
      <div className="w-full h-full relative">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setLoaded(true)}
      className="relative w-full h-full flex items-center justify-center group"
      aria-label={t('gallery.playVideo')}
    >
      {thumbnail && (
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
        <div className="h-16 w-16 rounded-full bg-gold/90 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="h-7 w-7 text-background fill-background ml-1" />
        </div>
      </div>
    </button>
  );
}

function convertToEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}
