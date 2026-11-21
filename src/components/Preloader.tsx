import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PROFILE } from '../data/portfolio';

interface PreloaderProps {
  onComplete: () => void;
}

const PRELOAD_DURATION_MS = 1900;
// Osmo / ReFactory deceleration curve: smooth rapid draw into crisp architectural settle
const OSMO_EASE: [number, number, number, number] = [0.625, 0.05, 0, 1];

interface WordmarkGlyph {
  id: string;
  outerPath: string;
  innerPath?: string;
  delay: number;
}

// Exact sub-pixel traced contours of the 'AADESH•' logo (viewBox 0 0 860 160)
const LOGO_GLYPHS: WordmarkGlyph[] = [
  {
    id: 'logo-a1',
    outerPath:
      'M 70.0 24.3 L 21.8 134.0 L 21.4 135.0 L 22.0 136.1 L 59.0 136.0 L 66.8 117.0 L 68.0 116.5 L 109.0 116.5 L 110.1 118.0 L 116.6 135.0 L 118.0 136.1 L 155.3 136.1 L 154.7 133.0 L 107.0 24.3 Z',
    innerPath:
      'M 87.5 63.0 L 88.0 62.1 L 89.4 64.0 L 98.3 87.0 L 98.6 89.0 L 98.0 89.4 L 77.7 89.0 Z',
    delay: 0.05,
  },
  {
    id: 'logo-a2',
    outerPath:
      'M 206.0 24.0 L 204.2 25.0 L 156.0 134.7 L 156.0 136.1 L 193.0 136.1 L 194.5 135.0 L 202.0 116.6 L 243.0 116.5 L 244.3 117.0 L 252.0 135.9 L 290.0 136.0 L 290.4 135.0 L 242.3 25.0 L 241.0 24.0 Z',
    innerPath: 'M 223.0 62.0 L 233.3 89.0 L 213.0 89.4 L 212.5 89.0 L 212.8 87.0 Z',
    delay: 0.12,
  },
  {
    id: 'logo-d',
    outerPath:
      'M 297.0 24.6 L 297.0 135.5 L 298.0 136.1 L 352.0 136.1 L 364.0 135.3 L 370.0 134.3 L 380.0 131.4 L 389.0 127.3 L 394.0 124.1 L 397.8 121.0 L 404.5 114.0 L 407.3 110.0 L 409.5 106.0 L 411.4 102.0 L 413.4 96.0 L 415.2 85.0 L 415.2 75.0 L 413.3 64.0 L 411.4 58.0 L 409.5 54.0 L 407.3 50.0 L 404.4 46.0 L 397.7 39.0 L 392.0 34.7 L 383.0 29.9 L 374.0 26.7 L 364.0 24.7 L 351.0 24.0 L 298.0 24.0 Z',
    innerPath:
      'M 334.7 54.0 L 336.0 53.5 L 351.0 53.5 L 355.0 53.7 L 360.0 54.7 L 365.0 56.8 L 368.0 58.8 L 371.4 62.0 L 373.5 65.0 L 376.1 71.0 L 377.1 77.0 L 377.1 83.0 L 376.4 88.0 L 375.1 92.0 L 372.3 97.0 L 369.0 100.4 L 365.0 103.3 L 360.0 105.3 L 355.0 106.4 L 336.0 106.6 L 334.7 106.0 Z',
    delay: 0.19,
  },
  {
    id: 'logo-e',
    outerPath:
      'M 430.0 24.0 L 429.1 25.0 L 429.1 135.0 L 429.8 136.0 L 522.0 135.7 L 522.0 107.8 L 467.0 107.5 L 466.3 106.0 L 466.3 94.0 L 467.0 92.8 L 512.0 92.8 L 513.6 92.0 L 513.6 67.0 L 513.0 65.6 L 467.0 65.6 L 466.4 65.0 L 466.3 54.0 L 467.0 52.5 L 520.0 52.2 L 520.0 24.5 Z',
    delay: 0.26,
  },
  {
    id: 'logo-s',
    outerPath:
      'M 574.0 21.9 L 563.0 23.8 L 555.0 26.5 L 547.0 30.8 L 543.0 33.9 L 539.9 37.0 L 535.7 43.0 L 532.8 50.0 L 531.8 55.0 L 531.6 59.0 L 531.7 63.0 L 532.6 68.0 L 534.8 74.0 L 536.8 77.0 L 541.0 81.5 L 546.0 85.3 L 552.0 88.4 L 558.0 90.4 L 565.0 92.4 L 584.0 96.8 L 590.0 98.8 L 592.0 100.3 L 593.3 102.0 L 593.4 105.0 L 592.0 107.1 L 590.0 108.4 L 587.0 109.3 L 579.0 109.7 L 571.0 109.3 L 565.0 108.3 L 557.0 106.1 L 552.0 104.4 L 542.0 99.9 L 530.7 125.0 L 530.2 127.0 L 534.0 129.4 L 541.0 132.4 L 551.0 135.4 L 560.0 137.2 L 570.0 138.3 L 579.0 138.6 L 587.0 138.3 L 595.0 137.3 L 603.0 135.2 L 612.0 131.3 L 618.0 127.3 L 624.2 121.0 L 628.3 114.0 L 630.4 107.0 L 630.8 101.0 L 630.6 97.0 L 629.3 90.0 L 627.5 86.0 L 624.6 82.0 L 620.0 77.6 L 616.0 74.7 L 610.0 71.8 L 604.0 69.8 L 596.0 67.7 L 580.0 64.4 L 573.0 62.3 L 569.8 60.0 L 569.0 58.0 L 569.1 56.0 L 570.0 54.1 L 571.1 53.0 L 573.0 51.8 L 576.0 50.9 L 580.0 50.4 L 588.0 50.5 L 596.0 51.7 L 600.0 52.7 L 606.0 54.7 L 614.0 58.3 L 615.0 57.8 L 615.4 57.0 L 625.7 32.0 L 625.5 31.0 L 625.0 30.6 L 619.0 27.8 L 613.0 25.7 L 606.0 23.8 L 600.0 22.7 L 590.0 21.6 L 583.0 21.5 Z',
    delay: 0.33,
  },
  {
    id: 'logo-h',
    outerPath:
      'M 643.0 24.0 L 642.1 25.0 L 642.1 135.0 L 642.8 136.0 L 679.1 136.0 L 679.8 135.0 L 679.8 96.0 L 681.0 94.7 L 714.4 95.0 L 715.0 135.6 L 752.0 136.0 L 752.5 135.0 L 752.5 25.0 L 752.0 24.1 L 715.0 24.4 L 714.7 63.0 L 714.0 63.6 L 681.0 63.7 L 679.8 63.0 L 679.8 25.0 L 679.0 24.0 Z',
    delay: 0.4,
  },
];

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
        transition: { duration: 0.74, ease: OSMO_EASE },
      }}
      onClick={onComplete}
      className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-white dark:bg-[#050505] text-[#0A0A0A] dark:text-white select-none cursor-pointer overflow-hidden"
    >
      {/* Exact brand wordmark wireframe draw stage */}
      <motion.div
        exit={{
          opacity: 0,
          y: -22,
          scale: 0.97,
          transition: { duration: 0.34, ease: OSMO_EASE },
        }}
        className="relative w-[min(46vw,190px)] sm:w-[320px] aspect-[860/160] flex items-center justify-center"
      >
        <svg
          viewBox="0 0 860 160"
          fill="none"
          aria-hidden="true"
          className="w-full h-full overflow-visible"
        >
          {/* Subtle dashed cap-height, baseline & dot reticle guides */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.34, 0.12] }}
            transition={{
              duration: 1.55,
              delay: 0.42,
              times: [0, 0.45, 1],
              ease: OSMO_EASE,
            }}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 5"
            vectorEffect="non-scaling-stroke"
          >
            <line x1="8" y1="24" x2="852" y2="24" />
            <line x1="8" y1="136" x2="852" y2="136" />
            <circle cx="807.9" cy="82.5" r="44" stroke="#FF721A" />
          </motion.g>

          {/* Exact 'AADESH' logo contours: wireframe draw followed by solid fill lock-in */}
          {LOGO_GLYPHS.map((glyph) => {
            const combinedFillPath = glyph.innerPath
              ? `${glyph.outerPath} ${glyph.innerPath}`
              : glyph.outerPath;

            return (
              <g key={glyph.id}>
                <motion.path
                  d={combinedFillPath}
                  fillRule="evenodd"
                  clipRule="evenodd"
                  fill="currentColor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 1.12 + glyph.delay * 0.45,
                    ease: OSMO_EASE,
                  }}
                />

                <motion.path
                  d={glyph.outerPath}
                  stroke="currentColor"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-[1.15] sm:stroke-[1.35]"
                  initial={{ pathLength: 0, opacity: 0.35 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 1.08,
                    delay: glyph.delay,
                    ease: OSMO_EASE,
                  }}
                />

                {glyph.innerPath && (
                  <motion.path
                    d={glyph.innerPath}
                    stroke="currentColor"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    vectorEffect="non-scaling-stroke"
                    className="stroke-[1.15] sm:stroke-[1.35]"
                    initial={{ pathLength: 0, opacity: 0.35 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      duration: 0.78,
                      delay: glyph.delay + 0.16,
                      ease: OSMO_EASE,
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* Exact logo signature #FF721A dot */}
          <motion.circle
            cx="807.9"
            cy="82.5"
            r="31"
            fill="#FF721A"
            initial={{ scale: 0.55, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 1.3,
              duration: 0.3,
              ease: OSMO_EASE,
            }}
            style={{ transformOrigin: '807.9px 82.5px' }}
          />
          <motion.circle
            cx="807.9"
            cy="82.5"
            r="31"
            stroke="#FF721A"
            vectorEffect="non-scaling-stroke"
            className="stroke-[1.15] sm:stroke-[1.35]"
            initial={{ pathLength: 0, opacity: 0.45 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.68, delay: 0.62, ease: OSMO_EASE }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};
