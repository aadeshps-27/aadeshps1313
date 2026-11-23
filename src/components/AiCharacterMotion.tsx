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
import { Robot3DCanvas, RobotMood, RobotSection } from './Robot3DCanvas';
import { RobotDataStreamCanvas } from './RobotDataStreamCanvas';
import {
  playCompanionCue,
  playRobotIdleMechanical,
  RobotIdleSoundKind,
} from '../utils/spatialAudio';
import { useLanguage } from './LanguageProvider';

type MoodMode = RobotMood;

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

const ROAM_SPRING = { stiffness: 90, damping: 20, mass: 0.9 };
const IDLE_SLEEP_MS = 14000;

const SECTION_TARGETS: Record<'about' | 'work' | 'experience' | 'contact', string> = {
  about: '#work',
  work: '#experience',
  experience: '#contact',
  contact: '#top',
};

const SPARK_ANGLES = [0, 60, 120, 180, 240, 300];
const OVERDRIVE_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const EMOTION_PRESETS: {
  id: 'happy' | 'love' | 'laugh' | 'cool' | 'shy' | 'surprised';
  glyph: ThoughtGlyph;
}[] = [
  { id: 'happy', glyph: 'spark' },
  { id: 'love', glyph: 'heart' },
  { id: 'laugh', glyph: 'spark' },
  { id: 'cool', glyph: null },
  { id: 'shy', glyph: null },
  { id: 'surprised', glyph: 'exclaim' },
];

