import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ARTCRAFT_EASE } from './MotionPrimitives';

export type SectionViewportPhase = 'visible' | 'exited-above' | 'exited-below';

interface SectionExitMotionProps {
  sectionId: string;
  children: React.ReactNode;
  initialVisible?: boolean;
  className?: string;
}

const SECTION_VARIANTS = {
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  'exited-above': {
    opacity: 0,
    y: -28,
    scale: 0.985,
  },
  'exited-below': {
    opacity: 0,
    y: 22,
    scale: 0.988,
  },
} as const;

/**
 * Observes a static outer sentinel container with IntersectionObserver and animates
 * the inner motion surface so major page sections gracefully slide and fade out
 * as the user scrolls past them, while preserving sticky children and layout flow.
 */
export const SectionExitMotion: React.FC<SectionExitMotionProps> = ({
  sectionId,
  children,
  initialVisible = false,
  className = '',
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<SectionViewportPhase>(() =>
    initialVisible || prefersReducedMotion ? 'visible' : 'visible'
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase('visible');
      return;
    }

    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setPhase('visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry || entry.boundingClientRect.height === 0) return;

        if (entry.isIntersecting) {
          setPhase('visible');
          return;
        }

        const rootTop = entry.rootBounds
          ? entry.rootBounds.top
          : window.innerHeight * 0.14;

        if (entry.boundingClientRect.bottom <= rootTop + 4) {
          setPhase('exited-above');
        } else {
          setPhase('exited-below');
        }
      },
      {
        // Trigger exit just below the sticky header band when scrolling past,
        // while entering cleanly before child whileInView triggers fire.
        rootMargin: '-14% 0px -2% 0px',
        threshold: [0, 0.01],
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div
        data-section-viewport={sectionId}
        data-exit-phase="visible"
        className={className}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={sentinelRef}
      data-section-viewport={sectionId}
      data-exit-phase={phase}
      onFocusCapture={() => {
        if (phase !== 'visible') {
          setPhase('visible');
        }
      }}
      className={className}
    >
      <motion.div
        initial={false}
        animate={phase}
        variants={SECTION_VARIANTS}
        transition={{
          duration: phase === 'visible' ? 0.58 : 0.52,
          ease: ARTCRAFT_EASE,
        }}
        style={{
          transformOrigin:
            phase === 'exited-above' ? '50% 100%' : '50% 0%',
          willChange: phase === 'visible' ? 'auto' : 'transform, opacity',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
