import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import { ARTCRAFT_EASE } from './MotionPrimitives';

type MoodMode = 'tracking' | 'happy' | 'curious';

const TRACK_SPRING = { stiffness: 260, damping: 24, mass: 0.5 };

export const AiCharacterMotion: React.FC = () => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLButtonElement>(null);

  const [pointerFine, setPointerFine] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mood, setMood] = useState<MoodMode>('tracking');
  const [hopCount, setHopCount] = useState(0);

  // Global cursor vector normalized relative to character center [-1, 1]
  const rawLookX = useMotionValue(0);
  const rawLookY = useMotionValue(0);

  const smoothLookX = useSpring(rawLookX, TRACK_SPRING);
  const smoothLookY = useSpring(rawLookY, TRACK_SPRING);

  // Scroll-velocity lean so the character feels tethered to page momentum
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { stiffness: 180, damping: 28 });
  const scrollLean = useTransform(smoothVelocity, [-1800, 0, 1800], [-6, 0, 6]);
  const scrollDriftY = useTransform(smoothVelocity, [-1800, 0, 1800], [5, 0, -5]);

  // Eye optics & head gimbal transforms
  const eyeX = useTransform(smoothLookX, [-1, 1], [-4.5, 4.5]);
  const eyeY = useTransform(smoothLookY, [-1, 1], [-3.2, 3.2]);
  const headX = useTransform(smoothLookX, [-1, 1], [-2.5, 2.5]);
  const headY = useTransform(smoothLookY, [-1, 1], [-2, 2]);
  const headRotate = useTransform(smoothLookX, [-1, 1], [-5, 5]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!pointerFine || prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / 360;
      const dy = (e.clientY - cy) / 360;

      rawLookX.set(Math.max(-1, Math.min(1, dx)));
      rawLookY.set(Math.max(-1, Math.min(1, dy)));
    };

    const handlePointerLeave = () => {
      rawLookX.set(0);
      rawLookY.set(0);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [pointerFine, prefersReducedMotion, rawLookX, rawLookY]);

  // Revert playful click mood back to live cursor tracking after a short beat
  useEffect(() => {
    if (mood === 'tracking') return;
    const timer = window.setTimeout(() => {
      setMood('tracking');
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [mood]);

  const handleClick = () => {
    setHopCount((c) => c + 1);
    setMood((prev) =>
      prev === 'tracking' ? 'happy' : prev === 'happy' ? 'curious' : 'tracking'
    );
  };

  return (
    <motion.button
      ref={containerRef}
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Interactive robotic character companion"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
      transition={{ duration: 0.45, ease: ARTCRAFT_EASE }}
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 group w-16 h-20 flex flex-col items-center justify-end cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A] rounded-2xl"
    >
      {/* Articulated levitation & scroll-momentum layer */}
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                rotate: scrollLean,
                y: scrollDriftY,
              }
        }
        className="relative flex flex-col items-center"
      >
        <motion.div
          key={hopCount}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: hopCount > 0 ? [0, -14, 2, -6, 0] : [0, -5, 0],
                  scale: isHovered ? 1.07 : 1,
                }
          }
          transition={
            hopCount > 0
              ? {
                  y: { duration: 0.65, ease: ARTCRAFT_EASE },
                  scale: { duration: 0.22, ease: ARTCRAFT_EASE },
                }
              : {
                  y: {
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  scale: { duration: 0.22, ease: ARTCRAFT_EASE },
                }
          }
          className="drop-shadow-[0_10px_20px_rgba(10,10,10,0.16)] dark:drop-shadow-[0_10px_22px_rgba(0,0,0,0.75)]"
        >
          {/* Head & Chassis Gimbal */}
          <motion.svg
            width="60"
            height="64"
            viewBox="0 0 60 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    x: headX,
                    y: headY,
                    rotate: headRotate,
                  }
            }
            aria-hidden="true"
          >
            {/* Orange orbital calibration ring behind chassis */}
            <motion.circle
              cx="30"
              cy="32"
              r="25"
              stroke="#FF721A"
              strokeWidth="1"
              strokeDasharray="4 4"
              strokeOpacity="0.45"
              animate={
                prefersReducedMotion
                  ? undefined
                  : { rotate: 360 }
              }
              transition={{
                duration: 24,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ transformOrigin: '30px 32px', transformBox: 'view-box' }}
            />

            {/* Top precision antenna & orange signal orb */}
            <motion.g
              animate={
                prefersReducedMotion
                  ? undefined
                  : { rotate: isHovered ? [-8, 8, -5, 0] : [-3, 3, -3] }
              }
              transition={
                isHovered
                  ? { duration: 0.6, ease: ARTCRAFT_EASE }
                  : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
              }
              style={{ transformOrigin: '30px 18px', transformBox: 'view-box' }}
            >
              <line
                x1="30"
                y1="18"
                x2="30"
                y2="9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-[#0A0A0A] dark:text-white"
              />
              <circle cx="30" cy="7.5" r="3" fill="#FF721A" />
            </motion.g>

            {/* Left stabilizer wing */}
            <motion.rect
              x="4"
              y="26"
              width="5"
              height="12"
              rx="2.5"
              fill="#FF721A"
              animate={
                prefersReducedMotion
                  ? undefined
                  : { y: isHovered ? [0, -2, 0] : [0, 1, 0] }
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Right stabilizer wing (waves playfully on hover/click) */}
            <motion.rect
              x="51"
              y="26"
              width="5"
              height="12"
              rx="2.5"
              fill="#FF721A"
              animate={
                prefersReducedMotion
                  ? undefined
                  : isHovered
                    ? { rotate: [0, -28, 16, -22, 0] }
                    : { y: [0, 1, 0] }
              }
              transition={
                isHovered
                  ? { duration: 0.75, ease: ARTCRAFT_EASE }
                  : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
              }
              style={{ transformOrigin: '51px 32px', transformBox: 'view-box' }}
            />

            {/* Main architectural head shell */}
            <rect
              x="9"
              y="17"
              width="42"
              height="31"
              rx="12"
              className="fill-[#0A0A0A] dark:fill-white stroke-[#262626] dark:stroke-[#E5E5E5]"
              strokeWidth="1.5"
            />

            {/* Recessed visor aperture */}
            <rect
              x="14"
              y="22"
              width="32"
              height="20"
              rx="7"
              className="fill-[#141414] dark:fill-[#0A0A0A]"
            />

            {/* Interactive Expressive Eyes (follow pointer + periodic natural blink) */}
            <motion.g
              style={
                prefersReducedMotion
                  ? undefined
                  : {
                      x: eyeX,
                      y: eyeY,
                    }
              }
            >
              <motion.g
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scaleY: [1, 1, 1, 0.08, 1, 1] }
                }
                transition={{
                  duration: 4.4,
                  repeat: Infinity,
                  times: [0, 0.78, 0.84, 0.87, 0.91, 1],
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: '30px 32px', transformBox: 'view-box' }}
              >
                {mood === 'happy' ? (
                  <>
                    <path
                      d="M20 33C21.2 30.2 24.8 30.2 26 33"
                      stroke="#FF721A"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M34 33C35.2 30.2 38.8 30.2 40 33"
                      stroke="#FF721A"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </>
                ) : mood === 'curious' ? (
                  <>
                    <circle cx="23" cy="32" r="3.4" fill="#FF721A" />
                    <rect
                      x="33.5"
                      y="30.5"
                      width="6.5"
                      height="3"
                      rx="1.5"
                      fill="#FF721A"
                    />
                  </>
                ) : (
                  <>
                    <rect
                      x="20.5"
                      y="28.5"
                      width="4.5"
                      height="7"
                      rx="2.25"
                      fill="#FF721A"
                    />
                    <rect
                      x="35"
                      y="28.5"
                      width="4.5"
                      height="7"
                      rx="2.25"
                      fill="#FF721A"
                    />
                  </>
                )}
              </motion.g>
            </motion.g>

            {/* Compact articulated torso core below head */}
            <rect
              x="21"
              y="50"
              width="18"
              height="7"
              rx="3.5"
              className="fill-[#0A0A0A] dark:fill-white"
            />
            <circle cx="30" cy="53.5" r="1.5" fill="#FF721A" />
          </motion.svg>
        </motion.div>
      </motion.div>

      {/* Grounded levitation shadow synced to float cycle */}
      <motion.span
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scaleX: [1, 0.84, 1],
                opacity: [0.22, 0.1, 0.22],
              }
        }
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="mt-1 block w-9 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white blur-[2px]"
      />
    </motion.button>
  );
};
