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
      {/* Layer 1: Orthogonal 96px architectural drafting grid lines */}
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
        className="absolute -inset-36 blueprint-grid-lines"
      />

      {/* Layer 2: Base architectural drafting dot-grid plane with mouse + scroll parallax */}
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

      {/* Layer 3: ReFactory-inspired technical background SVG geometry & traveling #FF721A energy beams */}
      <motion.svg
        data-background-svg=""
        viewBox="0 0 1440 960"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={
          prefersReducedMotion
            ? undefined
            : {
                x: allowInteractive ? gridShiftX : 0,
                y: allowInteractive ? combinedY : scrollShiftY,
                willChange: 'transform',
              }
        }
        className="absolute inset-0 w-full h-full text-[#0A0A0A]/[0.075] dark:text-white/[0.085]"
      >
        {/* Geometric orbital reference arcs & dashed diagonal vectors */}
        <circle
          cx="1168"
          cy="240"
          r="216"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="6 8"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx="260"
          cy="740"
          r="168"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 10"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 1020 -60 L -40 1000"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="10 6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 420 -80 L 1480 980"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="10 6"
          vectorEffect="non-scaling-stroke"
        />

        {/* Orthogonal structural datum tracks */}
        <line
          x1="0"
          y1="288"
          x2="1440"
          y2="288"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="0"
          y1="672"
          x2="1440"
          y2="672"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="480"
          y1="0"
          x2="480"
          y2="960"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="1056"
          y1="0"
          x2="1056"
          y2="960"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Calibration intersection square nodes */}
        <rect
          x="477"
          y="285"
          width="6"
          height="6"
          className="fill-white dark:fill-black"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x="1053"
          y="285"
          width="6"
          height="6"
          className="fill-white dark:fill-black"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x="477"
          y="669"
          width="6"
          height="6"
          className="fill-white dark:fill-black"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x="1053"
          y="669"
          width="6"
          height="6"
          className="fill-white dark:fill-black"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Animated #FF721A signal beam sweeps (paused in reduced motion) */}
        {!prefersReducedMotion && (
          <>
            <motion.line
              x1="0"
              y1="288"
              x2="1440"
              y2="288"
              stroke="#FF721A"
              strokeOpacity="0.48"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="160 1440"
              vectorEffect="non-scaling-stroke"
              animate={{ strokeDashoffset: [160, -1440] }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                repeatDelay: 2.2,
                ease: 'linear',
              }}
            />
            <motion.line
              x1="1440"
              y1="672"
              x2="0"
              y2="672"
              stroke="#FF721A"
              strokeOpacity="0.42"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="140 1440"
              vectorEffect="non-scaling-stroke"
              animate={{ strokeDashoffset: [140, -1440] }}
              transition={{
                duration: 5.4,
                delay: 1.6,
                repeat: Infinity,
                repeatDelay: 2.8,
                ease: 'linear',
              }}
            />
            <motion.line
              x1="480"
              y1="0"
              x2="480"
              y2="960"
              stroke="#FF721A"
              strokeOpacity="0.38"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="110 960"
              vectorEffect="non-scaling-stroke"
              animate={{ strokeDashoffset: [110, -960] }}
              transition={{
                duration: 4.2,
                delay: 0.9,
                repeat: Infinity,
                repeatDelay: 3.1,
                ease: 'linear',
              }}
            />
            <motion.path
              d="M 1020 -60 L -40 1000"
              stroke="#FF721A"
              strokeOpacity="0.34"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="130 1500"
              vectorEffect="non-scaling-stroke"
              animate={{ strokeDashoffset: [130, -1500] }}
              transition={{
                duration: 5.8,
                delay: 2.4,
                repeat: Infinity,
                repeatDelay: 3.4,
                ease: 'linear',
              }}
            />
          </>
        )}
      </motion.svg>

      {/* Layer 4: Reactive #FF721A dot illumination anchored in viewport space around pointer */}
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
