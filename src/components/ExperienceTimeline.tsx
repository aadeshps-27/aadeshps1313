import React, { useRef, useState } from 'react';
import { Briefcase, GraduationCap, MapPin } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ExperienceItem } from '../data/portfolio';
import { ParallaxLayer } from './MotionPrimitives';

type TimelineFilter = 'all' | 'role' | 'education';

interface ExperienceTimelineProps {
  items: ExperienceItem[];
  renderRevealText?: (props: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    as?: 'p' | 'div';
  }) => React.ReactNode;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FILTER_OPTIONS: { id: TimelineFilter; label: string }[] = [
  { id: 'all', label: 'All Milestones' },
  { id: 'role', label: 'Professional Roles' },
  { id: 'education', label: 'Education' },
];

export const ExperienceTimeline: React.FC<ExperienceTimelineProps> = ({
  items,
  renderRevealText,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [chronologicalAsc, setChronologicalAsc] = useState<boolean>(true);
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ['start 80%', 'end 55%'],
  });

  const smoothRailProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 26,
    restDelta: 0.001,
  });

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % FILTER_OPTIONS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + FILTER_OPTIONS.length) % FILTER_OPTIONS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = FILTER_OPTIONS.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      setFilter(FILTER_OPTIONS[nextIdx].id);
      tabRefs.current[nextIdx]?.focus();
    }
  };

  // Base array in portfolio.ts is latest-first; reversing displays chronological progression
  const orderedItems = chronologicalAsc ? [...items].reverse() : items;
  const visibleItems =
    filter === 'all'
      ? orderedItems
      : orderedItems.filter((item) => item.kind === filter);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Timeline Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E5E5] dark:border-[#262626]">
        <div
          role="tablist"
          aria-label="Filter career and academic timeline"
          className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] self-start"
        >
          {FILTER_OPTIONS.map((opt, idx) => {
            const isActive = filter === opt.id;
            return (
              <button
                key={opt.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                onClick={() => setFilter(opt.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
                  isActive
                    ? 'text-[#0A0A0A]'
                    : 'text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="timeline-active-filter"
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 360, damping: 30 }
                    }
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg bg-[#FF721A]"
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setChronologicalAsc((prev) => !prev)}
          aria-label={`Sort order: ${chronologicalAsc ? 'Earliest to Present' : 'Present to Earliest'}`}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] text-xs font-mono text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
        >
          <span className="text-[#C94B00] dark:text-[#FF721A] font-semibold">Order:</span>
          <span>{chronologicalAsc ? 'Earliest → Present' : 'Present → Earliest'}</span>
        </button>
      </div>

      {/* Visual Chronological Spine & Milestones */}
      <div ref={railRef} className="relative pl-12 sm:pl-16 space-y-6 sm:space-y-8">
        {/* Static Track Line */}
        <div
          aria-hidden="true"
          className="absolute left-[19px] sm:left-[21px] top-5 bottom-5 w-[2px] bg-[#E5E5E5] dark:bg-[#262626]"
        />

        {/* Animated Progress Track Line */}
        <motion.div
          aria-hidden="true"
          style={{
            scaleY: prefersReducedMotion ? 1 : smoothRailProgress,
            transformOrigin: 'top center',
          }}
          className="absolute left-[19px] sm:left-[21px] top-5 bottom-5 w-[2px] bg-[#FF721A]"
        />

        {visibleItems.map((item, idx) => {
          const isCurrent = item.period.toLowerCase() === 'current';
          const isEducation = item.kind === 'education';
          const Icon = isEducation ? GraduationCap : Briefcase;
          const stepNumber = String(idx + 1).padStart(2, '0');

          return (
            <ParallaxLayer
              key={`${item.index}-${chronologicalAsc ? 'asc' : 'desc'}`}
              speed={idx % 2 === 0 ? 8 : 14}
            >
              <motion.article
                data-reveal=""
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, y: 22, filter: 'blur(8px)' }
              }
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.72,
                delay: prefersReducedMotion ? 0 : idx * 0.07,
                ease: EASE_OUT_EXPO,
              }}
              className="relative group"
            >
              {/* Timeline Node Marker */}
              <div
                aria-hidden="true"
                className={`absolute -left-12 sm:-left-16 top-1 w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center transition-colors duration-200 ${
                  isCurrent
                    ? 'bg-[#FF721A] border-[#FF721A] text-[#0A0A0A] shadow-sm'
                    : 'bg-[#FAFAFA] dark:bg-[#0A0A0A] border-[#E5E5E5] dark:border-[#262626] text-[#0A0A0A] dark:text-white group-hover:border-[#FF721A]'
                }`}
              >
                <Icon size={17} strokeWidth={2} />
              </div>

              {/* Milestone Card */}
              <div
                className={`rule-reveal overflow-hidden p-5 sm:p-6 rounded-2xl border transition-colors duration-200 space-y-3 ${
                  isCurrent
                    ? 'border-[#FF721A]/70 bg-[#FAFAFA] dark:bg-[#0A0A0A]'
                    : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A]'
                }`}
              >
                {/* Top Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E5E5] dark:border-[#262626]">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
                    <span className="font-semibold text-[#C94B00] dark:text-[#FF721A]">
                      {stepNumber} · {item.period}
                    </span>
                    <span aria-hidden="true" className="text-[#A3A3A3]">
                      /
                    </span>
                    <span className="text-[#525252] dark:text-[#A3A3A3]">
                      {isEducation ? 'Education' : 'Professional Role'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs text-[#525252] dark:text-[#A3A3A3]">
                    <MapPin size={12} aria-hidden="true" className="text-[#FF721A]" />
                    <span>{item.location}</span>
                  </span>
                </div>

                {/* Role & Organization */}
                {renderRevealText ? (
                  renderRevealText({
                    as: 'div',
                    delay: 0.04,
                    children: (
                      <div>
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A0A0A] dark:text-white">
                          {item.role}
                        </h3>
                        <p className="text-sm font-medium text-[#525252] dark:text-[#A3A3A3]">
                          {item.organization}
                        </p>
                      </div>
                    ),
                  })
                ) : (
                  <div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A0A0A] dark:text-white">
                      {item.role}
                    </h3>
                    <p className="text-sm font-medium text-[#525252] dark:text-[#A3A3A3]">
                      {item.organization}
                    </p>
                  </div>
                )}

                {/* Description */}
                {renderRevealText ? (
                  renderRevealText({
                    as: 'p',
                    delay: 0.09,
                    className:
                      'text-sm sm:text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]',
                    children: item.description,
                  })
                ) : (
                  <p className="text-sm sm:text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                    {item.description}
                  </p>
                )}

                {/* Focus Summary */}
                {renderRevealText ? (
                  renderRevealText({
                    as: 'p',
                    delay: 0.13,
                    className: 'pt-1 text-xs font-mono text-[#525252] dark:text-[#A3A3A3]',
                    children: item.focus.join(' · '),
                  })
                ) : (
                  <p className="pt-1 text-xs font-mono text-[#525252] dark:text-[#A3A3A3]">
                    {item.focus.join(' · ')}
                  </p>
                )}
              </div>
            </motion.article>
            </ParallaxLayer>
          );
        })}
      </div>
    </div>
  );
};
