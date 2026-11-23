import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ProjectId,
  ProjectTimelinePhase,
} from '../data/portfolio';
import { getLocalizedReadingTime } from '../i18n/translations';
import { useLanguage } from './LanguageProvider';
import { SafeImage } from './SafeImage';
import { InlineAudioToggle } from './SpatialAudioProvider';
import {
  playModalClose,
  playMonographSwitch,
  playSliderTick,
  playTimelineStep,
} from '../utils/spatialAudio';

interface CaseStudyModalProps {
  projectId: ProjectId | null;
  onClose: () => void;
  onSelectProject: (id: ProjectId) => void;
}

interface ModalTitleParallaxProps {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
  range?: [number, number];
  className?: string;
}

const MODAL_PARALLAX_SPRING = { stiffness: 160, damping: 28, mass: 0.45 };

const ModalTitleParallax: React.FC<ModalTitleParallaxProps> = ({
  children,
  containerRef,
  range = [-8, 12],
  className = '',
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const titleRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: titleRef,
    container: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, MODAL_PARALLAX_SPRING);
  const y = useTransform(smoothProgress, [0, 1], range);

  return (
    <div ref={titleRef} className={className}>
      <motion.div
        style={
          prefersReducedMotion ? undefined : { y, willChange: 'transform' }
        }
      >
        {children}
      </motion.div>
    </div>
  );
};

interface ProjectTimelineStepperProps {
  projectId: ProjectId;
  phases: ProjectTimelinePhase[];
  prefersReducedMotion: boolean;
}

const STEPPER_SPRING = { type: 'spring' as const, stiffness: 360, damping: 28, mass: 0.65 };

