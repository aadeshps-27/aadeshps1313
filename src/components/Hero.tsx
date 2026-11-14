import React, { useRef } from 'react';
import { ArrowUpRight, Moon, Sun } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { DISCIPLINES, PROFILE, ProjectCategory } from '../data/portfolio';
import { SafeImage } from './SafeImage';
import {
  ARTCRAFT_EASE,
  BlurSlideReveal,
  DrawEyebrow,
  DrawRule,
  RegistrationTick,
  StaggeredHeadline,
} from './MotionPrimitives';

interface HeroProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectDisciplineFilter: (filter: Exclude<ProjectCategory, 'all'>) => void;
}

const HERO_HEADLINE_TOKENS = [
  { text: 'Engineering' },
  { text: 'precision,' },
  { text: 'expressive', italic: true },
  { text: 'human' },
  { text: 'craft.' },
];

export const Hero: React.FC<HeroProps> = ({
  theme,
  onToggleTheme,
  onSelectDisciplineFilter,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const figureRef = useRef<HTMLDivElement | null>(null);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 24 });
  const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 24 });

  const handleFrameMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !figureRef.current) return;
    const rect = figureRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawRotateX.set(-py * 5);
    rawRotateY.set(px * 5);
  };

  const handleFrameMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  return (
    <section
      id="top"
      className="border-b border-[#E5E5E5] dark:border-[#262626]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-10 sm:pt-10 sm:pb-12 lg:pt-16 lg:pb-16">
        {/* Workspace Utility Toolbar (above the fold, outside Top Bar) */}
        <div className="mb-6 sm:mb-8">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: ARTCRAFT_EASE }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-6 sm:pb-8"
          >
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-[#525252] dark:text-[#A3A3A3]">
              <RegistrationTick onMount delay={0.1} />
              <span className="font-semibold text-[#0A0A0A] dark:text-white">
                {PROFILE.location}
              </span>
              <span aria-hidden="true">·</span>
              <span>{PROFILE.education}</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="w-full sm:w-auto">{PROFILE.availability}</span>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                className="invert-block inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] hover:border-[#0A0A0A] dark:hover:border-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} aria-hidden="true" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} aria-hidden="true" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
          <DrawRule onMount delay={0.08} />
        </div>

        {/* 2-Column Equal-Height Split Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-7 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <DrawEyebrow
                onMount
                delay={0.04}
                className="text-xs sm:text-sm font-semibold text-[#C94B00] dark:text-[#FF721A]"
              >
                Graphics Design · Web Engineering · Robotics
              </DrawEyebrow>

              <StaggeredHeadline
                tokens={HERO_HEADLINE_TOKENS}
                className="font-display font-bold tracking-tight text-[#0A0A0A] dark:text-white text-[clamp(2.15rem,5.5vw,4.5rem)] leading-[1.05]"
                style={{ textWrap: 'balance' }}
              />

              <BlurSlideReveal onMount delay={0.28} distance={20}>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-[#525252] dark:text-[#A3A3A3] max-w-xl">
                  Expertly creative, endlessly curious. I build tactile digital interfaces,
                  high-precision vector illustrations, and applied electronics systems that
                  prioritize human intuition over technical complexity.
                </p>
              </BlurSlideReveal>
            </div>

            {/* Single Dominant Primary CTA + Quiet Secondary Link */}
            <BlurSlideReveal
              onMount
              delay={0.36}
              distance={16}
              className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4 sm:gap-6 pt-1"
            >
              <motion.a
                href="#work"
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="invert-block inline-flex items-center justify-center gap-2.5 min-h-[44px] px-6 py-3.5 rounded-lg bg-[#FF721A] text-[#0A0A0A] font-bold text-sm hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                <span>Explore Selected Works</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </motion.a>

              <a
                href="#about"
                className="rule-reveal inline-flex items-center justify-center sm:justify-start min-h-[44px] py-2 text-sm font-semibold text-[#0A0A0A] dark:text-white border-b border-[#0A0A0A]/30 dark:border-white/30 hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 self-center sm:self-auto"
              >
                Read Practice &amp; Ethos
              </a>
            </BlurSlideReveal>
          </div>

          <motion.div
            ref={figureRef}
            onMouseMove={handleFrameMouseMove}
            onMouseLeave={handleFrameMouseLeave}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 24, scale: 0.98, filter: 'blur(8px)' }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.18, ease: ARTCRAFT_EASE }}
            style={
              prefersReducedMotion
                ? undefined
                : { rotateX, rotateY, transformPerspective: 900 }
            }
            className="lg:col-span-5 flex flex-col"
          >
            <figure className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A]">
              <div className="relative flex-1 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[420px] overflow-hidden">
                <SafeImage
                  src={PROFILE.heroImage}
                  alt={PROFILE.heroImageAlt}
                  fallbackLabel="Abstract Geometric Study"
                  className="w-full h-full lg:h-full object-cover object-center"
                />
              </div>
              <figcaption className="px-4 sm:px-5 py-3 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-4 text-xs text-[#525252] dark:text-[#A3A3A3]">
                <span className="inline-flex items-center gap-2">
                  <RegistrationTick onMount delay={0.4} />
                  <span>Abstract Study · Form &amp; Geometry</span>
                </span>
                <span className="font-mono tabular-nums">Kerala, IN</span>
              </figcaption>
            </figure>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Discipline Index Strip Below Split */}
        <div className="mt-10 sm:mt-12 space-y-6 sm:space-y-8">
          <DrawRule delay={0.15} />
          <div
            data-reveal-group=""
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6"
          >
            {DISCIPLINES.map((item, idx) => (
              <motion.button
                key={item.number}
                type="button"
                data-reveal=""
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 20, filter: 'blur(6px)' }
                }
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{
                  duration: 0.65,
                  delay: prefersReducedMotion ? 0 : idx * 0.065,
                  ease: ARTCRAFT_EASE,
                }}
                onClick={() => {
                  onSelectDisciplineFilter(item.filter);
                  const el = document.getElementById('work');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group rule-reveal overflow-hidden text-left p-4 sm:p-5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
                    {item.number}
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="text-[#737373] group-hover:text-[#C94B00] dark:group-hover:text-[#FF721A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="font-display text-base font-semibold text-[#0A0A0A] dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs text-[#525252] dark:text-[#A3A3A3]">
                  {item.detail}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
