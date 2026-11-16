import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import { ARTCRAFT_EASE } from './MotionPrimitives';

type MoodMode =
  | 'tracking'
  | 'happy'
  | 'curious'
  | 'scan'
  | 'wink'
  | 'excited'
  | 'dance'
  | 'radar'
  | 'sleep';

const TRACK_SPRING = { stiffness: 280, damping: 24, mass: 0.45 };
const IDLE_SLEEP_MS = 14000;

const SECTION_PROMPTS: Record<string, { line: string; target: string; cta: string }> = {
  top: { line: 'Drag, double-click, or explore', target: '#work', cta: 'Works ↓' },
  work: { line: 'Inspecting projects & RF craft', target: '#about', cta: 'About ↓' },
  about: { line: 'Electronics meets software', target: '#experience', cta: 'Journey ↓' },
  experience: { line: 'Tracing roles & research', target: '#contact', cta: 'Contact ↓' },
  contact: { line: 'Ready to collaborate', target: '#top', cta: 'Top ↑' },
};

const SPARK_ANGLES = [0, 60, 120, 180, 240, 300];
const DANCE_BARS = [0, 1, 2, 3, 4];

export const AiCharacterMotion: React.FC = () => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const stageRef = useRef<HTMLDivElement>(null);

  const [pointerFine, setPointerFine] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearPointer, setIsNearPointer] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('top');
  const [mood, setMood] = useState<MoodMode>('tracking');
  const [pulseKey, setPulseKey] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [radarActive, setRadarActive] = useState(false);
  const [danceActive, setDanceActive] = useState(false);

  // Global cursor vector normalized relative to character center [-1, 1]
  const rawLookX = useMotionValue(0);
  const rawLookY = useMotionValue(0);
  // Proximity magnetic lean when pointer comes close to character
  const rawAttractX = useMotionValue(0);
  const rawAttractY = useMotionValue(0);

  const smoothLookX = useSpring(rawLookX, TRACK_SPRING);
  const smoothLookY = useSpring(rawLookY, TRACK_SPRING);
  const attractX = useSpring(rawAttractX, { stiffness: 220, damping: 20 });
  const attractY = useSpring(rawAttractY, { stiffness: 220, damping: 20 });

  // Scroll-velocity lean so character responds dynamically to page scrolling
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { stiffness: 180, damping: 28 });
  const scrollLean = useTransform(smoothVelocity, [-1800, 0, 1800], [-7, 0, 7]);
  const scrollDriftY = useTransform(smoothVelocity, [-1800, 0, 1800], [5, 0, -5]);

  // Eye optics & head gimbal transforms
  const eyeX = useTransform(smoothLookX, [-1, 1], [-5, 5]);
  const eyeY = useTransform(smoothLookY, [-1, 1], [-3.4, 3.4]);
  const headX = useTransform(smoothLookX, [-1, 1], [-3, 3]);
  const headY = useTransform(smoothLookY, [-1, 1], [-2.2, 2.2]);
  const headRotate = useTransform(smoothLookX, [-1, 1], [-6, 6]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Track active portfolio section cleanly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ids = ['top', 'work', 'about', 'experience', 'contact'];

    const detectSection = () => {
      const markerY = window.innerHeight * 0.4;
      let current = 'top';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= markerY) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    detectSection();
    window.addEventListener('scroll', detectSection, { passive: true });
    return () => window.removeEventListener('scroll', detectSection);
  }, []);

  // Celebrate Dark / Light theme switches cleanly
  useEffect(() => {
    if (typeof document === 'undefined' || prefersReducedMotion) return;
    let firstSnapshot = true;
    const observer = new MutationObserver(() => {
      if (firstSnapshot) {
        firstSnapshot = false;
        return;
      }
      setMood('happy');
      setPulseKey((k) => k + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    firstSnapshot = false;
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Drift into gentle sleep if idle for 14s; wake up immediately on activity
  useEffect(() => {
    if (prefersReducedMotion) return;
    let idleTimer: number | null = null;

    const resetIdle = () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      setMood((prev) => (prev === 'sleep' ? 'excited' : prev));
      idleTimer = window.setTimeout(() => {
        setMood((prev) => (prev === 'tracking' ? 'sleep' : prev));
      }, IDLE_SLEEP_MS);
    };

    resetIdle();
    window.addEventListener('pointermove', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });

    return () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      window.removeEventListener('pointermove', resetIdle);
      window.removeEventListener('scroll', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, [prefersReducedMotion]);

  // Global cursor tracking, proximity magnetic pull, and element-context reactions
  useEffect(() => {
    if (!pointerFine || prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      const node = stageRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const rawDx = e.clientX - cx;
      const rawDy = e.clientY - cy;
      const dist = Math.hypot(rawDx, rawDy);

      rawLookX.set(Math.max(-1, Math.min(1, rawDx / 320)));
      rawLookY.set(Math.max(-1, Math.min(1, rawDy / 320)));

      if (dist < 180) {
        setIsNearPointer(true);
        const factor = (1 - dist / 180) * 9;
        rawAttractX.set((rawDx / Math.max(1, dist)) * factor);
        rawAttractY.set((rawDy / Math.max(1, dist)) * factor);
      } else {
        setIsNearPointer(false);
        rawAttractX.set(0);
        rawAttractY.set(0);
      }
    };

    const handlePointerOver = (e: PointerEvent) => {
      if (isDragging || danceActive || radarActive) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-cursor="project"]')) {
        setMood((prev) => (prev === 'tracking' ? 'scan' : prev));
      } else if (
        target.closest('a[href^="mailto:"], a[href*="wa.me"], button[type="submit"]')
      ) {
        setMood((prev) => (prev === 'tracking' ? 'wink' : prev));
      } else {
        setMood((prev) => (prev === 'scan' || prev === 'wink' ? 'tracking' : prev));
      }
    };

    const handlePointerLeave = () => {
      setIsNearPointer(false);
      rawLookX.set(0);
      rawLookY.set(0);
      rawAttractX.set(0);
      rawAttractY.set(0);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [
    pointerFine,
    prefersReducedMotion,
    isDragging,
    danceActive,
    radarActive,
    rawLookX,
    rawLookY,
    rawAttractX,
    rawAttractY,
  ]);

  // Auto-settle temporary click / theme / wake moods back to live tracking
  useEffect(() => {
    if (
      mood === 'tracking' ||
      mood === 'scan' ||
      mood === 'wink' ||
      mood === 'sleep' ||
      isDragging ||
      danceActive ||
      radarActive
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setMood('tracking');
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [mood, isDragging, danceActive, radarActive]);

  useEffect(() => {
    if (!danceActive) return;
    const timer = window.setTimeout(() => {
      setDanceActive(false);
      setMood('tracking');
    }, 2100);
    return () => window.clearTimeout(timer);
  }, [danceActive]);

  useEffect(() => {
    if (!radarActive) return;
    const timer = window.setTimeout(() => {
      setRadarActive(false);
      setMood('tracking');
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [radarActive]);

  const triggerReaction = () => {
    setPulseKey((k) => k + 1);
    setDanceActive(false);
    setRadarActive(false);
    setMood((prev) => {
      if (prev === 'tracking' || prev === 'scan' || prev === 'sleep') return 'happy';
      if (prev === 'happy') return 'curious';
      if (prev === 'curious') return 'wink';
      return 'tracking';
    });
    if (!pointerFine) {
      setShowControls((s) => !s);
    }
  };

  const triggerSpin = () => {
    setPulseKey((k) => k + 1);
    setDanceActive(false);
    setRadarActive(false);
    setSpinCount((c) => c + 1);
    setMood('excited');
  };

  const triggerDance = () => {
    setPulseKey((k) => k + 1);
    setRadarActive(false);
    setDanceActive(true);
    setMood('dance');
  };

  const triggerRadar = () => {
    setPulseKey((k) => k + 1);
    setDanceActive(false);
    setRadarActive(true);
    setMood('radar');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerReaction();
    }
  };

  const activeMood: MoodMode = isDragging
    ? 'excited'
    : danceActive
      ? 'dance'
      : radarActive
        ? 'radar'
        : mood;
  const promptInfo = SECTION_PROMPTS[activeSection] ?? SECTION_PROMPTS.top;
  const controlsVisible = isHovered || showControls;

  const handleQuickJump = (targetSelector: string) => {
    const targetEl = document.querySelector(targetSelector);
    targetEl?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
    setShowControls(false);
    setMood('happy');
    setPulseKey((k) => k + 1);
  };

  return (
    <motion.div
      ref={stageRef}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
      transition={{ duration: 0.45, ease: ARTCRAFT_EASE }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowControls(false);
      }}
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex items-end gap-3 select-none"
    >
      {/* Interactive Draggable / Clickable Character Body */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Interactive robotic companion — click to react, double-click to spin, or drag to move"
        onKeyDown={handleKeyDown}
        drag={!prefersReducedMotion}
        dragSnapToOrigin
        dragElastic={0.48}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 20 }}
        onDragStart={() => {
          setIsDragging(true);
          setDanceActive(false);
          setRadarActive(false);
          setPulseKey((k) => k + 1);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setMood('happy');
          setPulseKey((k) => k + 1);
        }}
        onTap={() => {
          if (!isDragging) triggerReaction();
        }}
        onDoubleClick={triggerSpin}
        whileDrag={prefersReducedMotion ? undefined : { scale: 1.12 }}
        style={
          prefersReducedMotion
            ? undefined
            : {
                x: attractX,
                y: attractY,
              }
        }
        className="relative w-16 h-20 flex flex-col items-center justify-end cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A] rounded-2xl touch-none"
      >
        {/* Expanding Orange Pulse Wave on Click / Drag */}
        <AnimatePresence>
          {pulseKey > 0 && !prefersReducedMotion && (
            <motion.span
              key={`pulse-${pulseKey}`}
              aria-hidden="true"
              initial={{ scale: 0.55, opacity: 0.72 }}
              animate={{ scale: 1.65, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: ARTCRAFT_EASE }}
              className="pointer-events-none absolute top-3 w-14 h-14 rounded-full border border-[#FF721A]"
            />
          )}
        </AnimatePresence>

        {/* RF Radar Mode: Concentric Signal Wave Rings */}
        <AnimatePresence>
          {radarActive && !prefersReducedMotion && (
            <motion.div
              key="radar-waves"
              aria-hidden="true"
              className="pointer-events-none absolute top-2 w-16 h-16 flex items-center justify-center"
            >
              {[0, 1, 2].map((waveIdx) => (
                <motion.span
                  key={waveIdx}
                  initial={{ scale: 0.5, opacity: 0.7 }}
                  animate={{ scale: 2.3, opacity: 0 }}
                  transition={{
                    duration: 1.4,
                    delay: waveIdx * 0.35,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-full border border-[#FF721A]"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double-Click Barrel Spin Geometric Spark Burst */}
        <AnimatePresence>
          {spinCount > 0 && !prefersReducedMotion && (
            <div
              key={`burst-${spinCount}`}
              aria-hidden="true"
              className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2"
            >
              {SPARK_ANGLES.map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const tx = Math.cos(rad) * 34;
                const ty = Math.sin(rad) * 34;
                return (
                  <motion.span
                    key={angle}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.58, ease: ARTCRAFT_EASE }}
                    className="absolute block w-1.5 h-1.5 bg-[#FF721A] rounded-[2px]"
                  />
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Gentle Sleep 'z' Floating Glyphs */}
        <AnimatePresence>
          {activeMood === 'sleep' && !prefersReducedMotion && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 right-0 flex flex-col items-end font-mono font-bold text-[#C94B00] dark:text-[#FF721A]"
            >
              {[0, 1].map((zIdx) => (
                <motion.span
                  key={zIdx}
                  initial={{ opacity: 0, y: 6, scale: 0.7 }}
                  animate={{ opacity: [0, 0.9, 0], y: -12, scale: [0.75, 1, 0.85] }}
                  transition={{
                    duration: 2.2,
                    delay: zIdx * 0.9,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  className="text-[10px] leading-none"
                >
                  z
                </motion.span>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Scroll-velocity lean wrapper */}
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
          {/* Spin / Dance / Idle Levitation Wrapper */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    y: danceActive
                      ? [0, -10, 0, -8, 0]
                      : activeMood === 'sleep'
                        ? [0, -2, 0]
                        : isDragging
                          ? -4
                          : [0, -5, 0],
                    rotate: danceActive
                      ? [0, -9, 9, -7, 0]
                      : spinCount * 360,
                    scale: isHovered || isNearPointer ? 1.06 : 1,
                  }
            }
            transition={{
              y: danceActive
                ? { duration: 0.75, repeat: Infinity, ease: 'easeInOut' }
                : activeMood === 'sleep'
                  ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 3.1, repeat: Infinity, ease: 'easeInOut' },
              rotate: danceActive
                ? { duration: 0.75, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.75, ease: ARTCRAFT_EASE },
              scale: { duration: 0.22, ease: ARTCRAFT_EASE },
            }}
            className="drop-shadow-[0_10px_20px_rgba(10,10,10,0.16)] dark:drop-shadow-[0_10px_22px_rgba(0,0,0,0.75)]"
          >
            <motion.svg
              width="60"
              height="66"
              viewBox="0 0 60 66"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={
                prefersReducedMotion || activeMood === 'sleep'
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
                strokeOpacity={
                  radarActive || isHovered || isDragging ? 0.9 : activeMood === 'sleep' ? 0.2 : 0.45
                }
                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                transition={{
                  duration: radarActive ? 3 : isHovered || isDragging ? 8 : 22,
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
                    : {
                        rotate: isDragging
                          ? [-12, 12, -12]
                          : radarActive
                            ? [-14, 14, -14]
                            : isHovered
                              ? [-8, 8, -4, 0]
                              : activeMood === 'sleep'
                                ? -8
                                : [-3, 3, -3],
                      }
                }
                transition={
                  isDragging || radarActive
                    ? { duration: 0.35, repeat: Infinity, ease: 'easeInOut' }
                    : isHovered
                      ? { duration: 0.55, ease: ARTCRAFT_EASE }
                      : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
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
                <motion.circle
                  cx="30"
                  cy="7.5"
                  r="3"
                  fill="#FF721A"
                  animate={
                    radarActive && !prefersReducedMotion
                      ? { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }
                      : undefined
                  }
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ transformOrigin: '30px 7.5px', transformBox: 'view-box' }}
                />
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
                    : isDragging || danceActive
                      ? { rotate: [0, 26, -12, 26, 0] }
                      : isHovered
                        ? { y: [0, -2.5, 0] }
                        : { y: [0, 1, 0] }
                }
                transition={{
                  duration: isDragging || danceActive ? 0.5 : 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: '9px 32px', transformBox: 'view-box' }}
              />

              {/* Right stabilizer wing */}
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
                    : isDragging || danceActive
                      ? { rotate: [0, -28, 12, -28, 0] }
                      : isHovered
                        ? { rotate: [0, -30, 16, -24, 0] }
                        : { y: [0, 1, 0] }
                }
                transition={
                  isDragging || danceActive
                    ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
                    : isHovered
                      ? { duration: 0.72, ease: ARTCRAFT_EASE }
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

              {/* Expressive Visor Optics */}
              <motion.g
                style={
                  prefersReducedMotion ||
                  activeMood === 'dance' ||
                  activeMood === 'radar' ||
                  activeMood === 'sleep'
                    ? undefined
                    : {
                        x: eyeX,
                        y: eyeY,
                      }
                }
              >
                <motion.g
                  animate={
                    prefersReducedMotion ||
                    activeMood === 'dance' ||
                    activeMood === 'radar' ||
                    activeMood === 'sleep'
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
                  {activeMood === 'dance' ? (
                    // 5-bar animated equalizer visor while dancing
                    DANCE_BARS.map((barIdx) => (
                      <motion.rect
                        key={barIdx}
                        x={18 + barIdx * 5}
                        y={27}
                        width="3"
                        height="10"
                        rx="1.5"
                        fill="#FF721A"
                        animate={
                          prefersReducedMotion
                            ? undefined
                            : { scaleY: [0.35, 1.1, 0.45, 0.95, 0.35] }
                        }
                        transition={{
                          duration: 0.55,
                          delay: barIdx * 0.09,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        style={{
                          transformOrigin: `${19.5 + barIdx * 5}px 37px`,
                          transformBox: 'view-box',
                        }}
                      />
                    ))
                  ) : activeMood === 'radar' ? (
                    // Radar crosshair + rotating beam inside visor
                    <g>
                      <circle
                        cx="30"
                        cy="32"
                        r="7"
                        stroke="#FF721A"
                        strokeWidth="1.2"
                        strokeOpacity="0.45"
                      />
                      <circle cx="30" cy="32" r="2" fill="#FF721A" />
                      <motion.line
                        x1="30"
                        y1="32"
                        x2="30"
                        y2="25"
                        stroke="#FF721A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        style={{ transformOrigin: '30px 32px', transformBox: 'view-box' }}
                      />
                    </g>
                  ) : activeMood === 'sleep' ? (
                    // Resting closed eyelids
                    <>
                      <line
                        x1="20"
                        y1="32.5"
                        x2="25.5"
                        y2="32.5"
                        stroke="#FF721A"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="34.5"
                        y1="32.5"
                        x2="40"
                        y2="32.5"
                        stroke="#FF721A"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </>
                  ) : activeMood === 'happy' ? (
                    <>
                      <path
                        d="M20 33.5C21.2 30.2 24.8 30.2 26 33.5"
                        stroke="#FF721A"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M34 33.5C35.2 30.2 38.8 30.2 40 33.5"
                        stroke="#FF721A"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </>
                  ) : activeMood === 'excited' ? (
                    <>
                      <circle cx="22.8" cy="32" r="3.8" fill="#FF721A" />
                      <circle cx="37.2" cy="32" r="3.8" fill="#FF721A" />
                    </>
                  ) : activeMood === 'wink' ? (
                    <>
                      <rect
                        x="20.5"
                        y="28.5"
                        width="4.5"
                        height="7"
                        rx="2.25"
                        fill="#FF721A"
                      />
                      <path
                        d="M34 32.5C35.4 30.5 38.6 30.5 40 32.5"
                        stroke="#FF721A"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </>
                  ) : activeMood === 'scan' ? (
                    <motion.rect
                      x="18"
                      y="30.5"
                      width="24"
                      height="3"
                      rx="1.5"
                      fill="#FF721A"
                      animate={
                        prefersReducedMotion
                          ? undefined
                          : { opacity: [0.65, 1, 0.65], scaleX: [0.85, 1.05, 0.85] }
                      }
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ transformOrigin: '30px 32px', transformBox: 'view-box' }}
                    />
                  ) : activeMood === 'curious' ? (
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

              {/* Articulated torso core + active thruster glow on drag */}
              <rect
                x="21"
                y="50"
                width="18"
                height="7"
                rx="3.5"
                className="fill-[#0A0A0A] dark:fill-white"
              />
              <circle cx="30" cy="53.5" r="1.5" fill="#FF721A" />

              {isDragging && !prefersReducedMotion && (
                <motion.path
                  d="M25 58 L30 65 L35 58 Z"
                  fill="#FF721A"
                  animate={{ scaleY: [0.85, 1.25, 0.85], opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 0.25, repeat: Infinity }}
                  style={{ transformOrigin: '30px 58px', transformBox: 'view-box' }}
                />
              )}
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
                  scaleX: isDragging ? 0.55 : [1, 0.84, 1],
                  opacity: isDragging ? 0.08 : [0.22, 0.1, 0.22],
                }
          }
          transition={{
            duration: 3.1,
            repeat: isDragging ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          className="mt-1 block w-9 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white blur-[2px]"
        />
      </motion.div>

      {/* Interactive Contextual Popover & Kinetic Tricks Menu on Hover/Tap */}
      <AnimatePresence>
        {controlsVisible && !isDragging && (
          <motion.div
            key="character-actions"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, x: -8, scale: 0.96, filter: 'blur(4px)' }
            }
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -6, scale: 0.96, filter: 'blur(4px)' }
            }
            transition={{ duration: 0.22, ease: ARTCRAFT_EASE }}
            className="mb-2 p-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md shadow-xl flex flex-col gap-2"
          >
            <p className="text-[11px] font-medium text-[#525252] dark:text-[#A3A3A3] px-1">
              {promptInfo.line}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={triggerDance}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                Dance
              </button>
              <button
                type="button"
                onClick={triggerRadar}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                Radar
              </button>
              <button
                type="button"
                onClick={triggerSpin}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                Spin
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump(promptInfo.target)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                {promptInfo.cta}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