export const AiCharacterMotion: React.FC = () => {
  const { t } = useLanguage();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const stageRef = useRef<HTMLDivElement>(null);
  const tapComboRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; t: number }>({ x: 0, y: 0, t: 0 });
  const dragEndedAtRef = useRef<number>(0);
  const celebratedBottomRef = useRef(false);
  const thoughtTimerRef = useRef<number | null>(null);

  const [pointerFine, setPointerFine] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearPointer, setIsNearPointer] = useState(false);
  const [isFastPointer, setIsFastPointer] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [activeSection, setActiveSection] = useState<RobotSection>('about');
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
  const lookVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Normalized scroll velocity [-1, 1] for kinetic 3D banking & thruster boost
  const scrollVelocityRef = useRef<number>(0);
  // Proximity magnetic lean when pointer comes close to character
  const rawAttractX = useMotionValue(0);
  const rawAttractY = useMotionValue(0);
  // Autonomous roam / keyboard nudge offset
  const rawRoamX = useMotionValue(0);
  const rawRoamY = useMotionValue(0);

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

  useEffect(() => {
    if (prefersReducedMotion) {
      scrollVelocityRef.current = 0;
      return;
    }
    let settleTimer: number | null = null;
    const unsub = smoothVelocity.on('change', (latest) => {
      const normalized = Math.max(-1, Math.min(1, latest / 1500));
      scrollVelocityRef.current = Math.abs(normalized) < 0.015 ? 0 : normalized;
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      if (Math.abs(normalized) >= 0.015) {
        settleTimer = window.setTimeout(() => {
          scrollVelocityRef.current = 0;
        }, 220);
      }
    });
    return () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      unsub();
    };
  }, [smoothVelocity, prefersReducedMotion]);

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
    const ids: RobotSection[] = ['about', 'work', 'experience', 'contact'];

    const detectSection = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80;
      if (nearBottom) {
        setActiveSection('contact');
        return;
      }
      const markerY = window.innerHeight * 0.44;
      let current: RobotSection = 'about';
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
    window.addEventListener('resize', detectSection, { passive: true });
    return () => {
      window.removeEventListener('scroll', detectSection);
      window.removeEventListener('resize', detectSection);
    };
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
    if (prefersReducedMotion || typeof window === 'undefined') return;
    let fastTimer: number | null = null;
    let gazeIdleTimer: number | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const node = stageRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const rawDx = e.clientX - cx;
      const rawDy = e.clientY - cy;
      const dist = Math.hypot(rawDx, rawDy);
      const spanX = Math.max(240, window.innerWidth * 0.38);
      const spanY = Math.max(220, window.innerHeight * 0.38);

      lookVectorRef.current = {
        x: Math.max(-1, Math.min(1, rawDx / spanX)),
        y: Math.max(-1, Math.min(1, rawDy / spanY)),
      };

      if (gazeIdleTimer !== null) window.clearTimeout(gazeIdleTimer);
      gazeIdleTimer = window.setTimeout(() => {
        lookVectorRef.current = { x: 0, y: 0 };
      }, 3600);

      // Detect rapid cursor whips near companion to flare stabilizer wings (skip first sample where t === 0)
      const now = performance.now();
      const prevPtr = lastPointerRef.current;
      lastPointerRef.current = { x: e.clientX, y: e.clientY, t: now };
      if (prevPtr.t > 0) {
        const dt = Math.max(8, now - prevPtr.t);
        const pSpeed = Math.hypot(e.clientX - prevPtr.x, e.clientY - prevPtr.y) / dt;
        if (pSpeed > 2.4 && dist < 360) {
          setIsFastPointer(true);
          setMood((prev) => (prev === 'tracking' || prev === 'sleep' ? 'surprised' : prev));
          if (fastTimer !== null) window.clearTimeout(fastTimer);
          fastTimer = window.setTimeout(() => setIsFastPointer(false), 320);
        }
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
      if (e.pointerType === 'touch') return;
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
      if (gazeIdleTimer !== null) window.clearTimeout(gazeIdleTimer);
      setIsNearPointer(false);
      setIsFastPointer(false);
      lookVectorRef.current = { x: 0, y: 0 };
      rawAttractX.set(0);
      rawAttractY.set(0);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    return () => {
      if (fastTimer !== null) window.clearTimeout(fastTimer);
      if (gazeIdleTimer !== null) window.clearTimeout(gazeIdleTimer);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [
    prefersReducedMotion,
    isDragging,
    danceActive,
    radarActive,
    waveActive,
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

  // Subtle randomized mechanical idle sound effects synced softly to active scroll section
  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') return;
    let cancelled = false;
    let idleAudioTimer: number | null = null;

    const sectionPool: Record<RobotSection, RobotIdleSoundKind[]> = {
      about: ['servo-whir', 'relay-tick'],
      work: ['gimbal-ratchet', 'antenna-ping', 'relay-tick'],
      experience: ['relay-tick', 'servo-whir', 'gimbal-ratchet'],
      contact: ['antenna-ping', 'servo-whir'],
    };

    const scheduleNextIdleSound = () => {
      if (cancelled) return;
      const delayMs = 5500 + Math.random() * 6000;
      idleAudioTimer = window.setTimeout(() => {
        if (cancelled) return;
        const canEmit =
          !document.hidden &&
          !isDragging &&
          !danceActive &&
          !radarActive &&
          !waveActive &&
          mood !== 'sleep' &&
          mood !== 'overdrive';
        if (canEmit) {
          const candidates = sectionPool[activeSection] ?? sectionPool.about;
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          playRobotIdleMechanical(pick, stageRef.current);
        }
        scheduleNextIdleSound();
      }, delayMs);
    };

    scheduleNextIdleSound();
    return () => {
      cancelled = true;
      if (idleAudioTimer !== null) window.clearTimeout(idleAudioTimer);
    };
  }, [
    prefersReducedMotion,
    activeSection,
    mood,
    isDragging,
    danceActive,
    radarActive,
    waveActive,
  ]);

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
      const maxX = typeof window !== 'undefined' ? Math.max(40, Math.min(280, window.innerWidth - 160)) : 280;
      setRoamFacing(1);
      rawRoamX.set(Math.min(maxX, rawRoamX.get() + step));
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
  const promptCopy = t.companion.prompts[activeSection] ?? t.companion.prompts.about;
  const promptTarget = SECTION_TARGETS[activeSection] ?? SECTION_TARGETS.about;
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
        aria-label={t.companion.buttonAria}
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
          dragEndedAtRef.current = performance.now();
          setIsDragging(false);
          setHopKey((k) => k + 1);
          setMood('happy');
          setPulseKey((k) => k + 1);
        }}
        onTap={() => {
          if (!isDragging && performance.now() - dragEndedAtRef.current > 220) {
            triggerReaction();
          }
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
        className="relative w-[104px] h-[120px] flex flex-col items-center justify-end cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A] rounded-2xl touch-none"
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
              className="pointer-events-none absolute top-5 w-16 h-16 rounded-full border border-[#FF721A]"
            />
          )}
        </AnimatePresence>

        {/* RF Radar / Oscilloscope Signal Wave Rings */}
        <AnimatePresence>
          {(radarActive || waveActive) && !prefersReducedMotion && (
            <motion.div
              key="radar-waves"
              aria-hidden="true"
              className="pointer-events-none absolute top-4 w-20 h-20 flex items-center justify-center"
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
              className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2"
            >
              {OVERDRIVE_ANGLES.map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const radius = i % 2 === 0 ? 52 : 36;
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
                className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2"
              >
                {SPARK_ANGLES.map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const tx = Math.cos(rad) * 38;
                  const ty = Math.sin(rad) * 38;
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

        {/* Subtle Orbital Data Stream Particle Canvas reacting to cursor movement */}
        <RobotDataStreamCanvas
          mood={activeMood}
          activeSection={activeSection}
          lookRef={lookVectorRef}
          scrollVelocityRef={scrollVelocityRef}
          isHovered={isHovered}
          isDragging={isDragging}
          isFastPointer={isFastPointer}
          isNearPointer={isNearPointer}
          radarActive={radarActive}
          danceActive={danceActive}
          prefersReducedMotion={prefersReducedMotion}
        />

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
          className="relative z-10 flex flex-col items-center"
        >
          <div className="drop-shadow-[0_14px_22px_rgba(10,10,10,0.18)] dark:drop-shadow-[0_14px_26px_rgba(0,0,0,0.82)]">
            <Robot3DCanvas
              mood={activeMood}
              activeSection={activeSection}
              lookRef={lookVectorRef}
              scrollVelocityRef={scrollVelocityRef}
              isHovered={isHovered}
              isDragging={isDragging}
              isFastPointer={isFastPointer}
              radarActive={radarActive}
              danceActive={danceActive}
              waveActive={waveActive}
              roamActive={roamActive}
              roamFacing={roamFacing}
              spinCount={spinCount}
              hopKey={hopKey}
              showThruster={showThruster}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
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
          className="mt-0.5 block w-11 h-1.5 rounded-full bg-[#0A0A0A] dark:bg-white blur-[2px]"
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
            className="mb-2 p-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-white/[0.97] dark:bg-[#0A0A0A]/[0.97] shadow-xl flex flex-col gap-2 max-w-[min(275px,calc(100vw-8.5rem))]"
          >
            <p className="text-[11px] font-medium text-[#525252] dark:text-[#A3A3A3] px-1">
              {promptCopy.line}
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
                    {t.companion.emotions[preset.id]}
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
                {t.companion.actions.dance}
              </button>
              <button
                type="button"
                onClick={triggerRadar}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                {t.companion.actions.radar}
              </button>
              <button
                type="button"
                onClick={triggerWave}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                {t.companion.actions.wave}
              </button>
              <button
                type="button"
                onClick={triggerSpin}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:bg-[#FF721A] hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                {t.companion.actions.spin}
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
                {roamActive ? t.companion.actions.dock : t.companion.actions.roam}
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump(promptTarget)}
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF721A]"
              >
                {promptCopy.cta}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
