'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';

interface GalleryMedia {
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
}

interface ProductGalleryProps {
  images: string[];
  videoUrls: string[];
  title: string;
}

function getYouTubeThumb(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
  return '';
}

export function ProductGallery({ images, videoUrls, title }: ProductGalleryProps) {
  const media: GalleryMedia[] = [
    ...images.map((src) => ({ type: 'image' as const, src })),
    ...videoUrls.map((url) => ({
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

  const active = media[activeIndex];
  const isVideo = active?.type === 'video';

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % media.length);
  }, [media.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + media.length) % media.length);
  }, [media.length]);

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
        onMouseEnter={() => !isVideo && setZoomed(true)}
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
        aria-label={`${title} - image ${activeIndex + 1} of ${media.length}`}
      >
        {isVideo ? (
          <VideoFacade url={active.src} thumbnail={active.thumbnail || ''} title={title} />
        ) : (
          <>
            <Image
              src={active.src}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300"
              style={
                zoomed
                  ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(2)' }
                  : undefined
              }
              priority={activeIndex === 0}
            />
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute top-3 right-3 h-9 w-9 rounded-lg bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center text-text hover:text-gold transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Open fullscreen"
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
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center text-text hover:text-gold transition-colors hidden md:flex"
              aria-label="Next image"
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
              index === activeIndex
                ? 'border-gold ring-1 ring-gold'
                : 'border-border hover:border-muted'
            )}
            aria-label={`View ${item.type} ${index + 1}`}
            aria-current={index === activeIndex}
          >
            {item.type === 'video' ? (
              <>
                <SafeImage
                  src={item.thumbnail || ''}
                  alt="Video thumbnail"
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
      {lightboxOpen && !isVideo && (
        <div
          className="fixed inset-0 z-[60] bg-background/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold z-10"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative max-w-[90vw] max-h-[85vh] aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image
              src={active.src}
              alt={title}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted">
            {activeIndex + 1} / {media.length}
          </span>
        </div>
      )}
    </div>
  );
}

function VideoFacade({ url, thumbnail, title }: { url: string; thumbnail: string; title: string }) {
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
      aria-label="Play video"
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
