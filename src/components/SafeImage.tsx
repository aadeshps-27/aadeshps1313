import React, { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel = 'Visual Plate',
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
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
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