const ProjectTimelineStepper: React.FC<ProjectTimelineStepperProps> = ({
  projectId,
  phases,
  prefersReducedMotion,
}) => {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const stepButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setActiveIndex(0);
  }, [projectId]);

  const safeIndex = Math.min(activeIndex, Math.max(0, phases.length - 1));
  const currentPhase = phases[safeIndex] ?? phases[0];
  const progressRatio =
    phases.length > 1 ? safeIndex / (phases.length - 1) : 1;

  const selectPhase = (nextIdx: number, sourceEl?: HTMLElement | null) => {
    const clamped = Math.max(0, Math.min(phases.length - 1, nextIdx));
    if (clamped === safeIndex) return;
    playTimelineStep(clamped, phases.length, sourceEl ?? stepButtonRefs.current[clamped]);
    setActiveIndex(clamped);
  };

  const handleStepKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIdx = Math.min(phases.length - 1, idx + 1);
    } else if (e.key === 'ArrowLeft') {
      nextIdx = Math.max(0, idx - 1);
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = phases.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      const targetEl = stepButtonRefs.current[nextIdx];
      selectPhase(nextIdx, targetEl);
      targetEl?.focus();
    }
  };

  return (
    <section
      aria-label={t.caseStudy.timelineAria}
      className="p-5 sm:p-6 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A]">
          <span className="inline-block w-3.5 h-[2px] bg-[#FF721A]" aria-hidden="true" />
          <span>{t.caseStudy.timelineTitle}</span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="font-mono text-[11px] tabular-nums text-[#525252] dark:text-[#A3A3A3]">
            {t.caseStudy.phaseWord} {currentPhase.step} / 0{phases.length}
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => selectPhase(safeIndex - 1, e.currentTarget)}
              disabled={safeIndex === 0}
              aria-label={t.caseStudy.prevPhaseAria}
              className="w-8 h-8 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414] inline-flex items-center justify-center text-[#0A0A0A] dark:text-white disabled:opacity-35 hover:border-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-[#FF721A]"
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => selectPhase(safeIndex + 1, e.currentTarget)}
              disabled={safeIndex === phases.length - 1}
              aria-label={t.caseStudy.nextPhaseAria}
              className="w-8 h-8 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414] inline-flex items-center justify-center text-[#0A0A0A] dark:text-white disabled:opacity-35 hover:border-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-[#FF721A]"
            >
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Stepper Track */}
      <div className="relative pt-1">
        {/* Continuous Base Rail spanning center of Step 1 (12.5%) to Step 4 (87.5%) */}
        <div
          aria-hidden="true"
          className="absolute top-[19px] left-[12.5%] right-[12.5%] h-[2px] bg-[#E5E5E5] dark:bg-[#262626]"
        >
          <motion.div
            initial={false}
            animate={{ scaleX: progressRatio }}
            transition={prefersReducedMotion ? { duration: 0 } : STEPPER_SPRING}
            style={{ transformOrigin: 'left center' }}
            className="h-full w-full bg-[#FF721A]"
          />
        </div>

        <div className="relative grid grid-cols-4 gap-2 sm:gap-4">
          {phases.map((item, idx) => {
            const isActive = idx === safeIndex;
            const isCompleted = idx < safeIndex;

            return (
              <motion.button
                key={item.step}
                ref={(el) => {
                  stepButtonRefs.current[idx] = el;
                }}
                type="button"
                onClick={(e) => selectPhase(idx, e.currentTarget)}
                onKeyDown={(e) => handleStepKeyDown(e, idx)}
                aria-current={isActive ? 'step' : undefined}
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                transition={STEPPER_SPRING}
                className="group/step flex flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A] rounded-lg"
              >
                <span
                  className={`relative z-10 w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-xs tabular-nums font-bold transition-colors duration-200 ${
                    isActive
                      ? 'border-[#FF721A] bg-[#FF721A] text-[#0A0A0A] shadow-[0_0_0_4px_rgba(255,114,26,0.16)]'
                      : isCompleted
                        ? 'border-[#FF721A] bg-white dark:bg-[#141414] text-[#C94B00] dark:text-[#FF721A]'
                        : 'border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414] text-[#525252] dark:text-[#A3A3A3] group-hover/step:border-[#FF721A]'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    item.step
                  )}
                </span>

                <span
                  className={`mt-2.5 text-[11px] sm:text-xs font-semibold tracking-tight transition-colors ${
                    isActive
                      ? 'text-[#0A0A0A] dark:text-white'
                      : 'text-[#525252] dark:text-[#A3A3A3] group-hover/step:text-[#0A0A0A] dark:group-hover/step:text-white'
                  }`}
                >
                  {item.phase}
                </span>

                <span className="hidden sm:block mt-0.5 font-mono text-[10px] text-[#737373] dark:text-[#737373]">
                  {item.timeframe}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Phase Detail Panel */}
      <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#262626]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${projectId}-${currentPhase.step}`}
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 8, filter: 'blur(4px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6, filter: 'blur(4px)' }
            }
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-[#C94B00] dark:text-[#FF721A]">
                  {currentPhase.phase} · {currentPhase.timeframe}
                </span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0A0A0A] dark:text-white">
                {currentPhase.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                {currentPhase.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 lg:justify-end shrink-0">
              {currentPhase.deliverables.map((deliverable) => (
                <span
                  key={deliverable}
                  className="px-2.5 py-1 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414] font-mono text-[11px] font-medium text-[#0A0A0A] dark:text-white whitespace-nowrap"
                >
                  {deliverable}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  projectId,
  onClose,
  onSelectProject,
}) => {
  const { lang, t } = useLanguage();
  const projects = t.portfolio.projects;
  const creativeStudy = t.portfolio.creativeCaseStudy;
  const robotStudy = t.portfolio.robotCaseStudy;
  const geoStudy = t.portfolio.geolocationCaseStudy;
  const timelinePhases = t.portfolio.projectTimelinePhases;
  const prefersReducedMotion = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [readPercent, setReadPercent] = useState(0);

  const { scrollY, scrollYProgress } = useScroll({
    container: scrollContainerRef,
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 32,
    restDelta: 0.001,
  });

  const smoothModalScrollY = useSpring(scrollY, MODAL_PARALLAX_SPRING);
  const heroEyebrowY = useTransform(smoothModalScrollY, [0, 340], [0, 34], {
    clamp: true,
  });
  const heroTitleY = useTransform(smoothModalScrollY, [0, 340], [0, 24], {
    clamp: true,
  });
  const heroSubtitleY = useTransform(smoothModalScrollY, [0, 340], [0, 14], {
    clamp: true,
  });
  const heroTitleOpacity = useTransform(smoothModalScrollY, [0, 340], [1, 0.72], {
    clamp: true,
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const next = Math.min(100, Math.max(0, Math.round(latest * 100)));
    setReadPercent(next);
  });

  // Interactive RSSI estimator state for Geo-Location monograph
  const [distanceMeters, setDistanceMeters] = useState<number>(18);
  const [pathLossN, setPathLossN] = useState<number>(2.7);
  const rssiZero = -42; // Reference RSSI at 1m in dBm
  const estimatedRssi = rssiZero - 10 * pathLossN * Math.log10(Math.max(1, distanceMeters));

  useEffect(() => {
    if (!projectId) return;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setReadPercent(0);
  }, [projectId]);

  // Capture trigger element & move focus into dialog on open; restore on unmount/close
  useEffect(() => {
    if (!projectId) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const raf = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      if (previousFocusRef.current && previousFocusRef.current.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [projectId !== null]);

  useEffect(() => {
    if (!projectId) return;

    const currentIdx = projects.findIndex((p) => p.id === projectId);
    const prevProj = projects[(currentIdx - 1 + projects.length) % projects.length];
    const nextProj = projects[(currentIdx + 1) % projects.length];

    const getFocusableElements = () => {
      const container = scrollContainerRef.current;
      if (!container) return [];
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        playModalClose();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getFocusableElements();
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !scrollContainerRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !scrollContainerRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      // Skip bracket/alt shortcuts when adjusting range sliders or inputs
      const targetTag = (e.target as HTMLElement | null)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      if (e.key === '[' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        playMonographSwitch('prev');
        onSelectProject(prevProj.id);
      } else if (e.key === ']' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        playMonographSwitch('next');
        onSelectProject(nextProj.id);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [projectId, projects, onClose, onSelectProject]);

  if (!projectId) return null;

  const currentIndex = projects.findIndex((p) => p.id === projectId);
  const project = projects[currentIndex] ?? projects[0];
  const prevProject = projects[(currentIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(currentIndex + 1) % projects.length];
  const readingTime = getLocalizedReadingTime(project.id, lang);
  const ringProgress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  return (
    <motion.div
      ref={scrollContainerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      tabIndex={-1}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-black text-[#0A0A0A] dark:text-white focus:outline-none"
    >
      {/* Top Sticky Monograph Bar */}
      <div className="sticky top-0 z-20 border-b border-[#E5E5E5] dark:border-[#262626] bg-white/95 dark:bg-black/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#525252] dark:text-[#A3A3A3] min-w-0">
            <span className="font-mono tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A] shrink-0">
              {t.caseStudy.caseStudyPrefix} {project.indexNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate font-semibold text-[#0A0A0A] dark:text-white">
              {project.title}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline font-mono tabular-nums text-xs shrink-0">
              {readingTime}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Circular Reading Depth Indicator */}
            <div
              role="progressbar"
              aria-label={t.caseStudy.progressAria}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readPercent}
              title={`${t.caseStudy.progressTitlePrefix}: ${readPercent}%`}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                className="shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-[#E5E5E5] dark:text-[#262626]"
                />
                <motion.circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="#FF721A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                  style={{ pathLength: ringProgress }}
                />
              </svg>
              <span className="font-mono text-[11px] tabular-nums font-medium text-[#525252] dark:text-[#A3A3A3] min-w-[2.1rem] text-right">
                {readPercent}%
              </span>
            </div>

            <InlineAudioToggle />

            <div className="hidden sm:inline-flex items-center gap-1" role="group" aria-label={t.caseStudy.switchGroupAria}>
              <button
                type="button"
                onClick={(e) => {
                  playMonographSwitch('prev', e.currentTarget);
                  onSelectProject(prevProject.id);
                }}
                aria-label={`${t.caseStudy.prevPrefix}: ${prevProject.title}`}
                title={`${t.caseStudy.previous} (${prevProject.title}) · [`}
                className="w-10 h-10 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] inline-flex items-center justify-center text-[#0A0A0A] dark:text-white hover:border-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  playMonographSwitch('next', e.currentTarget);
                  onSelectProject(nextProject.id);
                }}
                aria-label={`${t.caseStudy.nextPrefix}: ${nextProject.title}`}
                title={`${t.caseStudy.next} (${nextProject.title}) · ]`}
                className="w-10 h-10 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] inline-flex items-center justify-center text-[#0A0A0A] dark:text-white hover:border-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => {
                playModalClose();
                onClose();
              }}
              aria-label={t.caseStudy.closeAria}
              className="inline-flex items-center gap-2 min-h-[40px] px-3.5 sm:px-4 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-xs font-semibold hover:border-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
            >
              <span>{t.caseStudy.close}</span>
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Monograph Body */}
      <article
        key={project.id}
        className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 space-y-10 sm:space-y-14"
      >
        {/* Header & Hero Image with scroll-linked slower project title depth */}
        <header className="space-y-8">
          <div className="relative z-0 space-y-4">
            <motion.p
              style={
                prefersReducedMotion
                  ? undefined
                  : { y: heroEyebrowY, opacity: heroTitleOpacity, willChange: 'transform' }
              }
              className="text-xs font-mono tabular-nums text-[#525252] dark:text-[#A3A3A3]"
            >
              {project.discipline} · {project.year} ·{' '}
              <span className="text-[#0A0A0A] dark:text-white font-semibold">{readingTime}</span>
            </motion.p>
            <motion.h1
              id="case-study-title"
              style={
                prefersReducedMotion
                  ? { textWrap: 'balance' }
                  : {
                      textWrap: 'balance',
                      y: heroTitleY,
                      opacity: heroTitleOpacity,
                      willChange: 'transform',
                    }
              }
              className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0A0A0A] dark:text-white"
            >
              {project.title}
            </motion.h1>
            <motion.p
              style={
                prefersReducedMotion
                  ? undefined
                  : { y: heroSubtitleY, opacity: heroTitleOpacity, willChange: 'transform' }
              }
              className="font-serif italic text-xl text-[#525252] dark:text-[#A3A3A3]"
            >
              {project.subtitle}
            </motion.p>
          </div>

          <div className="relative z-10 rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#262626] bg-[#F5F5F5] dark:bg-[#141414] aspect-[16/9]">
            <SafeImage
              src={project.image}
              alt={project.imageAlt}
              fallbackLabel={project.title}
              priority="high"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover"
            />
          </div>

          {/* 3-Column Spec Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-[#E5E5E5] dark:border-[#262626]">
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">{metric.label}</p>
                <p className="mt-1 font-display text-lg font-semibold text-[#0A0A0A] dark:text-white">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          {/* Horizontal Project Timeline Stepper */}
          <ProjectTimelineStepper
            projectId={project.id}
            phases={timelinePhases[project.id]}
            prefersReducedMotion={Boolean(prefersReducedMotion)}
          />
        </header>

        {/* Project-Specific Rich Content */}
        {project.id === 'creative' && (
          <div className="space-y-14">
            <section className="space-y-6">
              <ModalTitleParallax containerRef={scrollContainerRef}>
                <h2 className="font-display text-2xl font-bold">{t.caseStudy.creative.sec1}</h2>
              </ModalTitleParallax>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3] max-w-3xl">
                {t.caseStudy.creative.sec1Intro}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creativeStudy.pillars.map((pillar, idx) => (
                  <div
                    key={pillar.title}
                    className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-3"
                  >
                    <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
                      0{idx + 1}
                    </span>
                    <h3 className="font-display text-lg font-bold">{pillar.title}</h3>
                    <p className="text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-8 sm:p-10 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-6">
              <p className="font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A]">
                {t.caseStudy.creative.sec2}
              </p>
              <ModalTitleParallax containerRef={scrollContainerRef} range={[-6, 10]}>
                <h2 className="font-display text-3xl font-bold">
                  {creativeStudy.philosophyTitle}
                </h2>
              </ModalTitleParallax>
              <blockquote className="font-serif italic text-xl sm:text-2xl leading-relaxed text-[#0A0A0A] dark:text-white">
                &ldquo;{creativeStudy.philosophyStatement}&rdquo;
              </blockquote>
              <p className="text-xs font-mono text-[#525252] dark:text-[#A3A3A3]">
                {t.caseStudy.creative.guidingPillars} {creativeStudy.values.join(' · ')}
              </p>
            </section>

            <section className="space-y-4">
              <ModalTitleParallax containerRef={scrollContainerRef}>
                <h2 className="font-display text-2xl font-bold">{t.caseStudy.creative.sec3}</h2>
              </ModalTitleParallax>
              <div className="divide-y divide-[#E5E5E5] dark:divide-[#262626] border-y border-[#E5E5E5] dark:border-[#262626]">
                {creativeStudy.craftNotes.map((note) => (
                  <div
                    key={note.label}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium text-[#525252] dark:text-[#A3A3A3]">
                      {note.label}
                    </span>
                    <span className="text-sm font-semibold text-[#0A0A0A] dark:text-white">
                      {note.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {project.id === 'robot' && (
          <div className="space-y-14">
            <section className="space-y-4">
              <ModalTitleParallax containerRef={scrollContainerRef}>
                <h2 className="font-display text-2xl font-bold">{t.caseStudy.robot.sec1}</h2>
              </ModalTitleParallax>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                {robotStudy.abstract}
              </p>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                {robotStudy.introduction}
              </p>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {robotStudy.subsystems.map((sub) => (
                  <div
                    key={sub.name}
                    className="p-5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A]"
                  >
                    <h3 className="font-display text-base font-bold">{sub.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                      {sub.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <ModalTitleParallax containerRef={scrollContainerRef}>
                <h2 className="font-display text-2xl font-bold">{t.caseStudy.robot.sec2}</h2>
              </ModalTitleParallax>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {robotStudy.objectives.map((obj, idx) => (
                  <div
                    key={obj}
                    className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] flex items-start gap-3"
                  >
                    <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A] pt-0.5">
                      0{idx + 1}
                    </span>
                    <p className="text-sm text-[#0A0A0A] dark:text-white">{obj}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-4">
                <h2 className="font-display text-xl font-bold">{t.caseStudy.robot.sec3}</h2>
                <ul className="space-y-2.5 text-sm text-[#525252] dark:text-[#A3A3A3]">
                  {robotStudy.hardwareComponents.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="font-mono text-[#C94B00] dark:text-[#FF721A]">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-4">
                <h2 className="font-display text-xl font-bold">{t.caseStudy.robot.sec4}</h2>
                <ul className="space-y-2.5 text-sm text-[#525252] dark:text-[#A3A3A3]">
                  {robotStudy.softwareComponents.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="font-mono text-[#C94B00] dark:text-[#FF721A]">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Clean Architectural Block Flow */}
            <section className="p-5 sm:p-8 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold">{t.caseStudy.robot.sec5}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
                <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414]">
                  <p className="font-mono text-xs text-[#525252] dark:text-[#A3A3A3]">{t.caseStudy.robot.operatorConsole}</p>
                  <p className="mt-1 font-display font-semibold">{t.caseStudy.robot.remoteController}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#FF721A] bg-white dark:bg-[#141414]">
                  <p className="font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A]">{t.caseStudy.robot.wirelessLink}</p>
                  <p className="mt-1 font-display font-semibold">{t.caseStudy.robot.mcuRpi}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414]">
                    <p className="font-display text-xs font-semibold">{t.caseStudy.robot.motors}</p>
                    <p className="text-[11px] text-[#525252] dark:text-[#A3A3A3]">L298N</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414]">
                    <p className="font-display text-xs font-semibold">{t.caseStudy.robot.camera}</p>
                    <p className="text-[11px] text-[#525252] dark:text-[#A3A3A3]">{t.caseStudy.robot.cameraDetail}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414]">
                    <p className="font-display text-xs font-semibold">{t.caseStudy.robot.sensors}</p>
                    <p className="text-[11px] text-[#525252] dark:text-[#A3A3A3]">US / IR</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#262626] space-y-3">
                <h3 className="font-display text-lg font-semibold">{t.caseStudy.robot.workingPrinciple}</h3>
                <ol className="space-y-2.5 text-sm text-[#525252] dark:text-[#A3A3A3]">
                  {robotStudy.workingSteps.map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A] pt-0.5">
                        0{i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {robotStudy.quadrants.map((quad) => (
                <div
                  key={quad.title}
                  className="p-5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-3"
                >
                  <h3 className="font-display text-base font-bold">{quad.title}</h3>
                  <ul className="space-y-1.5 text-xs text-[#525252] dark:text-[#A3A3A3]">
                    {quad.items.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section className="p-8 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-3">
              <h2 className="font-display text-xl font-bold">{t.caseStudy.robot.conclusion}</h2>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                {robotStudy.conclusion}
              </p>
            </section>
          </div>
        )}

        {project.id === 'geolocation' && (
          <div className="space-y-14">
            <section className="space-y-4">
              <ModalTitleParallax containerRef={scrollContainerRef}>
                <h2 className="font-display text-2xl font-bold">{t.caseStudy.geo.sec1}</h2>
              </ModalTitleParallax>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                {geoStudy.abstract}
              </p>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                {geoStudy.introduction}
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-4">
                <h2 className="font-display text-xl font-bold">{t.caseStudy.geo.sec2}</h2>
                <ul className="space-y-2.5 text-sm text-[#525252] dark:text-[#A3A3A3]">
                  {geoStudy.gpsLimitations.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="font-mono text-[#C94B00] dark:text-[#FF721A]">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-4">
                <h2 className="font-display text-xl font-bold">{t.caseStudy.geo.sec3}</h2>
                <ul className="space-y-2.5 text-sm text-[#525252] dark:text-[#A3A3A3]">
                  {geoStudy.rfCapabilities.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="font-mono text-[#C94B00] dark:text-[#FF721A]">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Operational Flow */}
            <section className="space-y-4">
              <ModalTitleParallax containerRef={scrollContainerRef}>
                <h2 className="font-display text-xl sm:text-2xl font-bold">{t.caseStudy.geo.sec4}</h2>
              </ModalTitleParallax>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {geoStudy.operationalFlow.map((item) => (
                  <div
                    key={item.step}
                    className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-2"
                  >
                    <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
                      {item.step}
                    </span>
                    <p className="text-xs leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Mathematical Model + Interactive Estimator */}
            <section className="p-5 sm:p-8 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    {t.caseStudy.geo.sec5}
                  </h2>
                  <p className="mt-1 text-sm text-[#525252] dark:text-[#A3A3A3]">
                    {t.caseStudy.geo.sec5Sub}
                  </p>
                </div>
                <div className="px-4 py-2.5 rounded-lg bg-[#F5F5F5] dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] font-mono text-xs sm:text-sm tabular-nums text-[#0A0A0A] dark:text-white self-start md:self-auto">
                  RSSI = RSSI₀ − 10n log₁₀(d)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#E5E5E5] dark:border-[#262626]">
                <label className="block space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#525252] dark:text-[#A3A3A3]">
                      {t.caseStudy.geo.anchorDistance}
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {distanceMeters} {t.caseStudy.geo.meterUnit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={150}
                    step={1}
                    value={distanceMeters}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDistanceMeters(val);
                      playSliderTick((val - 1) / 149, e.currentTarget);
                    }}
                    className="w-full h-6 cursor-pointer accent-[#FF721A] rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                  />
                </label>

                <label className="block space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#525252] dark:text-[#A3A3A3]">
                      {t.caseStudy.geo.envExponent}
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {pathLossN.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={4.0}
                    step={0.1}
                    value={pathLossN}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPathLossN(val);
                      playSliderTick((val - 2.0) / 2.0, e.currentTarget);
                    }}
                    className="w-full h-6 cursor-pointer accent-[#FF721A] rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                  />
                </label>

                <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">{t.caseStudy.geo.predictedRssi}</p>
                    <p className="text-[11px] font-mono text-[#525252] dark:text-[#A3A3A3]">
                      RSSI₀ = −42 dBm @ 1 m
                    </p>
                  </div>
                  <span className="font-mono text-2xl font-bold tabular-nums text-[#C94B00] dark:text-[#FF721A]">
                    {estimatedRssi.toFixed(1)} dBm
                  </span>
                </div>
              </div>
            </section>

            {/* Hardware Stack Table */}
            <section className="space-y-4">
              <ModalTitleParallax containerRef={scrollContainerRef}>
                <h2 className="font-display text-xl sm:text-2xl font-bold">{t.caseStudy.geo.sec6}</h2>
              </ModalTitleParallax>
              <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] dark:border-[#262626] text-xs text-[#525252] dark:text-[#A3A3A3]">
                      <th className="py-3 px-3.5 sm:px-5 font-semibold whitespace-nowrap">{t.caseStudy.geo.colSubsystem}</th>
                      <th className="py-3 px-3.5 sm:px-5 font-semibold whitespace-nowrap">{t.caseStudy.geo.colModel}</th>
                      <th className="py-3 px-3.5 sm:px-5 font-semibold">{t.caseStudy.geo.colRole}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#262626]">
                    {geoStudy.hardwareTable.map((row) => (
                      <tr key={row.component}>
                        <td className="py-3 px-3.5 sm:px-5 font-medium whitespace-nowrap">{row.component}</td>
                        <td className="py-3 px-3.5 sm:px-5 font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A] whitespace-nowrap">
                          {row.model}
                        </td>
                        <td className="py-3 px-3.5 sm:px-5 text-[#525252] dark:text-[#A3A3A3]">
                          {row.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs font-mono text-[#525252] dark:text-[#A3A3A3]">
                {t.caseStudy.geo.softwareToolchain} {geoStudy.softwareTools.join(' · ')}
              </p>
            </section>

            {/* Applications, Advantages & Roadmap */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-3">
                <h3 className="font-display text-lg font-bold">{t.caseStudy.geo.applications}</h3>
                <ul className="space-y-2 text-sm text-[#525252] dark:text-[#A3A3A3]">
                  {geoStudy.applications.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-3">
                <h3 className="font-display text-lg font-bold">{t.caseStudy.geo.advantages}</h3>
                <ul className="space-y-2 text-sm text-[#525252] dark:text-[#A3A3A3]">
                  {geoStudy.advantages.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-3">
                <h3 className="font-display text-lg font-bold">{t.caseStudy.geo.roadmap}</h3>
                <div className="space-y-2.5 text-sm">
                  {geoStudy.roadmap.map((item) => (
                    <div key={item.title}>
                      <p className="font-semibold text-[#0A0A0A] dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="p-8 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-3">
              <h2 className="font-display text-xl font-bold">{t.caseStudy.geo.conclusion}</h2>
              <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                {geoStudy.conclusion}
              </p>
            </section>
          </div>
        )}

        {/* Next / Previous Monograph Navigation */}
        <footer className="pt-8 border-t border-[#E5E5E5] dark:border-[#262626] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={(e) => {
              playMonographSwitch('prev', e.currentTarget);
              onSelectProject(prevProject.id);
            }}
            aria-label={`${t.caseStudy.prevPrefix}: ${prevProject.title}`}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] focus-visible:border-[#FF721A] focus-visible:ring-2 focus-visible:ring-[#FF721A]/25"
          >
            <ArrowLeft size={16} className="shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-mono text-[#525252] dark:text-[#A3A3A3]">{t.caseStudy.previous}</p>
              <p className="text-sm font-semibold">{prevProject.title}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={(e) => {
              playMonographSwitch('next', e.currentTarget);
              onSelectProject(nextProject.id);
            }}
            aria-label={`${t.caseStudy.nextPrefix}: ${nextProject.title}`}
            className="inline-flex items-center justify-between sm:justify-end gap-3 px-5 py-3 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors text-right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] focus-visible:border-[#FF721A] focus-visible:ring-2 focus-visible:ring-[#FF721A]/25"
          >
            <div>
              <p className="text-[11px] font-mono text-[#525252] dark:text-[#A3A3A3]">{t.caseStudy.next}</p>
              <p className="text-sm font-semibold">{nextProject.title}</p>
            </div>
            <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </button>
        </footer>
      </article>
    </motion.div>
  );
};
