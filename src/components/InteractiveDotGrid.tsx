import React, { useEffect, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

const GRID_SPRING = { stiffness: 140, damping: 24, mass: 0.8 };
const SCROLL_SPRING = { stiffness: 120, damping: 26, mass: 0.5 };
const SPOTLIGHT_SPRING = { stiffness: 220, damping: 28, mass: 0.45 };

export const InteractiveDotGrid: React.FC = () => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [pointerFine, setPointerFine] = useState(false);
  const [cursorActive, setCursorActive] = useState(false);

  // Page-level vertical scroll parallax for spatial blueprint depth
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, SCROLL_SPRING);
  const scrollShiftY = useTransform(smoothScrollProgress, [0, 1], [0, -112]);

  // Normalized viewport offset [-0.5, 0.5] for subtle mouse parallax
  const normX = useMotionValue(0);
  const normY = useMotionValue(0);
  const smoothNormX = useSpring(normX, GRID_SPRING);
  const smoothNormY = useSpring(normY, GRID_SPRING);

  const gridShiftX = useTransform(smoothNormX, [-0.5, 0.5], [10, -10]);
  const mouseShiftY = useTransform(smoothNormY, [-0.5, 0.5], [10, -10]);

  const combinedY = useTransform(
    [mouseShiftY, scrollShiftY],
    ([mouse, scroll]: number[]) => mouse + scroll
  );

  // Smooth cursor pixel coordinates in viewport space for local #FF721A illumination
  const rawPointerX = useMotionValue(-400);
  const rawPointerY = useMotionValue(-400);
  const glowX = useSpring(rawPointerX, SPOTLIGHT_SPRING);
  const glowY = useSpring(rawPointerY, SPOTLIGHT_SPRING);

  const spotlightMask = useMotionTemplate`radial-gradient(260px circle at ${glowX}px ${glowY}px, black 0%, transparent 72%)`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const allowInteractive = pointerFine && !prefersReducedMotion;

  useEffect(() => {
    if (!allowInteractive) {
      setCursorActive(false);
      normX.set(0);
      normY.set(0);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;

      setCursorActive(true);
      normX.set(Math.max(-0.5, Math.min(0.5, e.clientX / vw - 0.5)));
      normY.set(Math.max(-0.5, Math.min(0.5, e.clientY / vh - 0.5)));

      rawPointerX.set(e.clientX);
      rawPointerY.set(e.clientY);
    };

    const handlePointerLeave = () => {
      setCursorActive(false);
      normX.set(0);
      normY.set(0);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [allowInteractive, normX, normY, rawPointerX, rawPointerY]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Base architectural drafting dot-grid plane with mouse + scroll parallax */}
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                x: allowInteractive ? gridShiftX : 0,
                y: allowInteractive ? combinedY : scrollShiftY,
                willChange: 'transform',
              }
        }
        className="absolute -inset-36 dot-grid-base"
      />

      {/* Reactive #FF721A dot illumination anchored in viewport space around pointer */}
      {allowInteractive && (
        <motion.div
          style={{
            maskImage: spotlightMask,
            WebkitMaskImage: spotlightMask,
            opacity: cursorActive ? 1 : 0,
            willChange: 'opacity',
          }}
          className="fixed inset-0 overflow-hidden transition-opacity duration-300"
        >
          <motion.div
            style={{
              x: gridShiftX,
              y: combinedY,
              willChange: 'transform',
            }}
            className="absolute -inset-36 dot-grid-accent"
          />
        </motion.div>
      )}
    </div>
  );
};
