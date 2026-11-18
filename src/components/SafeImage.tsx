import React, { useLayoutEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: 'high' | 'low' | 'auto';
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async' | 'auto';
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel = 'Visual Plate',
  priority = 'auto',
  loading = 'eager',
  decoding = 'async',
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wasCached, setWasCached] = useState(false);

  useLayoutEffect(() => {
    setHasError(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setIsLoaded(true);
      setWasCached(true);
      return;
    }

    setIsLoaded(false);
    setWasCached(false);

    if (el && typeof el.decode === 'function') {
      el.decode()
        .then(() => {
          if (imgRef.current && imgRef.current.naturalWidth > 0) {
            setIsLoaded(true);
          }
        })
        .catch(() => {
          // Fallback to standard onLoad/onError handlers
        });
    }
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-[#F5F5F5] dark:bg-[#141414] text-[#525252] dark:text-[#A3A3A3] p-6 text-center ${className}`}
      >
        <Layers size={28} strokeWidth={1.5} aria-hidden="true" />
        <span className="font-mono text-xs uppercase tracking-widest">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#EFEFEF] dark:bg-[#161616] shimmer-block"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={priority}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`${className} ${
          wasCached ? '' : 'transition-opacity duration-150'
        } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};
