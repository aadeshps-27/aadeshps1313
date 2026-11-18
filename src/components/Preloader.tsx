import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BRAND_LOGO_URL, PROFILE } from '../data/portfolio';
import { ARTCRAFT_EASE } from './MotionPrimitives';

interface PreloaderProps {
  onComplete: () => void;
}

const PRELOAD_DURATION_MS = 1350;
const LOGO_SRC = BRAND_LOGO_URL;

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const prefersReducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const finishTimer = window.setTimeout(() => {
      onComplete();
    }, PRELOAD_DURATION_MS);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [prefersReducedMotion, onComplete]);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={`Loading ${PROFILE.name} portfolio`}
      initial={{ y: '0%' }}
      animate={{ y: '0%' }}
      exit={{
        y: '-100%',
        transition: { duration: 0.68, ease: ARTCRAFT_EASE },
      }}
      onClick={onComplete}
      className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-white dark:bg-black select-none cursor-pointer overflow-hidden"
    >
      {/* Pure authentic brand mark stage — no auxiliary rings, text, or chrome */}
      <motion.div
        exit={{
          opacity: 0,
          y: -16,
          scale: 0.97,
          transition: { duration: 0.3, ease: ARTCRAFT_EASE },
        }}
        className="relative inline-flex items-center justify-center"
      >
        {/* Sizing ghost keeps natural image bounds rock-steady across animation beats */}
        <img
          src={LOGO_SRC}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          className="h-14 sm:h-20 lg:h-24 w-auto object-contain opacity-0 pointer-events-none"
        />

        {/* Beat 1: Wordmark ('AADESH') baseline rise & optical sharpen (keeps img CSS filter intact in dark mode) */}
        <div
          aria-hidden="true"
          style={{ clipPath: 'inset(0 22.2% 0 0)' }}
          className="absolute inset-0 overflow-hidden"
        >
          <motion.div
            initial={{ y: '42%', opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.62, delay: 0.05, ease: ARTCRAFT_EASE }}
            className="w-full h-full flex items-center justify-center bg-white dark:bg-black"
          >
            <img
              src={LOGO_SRC}
              alt=""
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              className="h-14 sm:h-20 lg:h-24 w-auto object-contain mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen"
            />
          </motion.div>
        </div>

        {/* Beat 2: Signature orange dot punctuation springs cleanly into registration */}
        <div
          style={{ clipPath: 'inset(0 0 0 77.8%)' }}
          className="absolute inset-0"
        >
          <motion.div
            style={{ transformOrigin: '81.4% 50%' }}
            initial={{ scale: 0.25, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.42,
              scale: { type: 'spring', stiffness: 420, damping: 20 },
              opacity: { duration: 0.22, ease: 'easeOut' },
            }}
            className="w-full h-full flex items-center justify-center bg-white dark:bg-black"
          >
            <img
              src={LOGO_SRC}
              alt={PROFILE.name}
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              className="h-14 sm:h-20 lg:h-24 w-auto object-contain mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen"
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
