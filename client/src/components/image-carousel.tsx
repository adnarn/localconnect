import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  showThumbnails?: boolean;
  showDots?: boolean;
  aspectRatio?: "video" | "square" | "wide";
  overlay?: React.ReactNode;
}

export function ImageCarousel({
  images,
  alt = "Image",
  className = "",
  showThumbnails = true,
  showDots = true,
  aspectRatio = "video",
  overlay,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const hasMultiple = images.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 350);
    },
    [isTransitioning],
  );

  const next = useCallback(() => {
    goTo((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, goTo]);

  const prev = useCallback(() => {
    goTo((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, goTo]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);
  };

  const onTouchEnd = () => {
    if (touchStart === null) return;
    const threshold = 50;
    if (touchDelta < -threshold && hasMultiple) next();
    else if (touchDelta > threshold && hasMultiple) prev();
    setTouchStart(null);
    setTouchDelta(0);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const lightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") lightboxNext();
      if (e.key === "ArrowLeft") lightboxPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, closeLightbox, lightboxNext, lightboxPrev]);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
        ? "aspect-[2/1]"
        : "aspect-video";
  const dragOffset = touchStart !== null ? touchDelta : 0;

  if (!images.length) return null;

  return (
    <>
      <div className={`relative select-none ${className}`}>
        <div
          className={`relative overflow-hidden rounded-md ${aspectClass}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          data-testid="carousel-viewport"
        >
          <div
            ref={trackRef}
            className="flex h-full"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}vw + ${dragOffset}px))`,
              transition:
                touchStart !== null
                  ? "none"
                  : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              width: `${images.length * 100}%`,
            }}
          >
            {images.map((src, idx) => (
              <div
                key={idx}
                className="relative h-full shrink-0 cursor-pointer"
                style={{ width: `${100 / images.length}%` }}
                onClick={() => openLightbox(idx)}
                data-testid={`carousel-slide-${idx}`}
              >
                <img
                  src={src}
                  alt={`${alt} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {overlay}

          <button
            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-white text-xs backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(currentIndex);
            }}
            data-testid="button-enlarge"
          >
            <ZoomIn className="h-3 w-3" />
            {hasMultiple && (
              <span>
                {currentIndex + 1}/{images.length}
              </span>
            )}
          </button>

          {hasMultiple && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white border-0 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                data-testid="button-prev-image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white border-0 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                data-testid="button-next-image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {showDots && hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "w-5 bg-white" : "w-2 bg-white/50"
                  }`}
                  data-testid={`button-dot-${idx}`}
                />
              ))}
            </div>
          )}
        </div>

        {showThumbnails && hasMultiple && (
          <div
            className="flex gap-2 mt-3 overflow-x-auto pb-1"
            data-testid="carousel-thumbnails"
          >
            {images.map((src, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`shrink-0 rounded-md overflow-hidden transition-all duration-200 ${
                  idx === currentIndex
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100"
                    : "opacity-60 hover:opacity-90"
                }`}
                data-testid={`button-thumbnail-${idx}`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-14 w-14 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <LightboxModal
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={lightboxNext}
          onPrev={lightboxPrev}
          onGoTo={setLightboxIndex}
          alt={alt}
        />
      )}
    </>
  );
}

function LightboxModal({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onGoTo,
  alt,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (i: number) => void;
  alt: string;
}) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const hasMultiple = images.length > 1;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };

  const onTouchEnd = () => {
    if (touchStart === null) return;
    if (touchDelta < -50 && hasMultiple) onNext();
    else if (touchDelta > 50 && hasMultiple) onPrev();
    setTouchStart(null);
    setTouchDelta(0);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white z-[101]"
        onClick={onClose}
        data-testid="button-lightbox-close"
      >
        <X className="h-5 w-5" />
      </Button>

      {hasMultiple && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm z-[101]"
          data-testid="text-lightbox-counter"
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}

      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none transition-opacity duration-300"
          style={{
            transform:
              touchStart !== null ? `translateX(${touchDelta}px)` : undefined,
            transition: touchStart !== null ? "none" : "transform 0.3s ease",
          }}
          draggable={false}
          data-testid="img-lightbox-main"
        />
      </div>

      {hasMultiple && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white z-[101]"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            data-testid="button-lightbox-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white z-[101]"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            data-testid="button-lightbox-next"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[101]">
          {images.map((src, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onGoTo(idx);
              }}
              className={`shrink-0 rounded overflow-hidden transition-all duration-200 border-2 ${
                idx === currentIndex
                  ? "border-white opacity-100"
                  : "border-transparent opacity-50"
              }`}
              data-testid={`button-lightbox-thumb-${idx}`}
            >
              <img
                src={src}
                alt={`Thumb ${idx + 1}`}
                className="h-12 w-12 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
