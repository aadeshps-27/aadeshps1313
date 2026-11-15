import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PROFILE } from '../data/portfolio';
import { ARTCRAFT_EASE } from './MotionPrimitives';

interface PreloaderProps {
  onComplete: () => void;
}

const PRELOAD_DURATION_MS = 1550;

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
      aria-label="Loading portfolio"
      initial={{ y: '0%' }}
      animate={{ y: '0%' }}
      exit={{
        y: '-100%',
        transition: { duration: 0.72, ease: ARTCRAFT_EASE },
      }}
      onClick={onComplete}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-between px-6 py-8 sm:px-10 sm:py-10 bg-white dark:bg-black select-none cursor-pointer overflow-hidden"
    >
      {/* Top registration bar */}
      <div className="w-full max-w-7xl flex items-center justify-between text-xs font-mono text-[#525252] dark:text-[#A3A3A3]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ARTCRAFT_EASE }}
          className="flex items-center gap-2.5"
        >
          <span className="inline-block w-4 h-[2px] bg-[#FF721A]" aria-hidden="true" />
          <span className="font-semibold text-[#0A0A0A] dark:text-white tracking-tight">
            {PROFILE.name}
          </span>
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: ARTCRAFT_EASE }}
          className="tabular-nums"
        >
          {PROFILE.location}
        </motion.span>
      </div>

      {/* Center focal showcase: Orbital ring + optical shutter logo reveal */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-md my-auto">
        {/* Horizontal datum hairline sweeping outward from center */}
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.85, ease: ARTCRAFT_EASE }}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#E5E5E5] dark:bg-[#262626]"
        />

        {/* Calibration frame & orange orbit ring surrounding the logo */}
        <div className="relative flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64">
          {/* Corner architectural crosshairs */}
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1, ease: ARTCRAFT_EASE }}
            className="absolute inset-4 pointer-events-none"
          >
            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#0A0A0A]/30 dark:border-white/30" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#0A0A0A]/30 dark:border-white/30" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#0A0A0A]/30 dark:border-white/30" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#0A0A0A]/30 dark:border-white/30" />
          </motion.span>

          {/* Precision SVG circular sweep (matches orange circle favicon motif) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="w-full h-full -rotate-90"
          >
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-[#E5E5E5] dark:text-[#262626]"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="#FF721A"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.35, ease: ARTCRAFT_EASE }}
            />
          </svg>

          {/* Brand Logo optical aperture + blur-to-sharp reveal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, delay: 0.12, ease: ARTCRAFT_EASE }}
            exit={{
              opacity: 0,
              y: -12,
              scale: 0.96,
              transition: { duration: 0.28, ease: ARTCRAFT_EASE },
            }}
            className="absolute inset-0 flex items-center justify-center p-10 sm:p-12 bg-white/80 dark:bg-black/80 rounded-full backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 0.95, delay: 0.16, ease: ARTCRAFT_EASE }}
              className="flex items-center justify-center"
            >
              <img
                src="/assets/aistudio/Black_Blue_and_White_Gradient_Modern_Business_LinkedIn_Banner__3__1be4a1fb.png"
                alt={PROFILE.name}
                referrerPolicy="no-referrer"
                className="h-14 sm:h-16 w-auto object-contain select-none mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom discipline line */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: ARTCRAFT_EASE }}
        className="text-[11px] font-mono text-[#737373] dark:text-[#737373]"
      >
        Graphics Design · Web Engineering · Robotics
      </motion.p>
    </motion.div>
  );
};
