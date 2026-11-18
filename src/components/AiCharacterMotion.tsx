import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { playCompanionCue } from '../utils/spatialAudio';

type MoodMode =
  | 'tracking'
  | 'happy'
  | 'love'
  | 'laugh'
  | 'curious'
  | 'surprised'
  | 'shy'
  | 'cool'
  | 'proud'
  | 'dizzy'
  | 'scan'
  | 'wink'
  | 'excited'
  | 'dance'
  | 'radar'
  | 'wave'
  | 'overdrive'
  | 'sleep';

type ThoughtGlyph =
  | 'spark'
  | 'theme'
  | 'signal'
  | 'heart'
  | 'bolt'
  | 'music'
  | 'exclaim'
  | 'dizzy'
  | null;

const TRACK_SPRING = { stiffness: 280, damping: 24, mass: 0.45 };
const ROAM_SPRING = { stiffness: 90, damping: 20, mass: 0.9 };
const IDLE_SLEEP_MS = 14000;

const SECTION_PROMPTS: Record<string, { line: string; target: string; cta: string }> = {
  about: { line: 'Electronics meets software', target: '#work', cta: 'Works ↓' },
  work: { line: 'Inspecting projects & RF craft', target: '#experience', cta: 'Journey ↓' },
  experience: { line: 'Tracing roles & research', target: '#contact', cta: 'Contact ↓' },
  contact: { line: 'Ready to collaborate', target: '#top', cta: 'Top ↑' },
};

const SPARK_ANGLES = [0, 60, 120, 180, 240, 300];
const OVERDRIVE_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const DANCE_BARS = [0, 1, 2, 3, 4];
const EMOTION_PRESETS: { id: MoodMode; label: string; glyph: ThoughtGlyph }[] = [
  { id: 'happy', label: 'Happy', glyph: 'spark' },
  { id: 'love', label: 'Love', glyph: 'heart' },
  { id: 'laugh', label: 'Laugh', glyph: 'spark' },
  { id: 'cool', label: 'Cool', glyph: null },
  { id: 'shy', label: 'Shy', glyph: null },
  { id: 'surprised', label: 'Whoa', glyph: 'exclaim' },
];

export const AiCharacterMotion: React.FC = () => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const stageRef = useRef<HTMLDivElement>(null);
  const tapComboRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; t: number }>({ x: 0, y: 0, t: 0 });
  const celebratedBottomRef = useRef(false);
  const thoughtTimerRef = useRef<number | null>(null);

  const [pointerFine, setPointerFine] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearPointer, setIsNearPointer] = useState(false);
  const [isFastPointer, setIsFastPointer] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('about');
  const [mood, setMood] = useState<MoodMode>('tracking');
  const [thought, setThought] = useState<ThoughtGlyph>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [hopKey, setHopKey] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [overdriveCount, setOverdriveCount] = useState(0);
  const [radarActive, setRadarActive] = useState(false);
  const [danceActive, setDanceActive] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const [roamActive, setRoamActive] = useState(false);
  const [roamFacing, setRoamFacing] = useState<1 | -1>(1);

  // Global cursor vector normalized relative to character center [-1, 1]
  const rawLookX = useMotionValue(0);
  const rawLookY = useMotionValue(0);
  // Proximity magnetic lean when pointer comes close to character
  const rawAttractX = useMotionValue(0);
  const rawAttractY = useMotionValue(0);
  // Autonomous roam / keyboard nudge offset
  const rawRoamX = useMotionValue(0);
  const rawRoamY = useMotionValue(0);

  const smoothLookX = useSpring(rawLookX, TRACK_SPRING);
  const smoothLookY = useSpring(rawLookY, TRACK_SPRING);
  const attractX = useSpring(rawAttractX, { stiffness: 220, damping: 20 });
  const attractY = useSpring(rawAttractY, { stiffness: 220, damping: 20 });
  const roamX = useSpring(rawRoamX, ROAM_SPRING);
  const roamY = useSpring(rawRoamY, ROAM_SPRING);
  const roamVelocityX = useVelocity(roamX);
  const roamTilt = useTransform(roamVelocityX, [-260, 0, 260], [-10, 0, 10]);

  // Scroll-velocity lean & celebratory bottom detection
  const { scrollY, scrollYProgress } = useScroll();
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

  const flashThought = useCallback((glyph: ThoughtGlyph, durationMs = 1500) => {
    if (thoughtTimerRef.current !== null) {
      window.clearTimeout(thoughtTimerRef.current);
    }
    setThought(glyph);
    thoughtTimerRef.current = window.setTimeout(() => {
      setThought(null);
      thoughtTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (thoughtTimerRef.current !== null) {
        window.clearTimeout(thoughtTimerRef.current);
      }
    };
  }, []);

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
    const ids = ['about', 'work', 'experience', 'contact'];

    const detectSection = () => {
      const markerY = window.innerHeight * 0.4;
      let current = 'about';
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

  // Celebrate reaching the bottom contact anchor of the page once per visit
  useEffect(() => {
    if (prefersReducedMotion) return;
    const unsub = scrollYProgress.on('change', (latest) => {
      if (latest > 0.96 && !celebratedBottomRef.current) {
        celebratedBottomRef.current = true;
        setHopKey((k) => k + 1);
        setPulseKey((k) => k + 1);
        setMood('excited');
        flashThought('heart', 1800);
      } else if (latest < 0.78) {
        celebratedBottomRef.current = false;
      }
    });
    return () => unsub();
  }, [scrollYProgress, prefersReducedMotion, flashThought]);

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
      setHopKey((k) => k + 1);
      flashThought('theme', 1400);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    firstSnapshot = false;
    return () => observer.disconnect();
  }, [prefersReducedMotion, flashThought]);

  // Autonomous patrol glide along the bottom edge when Roam Mode is toggled
  useEffect(() => {
    if (!roamActive || prefersReducedMotion || typeof window === 'undefined') {
      rawRoamX.set(0);
      rawRoamY.set(0);
      return;
    }

    let cancelled = false;
    const stepPatrol = () => {
      if (cancelled) return;
      const maxSpan = Math.max(80, Math.min(340, window.innerWidth - 220));
      const nextX = Math.round(Math.random() * maxSpan);
      const currentX = rawRoamX.get();
      setRoamFacing(nextX >= currentX ? 1 : -1);
      rawRoamX.set(nextX);
      rawRoamY.set(-Math.round(Math.random() * 14));

      // Occasionally trigger an inquisitive look or micro radar ping mid-patrol
      const roll = Math.random();
      if (roll < 0.25) {
        setMood('curious');
      } else if (roll < 0.42) {
        setMood('wave');
        flashThought('signal', 1400);
      }
    };

    stepPatrol();
    const interval = window.setInterval(stepPatrol, 2600);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roamActive, prefersReducedMotion, rawRoamX, rawRoamY, flashThought]);

  // Drift into gentle sleep if idle for 14s; wake up immediately on activity
  useEffect(() => {
    if (prefersReducedMotion) return;
    let idleTimer: number | null = null;

    const resetIdle = () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      setMood((prev) => (prev === 'sleep' ? 'excited' : prev));
      idleTimer = window.setTimeout(() => {
        setMood((prev) =>
          prev === 'tracking' && !roamActive ? 'sleep' : prev
        );
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
  }, [prefersReducedMotion, roamActive]);

  // Global cursor tracking, velocity reaction, proximity magnetic pull, and element reactions
  useEffect(() => {
    if (!pointerFine || prefersReducedMotion) return;
    let fastTimer: number | null = null;

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

      // Detect rapid cursor whips near companion to flare stabilizer wings
      const now = performance.now();
      const dt = Math.max(8, now - lastPointerRef.current.t);
      const pSpeed =
        Math.hypot(
          e.clientX - lastPointerRef.current.x,
          e.clientY - lastPointerRef.current.y
        ) / dt;
      lastPointerRef.current = { x: e.clientX, y: e.clientY, t: now };

      if (pSpeed > 2.4 && dist < 360) {
        setIsFastPointer(true);
        setMood((prev) => (prev === 'tracking' || prev === 'sleep' ? 'surprised' : prev));
        if (fastTimer !== null) window.clearTimeout(fastTimer);
        fastTimer = window.setTimeout(() => setIsFastPointer(false), 320);
      }

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
      if (isDragging || danceActive || radarActive || waveActive) return;
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
      setIsFastPointer(false);
      rawLookX.set(0);
      rawLookY.set(0);
      rawAttractX.set(0);
      rawAttractY.set(0);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    return () => {
      if (fastTimer !== null) window.clearTimeout(fastTimer);
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
    waveActive,
    rawLookX,
    rawLookY,
    rawAttractX,
    rawAttractY,
  ]);

  // Gently blush if user lingers directly over the companion
  useEffect(() => {
    if (!isHovered || isDragging || prefersReducedMotion) return;
    const shyTimer = window.setTimeout(() => {
      setMood((prev) => (prev === 'tracking' || prev === 'happy' ? 'shy' : prev));
    }, 2200);
    return () => window.clearTimeout(shyTimer);
  }, [isHovered, isDragging, prefersReducedMotion]);

  // Auto-settle temporary click / theme / wake moods back to live tracking
  useEffect(() => {
    if (
      mood === 'tracking' ||
      mood === 'scan' ||
      mood === 'wink' ||
      mood === 'sleep' ||
      isDragging ||
      danceActive ||
      radarActive ||
      waveActive
    ) {
      return;
    }
    const duration =
      mood === 'overdrive'
        ? 2500
        : mood === 'cool' || mood === 'love' || mood === 'proud'
          ? 2800
          : 2100;
    const timer = window.setTimeout(() => {
      setMood('tracking');
    }, duration);
    return () => window.clearTimeout(timer);
  }, [mood, isDragging, danceActive, radarActive, waveActive]);

  useEffect(() => {
    if (!danceActive) return;
    const timer = window.setTimeout(() => {
      setDanceActive(false);
      setMood('tracking');
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [danceActive]);

  useEffect(() => {
    if (!radarActive) return;
    const timer = window.setTimeout(() => {
      setRadarActive(false);
      setMood('tracking');
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [radarActive]);

  useEffect(() => {
    if (!waveActive) return;
    const timer = window.setTimeout(() => {
      setWaveActive(false);
      setMood('tracking');
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [waveActive]);

  const spinDizzyTimerRef = useRef<number | null>(null);

  const clearDizzyTimer = useCallback(() => {
    if (spinDizzyTimerRef.current !== null) {
      window.clearTimeout(spinDizzyTimerRef.current);
      spinDizzyTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearDizzyTimer();
    };
  }, [clearDizzyTimer]);

  const triggerOverdrive = useCallback(() => {
    clearDizzyTimer();
    playCompanionCue('overdrive', stageRef.current);
    setPulseKey((k) => k + 1);
    setHopKey((k) => k + 1);
    setOverdriveCount((c) => c + 1);
    setSpinCount((c) => c + 2);
    setDanceActive(false);
    setRadarActive(false);
    setWaveActive(false);
    setMood('overdrive');
    flashThought('bolt', 2200);
  }, [clearDizzyTimer, flashThought]);

  const selectEmotion = useCallback(
    (nextMood: MoodMode, glyph: ThoughtGlyph = null) => {
      clearDizzyTimer();
      setPulseKey((k) => k + 1);
      setHopKey((k) => k + 1);
      setDanceActive(false);
      setRadarActive(false);
      setWaveActive(false);
      setMood(nextMood);
      if (glyph) {
        flashThought(glyph, 1600);
      }
    },
    [clearDizzyTimer, flashThought]
  );

  const triggerReaction = () => {
    const now = performance.now();
    if (now - tapComboRef.current.lastTime < 460) {
      tapComboRef.current.count += 1;
    } else {
      tapComboRef.current.count = 1;
    }
    tapComboRef.current.lastTime = now;

    if (tapComboRef.current.count >= 5) {
      tapComboRef.current.count = 0;
      triggerOverdrive();
      return;
    }

    clearDizzyTimer();
    setPulseKey((k) => k + 1);
    setHopKey((k) => k + 1);
    setDanceActive(false);
    setRadarActive(false);
    setWaveActive(false);

    let nextMood: MoodMode = 'tracking';
    if (mood === 'tracking' || mood === 'scan' || mood === 'sleep') {
      nextMood = 'happy';
    } else if (mood === 'happy') {
      nextMood = 'love';
      flashThought('heart', 1200);
    } else if (mood === 'love') {
      nextMood = 'laugh';
    } else if (mood === 'laugh') {
      nextMood = 'curious';
    } else if (mood === 'curious') {
      nextMood = 'wink';
    } else if (mood === 'wink') {
      nextMood = 'cool';
    } else if (mood === 'cool') {
      nextMood = 'proud';
    } else if (mood === 'proud') {
      nextMood = 'surprised';
      flashThought('exclaim', 1100);
    }

    playCompanionCue('tap', stageRef.current);
    setMood(nextMood);
    if (!pointerFine) {
      setShowControls((s) => !s);
    }
  };

  const triggerSpin = () => {
    clearDizzyTimer();
    playCompanionCue('spin', stageRef.current);
    setPulseKey((k) => k + 1);
    setHopKey((k) => k + 1);
    setDanceActive(false);
    setRadarActive(false);
    setWaveActive(false);
    setSpinCount((c) => c + 1);
    setMood('excited');
    flashThought('spark', 900);

    spinDizzyTimerRef.current = window.setTimeout(() => {
      setMood('dizzy');
      flashThought('dizzy', 1400);
      spinDizzyTimerRef.current = null;
    }, 680);
  };

  const triggerDance = () => {
    clearDizzyTimer();
    setPulseKey((k) => k + 1);
    setRadarActive(false);
    setWaveActive(false);
    setDanceActive(true);
    setMood('dance');
    flashThought('music', 1800);
  };

  const triggerRadar = () => {
    clearDizzyTimer();
    setPulseKey((k) => k + 1);
    setDanceActive(false);
    setWaveActive(false);
    setRadarActive(true);
    setMood('radar');
    flashThought('signal', 1800);
  };

  const triggerWave = () => {
    setPulseKey((k) => k + 1);
    setDanceActive(false);
    setRadarActive(false);
    setWaveActive(true);
    setMood('wave');
    flashThought('signal', 1800);
  };

  const toggleRoam = () => {
    setPulseKey((k) => k + 1);
    setRoamActive((prev) => {
      const next = !prev;
      setMood(next ? 'curious' : 'happy');
      if (next) flashThought('spark', 1200);
      return next;
    });
  };

  // Interactive keyboard micro-pilot when companion has focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 28;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.key === ' ') {
        setHopKey((k) => k + 1);
        setPulseKey((k) => k + 1);
        setMood('excited');
      } else {
        triggerReaction();
      }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      setRoamFacing(1);
      rawRoamX.set(Math.min(280, rawRoamX.get() + step));
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      setRoamFacing(-1);
      rawRoamX.set(Math.max(0, rawRoamX.get() - step));
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      rawRoamY.set(Math.max(-96, rawRoamY.get() - step));
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      rawRoamY.set(Math.min(0, rawRoamY.get() + step));
    }
  };

  const activeMood: MoodMode = isDragging
    ? 'excited'
    : danceActive
      ? 'dance'
      : radarActive
        ? 'radar'
        : waveActive
          ? 'wave'
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
    setHopKey((k) => k + 1);
    setPulseKey((k) => k + 1);
  };

  const showThruster = !prefersReducedMotion && (isDragging || roamActive || isFastPointer);

  return (
    <motion.div
      ref={stageRef}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
      transition={{ duration: 0.45, ease: ARTCRAFT_EASE }}
      style={
        prefersReducedMotion
          ? undefined
          : {
              x: roamX,
              y: roamY,
            }
      }
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
        aria-label="Interactive robotic companion — click to react, tap 5x for overdrive, double-click to spin, drag to move, or use arrow keys"
        onKeyDown={handleKeyDown}
        drag={!prefersReducedMotion}
        dragSnapToOrigin
        dragElastic={0.48}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 20 }}
        onDragStart={() => {
          setIsDragging(true);
          setDanceActive(false);
          setRadarActive(false);
          setWaveActive(false);
          setPulseKey((k) => k + 1);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setHopKey((k) => k + 1);
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
                rotate: roamTilt,
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

        {/* RF Radar / Oscilloscope Signal Wave Rings */}
        <AnimatePresence>
          {(radarActive || waveActive) && !prefersReducedMotion && (
            <motion.div
              key="radar-waves"
              aria-hidden="true"
              className="pointer-events-none absolute top-2 w-16 h-16 flex items-center justify-center"
            >
              {[0, 1, 2].map((waveIdx) => (
                <motion.span
                  key={waveIdx}
                  initial={{ scale: 0.5, opacity: 0.7 }}
                  animate={{ scale: 2.35, opacity: 0 }}
                  transition={{
                    duration: waveActive ? 1.1 : 1.4,
                    delay: waveIdx * 0.32,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-full border border-[#FF721A]"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double-Click Barrel Spin & Overdrive 5x Tap Geometric Spark Burst */}
        <AnimatePresence>
          {overdriveCount > 0 && !prefersReducedMotion ? (
            <div
              key={`overdrive-${overdriveCount}`}
              aria-hidden="true"
              className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2"
            >
              {OVERDRIVE_ANGLES.map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const radius = i % 2 === 0 ? 46 : 32;
                const tx = Math.cos(rad) * radius;
                const ty = Math.sin(rad) * radius;
                return (
                  <motion.span
                    key={angle}
                    initial={{ x: 0, y: 0, scale: 1.2, opacity: 1, rotate: 0 }}
                    animate={{ x: tx, y: ty, scale: 0, opacity: 0, rotate: 180 }}
                    transition={{ duration: 0.72, ease: ARTCRAFT_EASE }}
                    className={`absolute block ${
                      i % 2 === 0
                        ? 'w-2 h-2 bg-[#FF721A] rounded-[2px]'
                        : 'w-1.5 h-1.5 bg-[#0A0A0A] dark:bg-white rounded-full'
                    }`}
                  />
                );
              })}
            </div>
          ) : (
            spinCount > 0 &&
            !prefersReducedMotion && (
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
            )
          )}
        </AnimatePresence>

        {/* Minimal Symbolic Thought Glyph Bubble (zero text clutter) */}
        <AnimatePresence>
          {thought && !prefersReducedMotion && (
            <motion.div
              key={`thought-${thought}`}
              aria-hidden="true"
              initial={{ opacity: 0, y: 8, scale: 0.6 }}
              animate={{ opacity: 1, y: -6, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.7 }}
              transition={{ duration: 0.32, ease: ARTCRAFT_EASE }}
              className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border border-[#FF721A]/80 bg-white dark:bg-[#0A0A0A] shadow-md flex items-center justify-center text-[#FF721A]"
            >
              {thought === 'theme' && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3.5" fill="currentColor" />
                  <path
                    d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {thought === 'bolt' && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M9 1L3 9H8L7 15L13 7H8L9 1Z" />
                </svg>
              )}
              {thought === 'signal' && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8C3.5 4 5.5 4 7 8C8.5 12 10.5 12 12 8C13 5.5 13.8 5.5 14.5 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {thought === 'heart' && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 14s-5.5-3.4-5.5-7.4C2.5 4.5 4.1 3 6 3c1.1 0 1.7.6 2 1.2C8.3 3.6 8.9 3 10 3c1.9 0 3.5 1.5 3.5 3.6C13.5 10.6 8 14 8 14Z" />
                </svg>
              )}
              {thought === 'spark' && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L9.8 6.2L15 8L9.8 9.8L8 15L6.2 9.8L1 8L6.2 6.2L8 1Z" />
                </svg>
              )}
              {thought === 'music' && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 12.2a2.2 2.2 0 1 1-1.2-1.96V4.1l8-1.6v7.1a2.2 2.2 0 1 1-1.2-1.96V4.7L6 5.82v6.38Z" />
                </svg>
              )}
              {thought === 'exclaim' && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="7" y="2" width="2" height="8" rx="1" />
                  <circle cx="8" cy="13" r="1.3" />
                </svg>
              )}
              {thought === 'dizzy' && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8.4 8.2c0-.9.8-1.5 1.6-1.3 1.2.3 1.7 1.7 1.2 2.8-.7 1.5-2.7 2-4.2 1.2-1.9-1-2.5-3.4-1.4-5.2 1.3-2.2 4.3-2.9 6.5-1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </motion.div>
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
          {/* Hop / Squash-and-Stretch Impulse Wrapper */}
          <motion.div
            key={`hop-${hopKey}`}
            initial={
              hopKey > 0 && !prefersReducedMotion
                ? { y: 0, scaleX: 1.18, scaleY: 0.82 }
                : false
            }
            animate={
              hopKey > 0 && !prefersReducedMotion
                ? {
                    y: [0, -14, 0],
                    scaleX: [1.18, 0.9, 1.06, 1],
                    scaleY: [0.82, 1.14, 0.94, 1],
                  }
                : undefined
            }
            transition={{ duration: 0.44, ease: ARTCRAFT_EASE }}
          >
            {/* Spin / Dance / Emotional Levitation Wrapper */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: danceActive
                        ? [0, -10, 0, -8, 0]
                        : activeMood === 'laugh'
                          ? [0, -4, 0, -3, 0]
                          : activeMood === 'sleep'
                            ? [0, -2, 0]
                            : isDragging
                              ? -4
                              : [0, -5, 0],
                      rotate: danceActive
                        ? [0, -9, 9, -7, 0]
                        : activeMood === 'dizzy'
                          ? [0, -8, 8, -5, 0]
                          : activeMood === 'shy'
                            ? [0, -5, 4, -3, 0]
                            : spinCount * 360 + (roamActive ? roamFacing * 3 : 0),
                      scale:
                        activeMood === 'surprised'
                          ? 1.09
                          : isHovered || isNearPointer
                            ? 1.06
                            : 1,
                    }
              }
              transition={{
                y: danceActive
                  ? { duration: 0.75, repeat: Infinity, ease: 'easeInOut' }
                  : activeMood === 'laugh'
                    ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' }
                    : activeMood === 'sleep'
                      ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 3.1, repeat: Infinity, ease: 'easeInOut' },
                rotate: danceActive
                  ? { duration: 0.75, repeat: Infinity, ease: 'easeInOut' }
                  : activeMood === 'dizzy'
                    ? { duration: 0.65, repeat: Infinity, ease: 'easeInOut' }
                    : activeMood === 'shy'
                      ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
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
                  strokeDasharray={activeMood === 'overdrive' ? '2 3' : '4 4'}
                  strokeOpacity={
                    radarActive || waveActive || activeMood === 'overdrive' || isHovered || isDragging
                      ? 0.92
                      : activeMood === 'sleep'
                        ? 0.2
                        : 0.45
                  }
                  animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                  transition={{
                    duration:
                      activeMood === 'overdrive'
                        ? 1.4
                        : radarActive || waveActive
                          ? 3
                          : isHovered || isDragging
                            ? 8
                            : 22,
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
                          rotate: isDragging || activeMood === 'overdrive'
                            ? [-15, 15, -15]
                            : radarActive || waveActive
                              ? [-14, 14, -14]
                              : isHovered || isFastPointer
                                ? [-10, 10, -4, 0]
                                : activeMood === 'sleep'
                                  ? -8
                                  : [-3, 3, -3],
                        }
                  }
                  transition={
                    isDragging || radarActive || waveActive || activeMood === 'overdrive'
                      ? { duration: 0.32, repeat: Infinity, ease: 'easeInOut' }
                      : isHovered || isFastPointer
                        ? { duration: 0.45, ease: ARTCRAFT_EASE }
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
                      (radarActive || waveActive || activeMood === 'overdrive') &&
                      !prefersReducedMotion
                        ? { scale: [1, 1.55, 1], opacity: [0.7, 1, 0.7] }
                        : undefined
                    }
                    transition={{ duration: 0.55, repeat: Infinity }}
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
                      : isDragging || danceActive || isFastPointer
                        ? { rotate: [0, 28, -14, 28, 0] }
                        : isHovered
                          ? { y: [0, -2.5, 0] }
                          : { y: [0, 1, 0] }
                  }
                  transition={{
                    duration: isDragging || danceActive || isFastPointer ? 0.45 : 1.8,
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
                      : isDragging || danceActive || isFastPointer
                        ? { rotate: [0, -28, 14, -28, 0] }
                        : isHovered
                          ? { rotate: [0, -30, 16, -24, 0] }
                          : { y: [0, 1, 0] }
                  }
                  transition={
                    isDragging || danceActive || isFastPointer
                      ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut' }
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
                    activeMood === 'wave' ||
                    activeMood === 'overdrive' ||
                    activeMood === 'dizzy' ||
                    activeMood === 'cool' ||
                    activeMood === 'sleep'
                      ? undefined
                      : {
                          x: eyeX,
                          y: eyeY,
                        }
                  }
                >
                  {/* Warm Visor Cheek Blush for Affectionate / Joyful Emotions */}
                  {(activeMood === 'happy' ||
                    activeMood === 'love' ||
                    activeMood === 'laugh' ||
                    activeMood === 'shy' ||
                    activeMood === 'excited') && (
                    <g opacity={activeMood === 'shy' || activeMood === 'love' ? 0.65 : 0.4}>
                      <ellipse cx="17.5" cy="36" rx="2.4" ry="1.3" fill="#FF721A" />
                      <ellipse cx="42.5" cy="36" rx="2.4" ry="1.3" fill="#FF721A" />
                    </g>
                  )}

                  <motion.g
                    animate={
                      prefersReducedMotion ||
                      activeMood === 'dance' ||
                      activeMood === 'radar' ||
                      activeMood === 'wave' ||
                      activeMood === 'overdrive' ||
                      activeMood === 'dizzy' ||
                      activeMood === 'cool' ||
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
                    ) : activeMood === 'wave' ? (
                      <g>
                        <line
                          x1="17"
                          y1="32"
                          x2="43"
                          y2="32"
                          stroke="#FF721A"
                          strokeOpacity="0.3"
                          strokeWidth="0.9"
                        />
                        <motion.path
                          d="M17 32 Q20.5 25, 24 32 T31 32 T38 32 T43 32"
                          stroke="#FF721A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                          animate={
                            prefersReducedMotion
                              ? undefined
                              : {
                                  d: [
                                    'M17 32 Q20.5 25, 24 32 T31 32 T38 32 T43 32',
                                    'M17 32 Q20.5 39, 24 32 T31 32 T38 32 T43 32',
                                    'M17 32 Q20.5 25, 24 32 T31 32 T38 32 T43 32',
                                  ],
                                }
                          }
                          transition={{
                            duration: 0.65,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      </g>
                    ) : activeMood === 'overdrive' ? (
                      <g>
                        <motion.path
                          d="M22.5 26.5L23.7 30.8L28 32L23.7 33.2L22.5 37.5L21.3 33.2L17 32L21.3 30.8Z"
                          fill="#FF721A"
                          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                          style={{ transformOrigin: '22.5px 32px', transformBox: 'view-box' }}
                        />
                        <motion.path
                          d="M37.5 26.5L38.7 30.8L43 32L38.7 33.2L37.5 37.5L36.3 33.2L32 32L36.3 30.8Z"
                          fill="#FF721A"
                          animate={prefersReducedMotion ? undefined : { rotate: -360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                          style={{ transformOrigin: '37.5px 32px', transformBox: 'view-box' }}
                        />
                      </g>
                    ) : activeMood === 'radar' ? (
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
                    ) : activeMood === 'love' ? (
                      // Pulsing heart optics + sweet smile
                      <g>
                        <motion.path
                          d="M22.5 35.4s-3.5-2.2-3.5-4.7c0-1.3 1-2.2 2.1-2.2.7 0 1.2.4 1.4.8.2-.4.7-.8 1.4-.8 1.1 0 2.1.9 2.1 2.2 0 2.5-3.5 4.7-3.5 4.7Z"
                          fill="#FF721A"
                          animate={prefersReducedMotion ? undefined : { scale: [1, 1.18, 1] }}
                          transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ transformOrigin: '22.5px 32px', transformBox: 'view-box' }}
                        />
                        <motion.path
                          d="M37.5 35.4s-3.5-2.2-3.5-4.7c0-1.3 1-2.2 2.1-2.2.7 0 1.2.4 1.4.8.2-.4.7-.8 1.4-.8 1.1 0 2.1.9 2.1 2.2 0 2.5-3.5 4.7-3.5 4.7Z"
                          fill="#FF721A"
                          animate={prefersReducedMotion ? undefined : { scale: [1, 1.18, 1] }}
                          transition={{ duration: 0.85, delay: 0.14, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ transformOrigin: '37.5px 32px', transformBox: 'view-box' }}
                        />
                        <path
                          d="M27.8 37.2Q30 39 32.2 37.2"
                          stroke="#FF721A"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </g>
                    ) : activeMood === 'laugh' ? (
                      // Joyful ^ ^ eyes + laughing open D-mouth
                      <g>
                        <path
                          d="M19.5 32L22.8 28.8L26.1 32"
                          stroke="#FF721A"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <path
                          d="M33.9 32L37.2 28.8L40.5 32"
                          stroke="#FF721A"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <path
                          d="M27.2 34.8H32.8C32.5 37.6 31.3 38.6 30 38.6C28.7 38.6 27.5 37.6 27.2 34.8Z"
                          fill="#FF721A"
                        />
                      </g>
                    ) : activeMood === 'surprised' ? (
                      // Wide O O optics + tiny surprised o mouth
                      <g>
                        <circle
                          cx="22.8"
                          cy="30.5"
                          r="3.4"
                          stroke="#FF721A"
                          strokeWidth="1.8"
                          fill="none"
                        />
                        <circle cx="22.8" cy="30.5" r="1.2" fill="#FF721A" />
                        <circle
                          cx="37.2"
                          cy="30.5"
                          r="3.4"
                          stroke="#FF721A"
                          strokeWidth="1.8"
                          fill="none"
                        />
                        <circle cx="37.2" cy="30.5" r="1.2" fill="#FF721A" />
                        <circle cx="30" cy="37.2" r="1.6" fill="#FF721A" />
                      </g>
                    ) : activeMood === 'shy' ? (
                      // Bashful downward curves + sweet wavy mouth
                      <g>
                        <path
                          d="M19.8 31.2C21.2 33.4 24.4 33.4 25.8 31.2"
                          stroke="#FF721A"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <path
                          d="M34.2 31.2C35.6 33.4 38.8 33.4 40.2 31.2"
                          stroke="#FF721A"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <path
                          d="M27.6 36.8C28.5 35.8 29.5 37.6 30.5 36.8C31.3 36.1 32 37.2 32.6 36.6"
                          stroke="#FF721A"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </g>
                    ) : activeMood === 'cool' ? (
                      // Sharp geometric visor sunglasses + confident smirk
                      <g>
                        <line x1="16" y1="29.5" x2="44" y2="29.5" stroke="#FF721A" strokeWidth="1.4" />
                        <path d="M17.5 29.5H28.2L26.8 34.4C26.4 35.2 25.5 35.6 24.4 35.6H20.2C18.9 35.6 18 34.8 17.8 33.6L17.5 29.5Z" fill="#FF721A" />
                        <path d="M31.8 29.5H42.5L42.2 33.6C42 34.8 41.1 35.6 39.8 35.6H35.6C34.5 35.6 33.6 35.2 33.2 34.4L31.8 29.5Z" fill="#FF721A" />
                        <line x1="20" y1="31.3" x2="22.5" y2="33.8" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="34.3" y1="31.3" x2="36.8" y2="33.8" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M27.6 38.2Q30.6 38.8 32.8 36.8" stroke="#FF721A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                      </g>
                    ) : activeMood === 'proud' ? (
                      // Confident angled brows + bright eyes + crisp smile
                      <g>
                        <line x1="19.5" y1="26.8" x2="25.8" y2="28.2" stroke="#FF721A" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="40.5" y1="26.8" x2="34.2" y2="28.2" stroke="#FF721A" strokeWidth="1.6" strokeLinecap="round" />
                        <rect x="20.6" y="29.4" width="4.4" height="5.4" rx="2.2" fill="#FF721A" />
                        <rect x="35" y="29.4" width="4.4" height="5.4" rx="2.2" fill="#FF721A" />
                        <path d="M27.4 37.2Q30 39.2 32.6 37.2" stroke="#FF721A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      </g>
                    ) : activeMood === 'dizzy' ? (
                      // Rotating spiral optics
                      <g>
                        <motion.path
                          d="M22.8 32m-3.2 0a3.2 3.2 0 1 0 6.4 0a2.1 2.1 0 1 0-4.2 0a1 1 0 1 0 2 0"
                          stroke="#FF721A"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          fill="none"
                          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                          style={{ transformOrigin: '22.8px 32px', transformBox: 'view-box' }}
                        />
                        <motion.path
                          d="M37.2 32m-3.2 0a3.2 3.2 0 1 0 6.4 0a2.1 2.1 0 1 0-4.2 0a1 1 0 1 0 2 0"
                          stroke="#FF721A"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          fill="none"
                          animate={prefersReducedMotion ? undefined : { rotate: -360 }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                          style={{ transformOrigin: '37.2px 32px', transformBox: 'view-box' }}
                        />
                      </g>
                    ) : activeMood === 'sleep' ? (
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
                          d="M20 33C21.2 29.7 24.8 29.7 26 33"
                          stroke="#FF721A"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M34 33C35.2 29.7 38.8 29.7 40 33"
                          stroke="#FF721A"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M27.8 36.8Q30 38.6 32.2 36.8"
                          stroke="#FF721A"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </>
                    ) : activeMood === 'excited' || isFastPointer ? (
                      <>
                        <circle cx="22.8" cy="31.5" r="3.6" fill="#FF721A" />
                        <circle cx="37.2" cy="31.5" r="3.6" fill="#FF721A" />
                        <path
                          d="M27.6 36.8Q30 39 32.4 36.8"
                          stroke="#FF721A"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          fill="none"
                        />
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
                        <path
                          d="M28 37.4Q30.4 38.6 32.2 36.8"
                          stroke="#FF721A"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          fill="none"
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

                {/* Articulated torso core + active thruster glow on drag / roam / whip */}
                <rect
                  x="21"
                  y="50"
                  width="18"
                  height="7"
                  rx="3.5"
                  className="fill-[#0A0A0A] dark:fill-white"
                />
                <circle cx="30" cy="53.5" r="1.5" fill="#FF721A" />

                {showThruster && (
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
            className="mb-2 p-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md shadow-xl flex flex-col gap-2 max-w-[275px]"
          >
            <p className="text-[11px] font-medium text-[#525252] dark:text-[#A3A3A3] px-1">
              {promptInfo.line}
            </p>
            {/* Interactive Emotion Selector Row */}
            <div className="flex flex-wrap items-center gap-1 pb-1.5 border-b border-[#E5E5E5]/80 dark:border-[#262626]/80">
              {EMOTION_PRESETS.map((preset) => {
                const active = activeMood === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectEmotion(preset.id, preset.glyph)}
                    aria-pressed={active}
                    className={`min-h-[28px] px-2 py-1 rounded-md text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A] ${
                      active
                        ? 'bg-[#FF721A] text-[#0A0A0A]'
                        : 'bg-[#FAFAFA] dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] text-[#525252] dark:text-[#A3A3A3] hover:border-[#FF721A] hover:text-[#0A0A0A] dark:hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={triggerDance}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                Dance
              </button>
              <button
                type="button"
                onClick={triggerRadar}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                Radar
              </button>
              <button
                type="button"
                onClick={triggerWave}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                Wave
              </button>
              <button
                type="button"
                onClick={triggerSpin}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                Spin
              </button>
              <button
                type="button"
                onClick={toggleRoam}
                aria-pressed={roamActive}
                className={`min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A] ${
                  roamActive
                    ? 'bg-[#FF721A] text-[#0A0A0A]'
                    : 'bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A]'
                }`}
              >
                {roamActive ? 'Dock' : 'Roam'}
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump(promptInfo.target)}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
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
