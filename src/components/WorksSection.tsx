import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import {
  AnimatePresence,
  LayoutGroup,
  Variants,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  PROJECTS,
  ProjectCategory,
  ProjectId,
  ProjectSummary,
  getProjectReadingTime,
} from '../data/portfolio';
import { SafeImage } from './SafeImage';
import {
  ARTCRAFT_EASE,
  BlurSlideReveal,
  DrawEyebrow,
  DrawRule,
  ParallaxLayer,
  ParallaxMediaAperture,
} from './MotionPrimitives';

interface WorksSectionProps {
  activeFilter: ProjectCategory;
  onChangeFilter: (filter: ProjectCategory) => void;
  onOpenProject: (id: ProjectId) => void;
}

const FILTER_OPTIONS: { id: ProjectCategory; label: string }[] = [
  { id: 'all', label: 'All Works' },
  { id: 'design', label: 'Visual Design' },
  { id: 'robotics', label: 'Robotics & IoT' },
  { id: 'rf', label: 'RF Systems' },
];

const GRID_STAGGER_VARIANTS: Variants = {
  hidden: {},
  visible: (prefersReduced: boolean) => ({
    transition: prefersReduced
      ? { staggerChildren: 0 }
      : {
          staggerChildren: 0.11,
          delayChildren: 0.04,
        },
  }),
  exit: (prefersReduced: boolean) => ({
    transition: prefersReduced
      ? { staggerChildren: 0 }
      : {
          staggerChildren: 0.05,
          staggerDirection: -1,
        },
  }),
};

const CARD_REVEAL_VARIANTS: Variants = {
  hidden: (prefersReduced: boolean) =>
    prefersReduced
      ? { opacity: 1 }
      : { opacity: 0, y: 28, scale: 0.975, filter: 'blur(8px)' },
  visible: (prefersReduced: boolean) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: prefersReduced
      ? { duration: 0 }
      : { duration: 0.65, ease: ARTCRAFT_EASE },
  }),
  exit: (prefersReduced: boolean) =>
    prefersReduced
      ? { opacity: 0, transition: { duration: 0 } }
      : {
          opacity: 0,
          y: -16,
          scale: 0.98,
          filter: 'blur(6px)',
          transition: { duration: 0.22, ease: ARTCRAFT_EASE },
        },
};

interface MagneticProjectCardProps {
  project: ProjectSummary;
  index: number;
  isLeadFeatured: boolean;
  allowParallax: boolean;
  prefersReducedMotion: boolean;
  onOpenProject: (id: ProjectId) => void;
}

const MAGNETIC_SPRING = { stiffness: 240, damping: 26, mass: 0.55 };

const MagneticProjectCard: React.FC<MagneticProjectCardProps> = ({
  project,
  index,
  isLeadFeatured,
  allowParallax,
  prefersReducedMotion,
  onOpenProject,
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalized pointer offset inside the card bounds [-0.5, 0.5]
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, MAGNETIC_SPRING);
  const smoothY = useSpring(pointerY, MAGNETIC_SPRING);

  // Outer card subtle magnetic pull + optical micro-tilt
  const cardX = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);
  const cardY = useTransform(smoothY, [-0.5, 0.5], [-5, 5]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [1.6, -1.6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-1.6, 1.6]);

  // Inner media parallax gliding inside its cropped aperture
  const mediaX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const mediaY = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);

  // Editorial content slight counter-parallax for layered spatial depth
  const contentX = useTransform(smoothX, [-0.5, 0.5], [2.5, -2.5]);
  const contentY = useTransform(smoothY, [-0.5, 0.5], [2, -2]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!allowParallax || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const nx = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
    const ny = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5));

    pointerX.set(nx);
    pointerY.set(ny);
  };

  const handlePointerEnter = () => {
    if (!allowParallax) return;
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    pointerX.set(0);
    pointerY.set(0);
  };

  const isWideLayout = isLeadFeatured || isExpanded;
  const columnParallaxSpeed = isWideLayout
    ? 8
    : index % 2 === 0
      ? 10
      : 22;

  const layoutTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.48, ease: ARTCRAFT_EASE };

  return (
    <motion.div
      data-reveal=""
      custom={prefersReducedMotion}
      variants={CARD_REVEAL_VARIANTS}
      layout={!prefersReducedMotion}
      transition={{ layout: layoutTransition }}
      className={
        isWideLayout
          ? 'md:col-span-2 lg:col-span-12'
          : 'lg:col-span-6'
      }
    >
      <ParallaxLayer
        speed={columnParallaxSpeed}
        layout={!prefersReducedMotion}
        className="h-full"
      >
      <motion.article
        ref={cardRef}
        layout={!prefersReducedMotion}
        data-cursor="project"
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        style={
          allowParallax
            ? {
                x: cardX,
                y: cardY,
                rotateX,
                rotateY,
                transformPerspective: 1100,
                borderRadius: 16,
                willChange: isHovered ? 'transform' : 'auto',
              }
            : { borderRadius: 16 }
        }
        transition={{ layout: layoutTransition }}
        className={`h-full group rule-reveal rounded-2xl border bg-[#FAFAFA] dark:bg-[#0A0A0A] overflow-hidden flex flex-col transition-colors duration-200 ${
          isExpanded
            ? 'border-[#FF721A]'
            : 'border-[#E5E5E5] dark:border-[#262626] hover:border-[#FF721A]'
        } ${isWideLayout ? 'md:grid md:grid-cols-12' : ''}`}
      >
        {/* Media Container with scroll settle & inner depth parallax */}
        <motion.div
          layout={!prefersReducedMotion}
          initial={prefersReducedMotion ? false : { scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.72,
            delay: prefersReducedMotion ? 0 : index * 0.08 + 0.06,
            ease: ARTCRAFT_EASE,
            layout: layoutTransition,
          }}
          className={`relative overflow-hidden bg-[#F5F5F5] dark:bg-[#141414] ${
            isWideLayout
              ? 'md:col-span-6 lg:col-span-7 aspect-[4/3] md:aspect-auto md:min-h-[340px] lg:min-h-[400px]'
              : 'aspect-[4/3]'
          }`}
        >
          <ParallaxMediaAperture shiftPercent={7} overscanScale={1.14}>
            <motion.div
              className="w-full h-full"
              style={
                allowParallax
                  ? {
                      x: mediaX,
                      y: mediaY,
                      willChange: isHovered ? 'transform' : 'auto',
                    }
                  : undefined
              }
              animate={{
                scale: !prefersReducedMotion && isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.45, ease: ARTCRAFT_EASE }}
            >
              <SafeImage
                src={project.image}
                alt={project.imageAlt}
                fallbackLabel={project.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </ParallaxMediaAperture>
        </motion.div>

        {/* Editorial Content Container with subtle counter-parallax */}
        <motion.div
          layout={prefersReducedMotion ? false : 'position'}
          style={
            allowParallax
              ? {
                  x: contentX,
                  y: contentY,
                }
              : undefined
          }
          transition={{ layout: layoutTransition }}
          className={`p-5 sm:p-7 flex flex-col justify-between gap-5 sm:gap-6 ${
            isWideLayout ? 'md:col-span-6 lg:col-span-5 md:p-8 lg:p-10' : 'lg:p-8'
          }`}
        >
        <div className="space-y-3 sm:space-y-4">
          {/* Clean unboxed metadata row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#525252] dark:text-[#A3A3A3]">
            <span className="font-mono tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
              {project.indexNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span>{project.discipline}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{project.year}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#0A0A0A] dark:text-white">
              {getProjectReadingTime(project.id)}
            </span>
          </div>

          <div>
            <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
              {project.title}
            </h3>
            <p className="mt-1 font-serif italic text-sm sm:text-base text-[#525252] dark:text-[#A3A3A3]">
              {project.subtitle}
            </p>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
            {project.summary}
          </p>
        </div>

        <div className="space-y-5 pt-4 border-t border-[#E5E5E5] dark:border-[#262626]">
          {/* Unboxed tool list separated by typographic middots */}
          <p className="text-xs font-mono text-[#525252] dark:text-[#A3A3A3]">
            {project.tools.join(' · ')}
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="invert-block w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] text-sm font-semibold hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
            >
              <span>Read Case Study</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={`project-expanded-${project.id}`}
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
                isExpanded
                  ? 'border-[#FF721A] bg-[#FF721A] text-[#0A0A0A]'
                  : 'border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414] text-[#0A0A0A] dark:text-white hover:border-[#FF721A]'
              }`}
            >
              <span>{isExpanded ? 'Hide Specs' : 'Expand Specs'}</span>
              <motion.span
                aria-hidden="true"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.25, ease: ARTCRAFT_EASE }
                }
                className="inline-flex items-center"
              >
                <ChevronDown size={15} />
              </motion.span>
            </button>
          </div>
        </div>
      </motion.div>

        {/* Expanded Technical Specifications & Project Constraints Drawer */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={`project-expanded-${project.id}`}
              key={`expanded-${project.id}`}
              layout={prefersReducedMotion ? false : 'position'}
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, height: 0, filter: 'blur(6px)' }
              }
              animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, height: 0, filter: 'blur(4px)' }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.42, ease: ARTCRAFT_EASE }
              }
              className="md:col-span-12 overflow-hidden border-t border-[#E5E5E5] dark:border-[#262626] bg-white/75 dark:bg-black/45"
            >
              <div className="p-5 sm:p-7 lg:p-9 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Technical Specifications Grid */}
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <p className="font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A]">
                      Technical Specifications
                    </p>
                    <span className="font-mono text-[11px] tabular-nums text-[#737373]">
                      {String(project.specs.length).padStart(2, '0')} Parameters
                    </span>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {project.specs.map((spec, specIdx) => (
                      <motion.div
                        key={spec.label}
                        initial={
                          prefersReducedMotion
                            ? false
                            : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: prefersReducedMotion ? 0 : 0.08 + specIdx * 0.04,
                          ease: ARTCRAFT_EASE,
                        }}
                        className="pb-3 border-b border-[#E5E5E5]/80 dark:border-[#262626]/80 space-y-1"
                      >
                        <dt className="font-mono text-[11px] text-[#525252] dark:text-[#A3A3A3]">
                          {spec.label}
                        </dt>
                        <dd className="text-sm font-semibold text-[#0A0A0A] dark:text-white">
                          {spec.value}
                        </dd>
                      </motion.div>
                    ))}
                  </dl>
                </div>

                {/* Engineering & Design Constraints List */}
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <p className="font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A]">
                      Project Constraints
                    </p>
                    <span className="font-mono text-[11px] tabular-nums text-[#737373]">
                      {String(project.constraints.length).padStart(2, '0')} Boundaries
                    </span>
                  </div>
                  <ul className="divide-y divide-[#E5E5E5] dark:divide-[#262626]">
                    {project.constraints.map((constraint, cIdx) => (
                      <motion.li
                        key={constraint}
                        initial={
                          prefersReducedMotion
                            ? false
                            : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: prefersReducedMotion ? 0 : 0.12 + cIdx * 0.05,
                          ease: ARTCRAFT_EASE,
                        }}
                        className="py-3 first:pt-1 last:pb-0 flex items-start gap-3 text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]"
                      >
                        <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A] shrink-0">
                          <span className="w-1.5 h-1.5 bg-[#FF721A]" aria-hidden="true" />
                          {String(cIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#0A0A0A] dark:text-[#E5E5E5]">
                          {constraint}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.article>
    </ParallaxLayer>
  </motion.div>
  );
};

export const WorksSection: React.FC<WorksSectionProps> = ({
  activeFilter,
  onChangeFilter,
  onOpenProject,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [pointerFine, setPointerFine] = useState(false);
  const [hasSwitchedFilter, setHasSwitchedFilter] = useState(false);
  const prevFilterRef = useRef<ProjectCategory>(activeFilter);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (prevFilterRef.current !== activeFilter) {
      prevFilterRef.current = activeFilter;
      setHasSwitchedFilter(true);
    }
  }, [activeFilter]);

  const handleFilterClick = (nextFilter: ProjectCategory) => {
    if (nextFilter === activeFilter) return;
    setHasSwitchedFilter(true);
    onChangeFilter(nextFilter);
  };

  const filteredProjects =
    activeFilter === 'all'
      ? PROJECTS
      : PROJECTS.filter((project) => project.filterCategory === activeFilter);

  const allowParallax = pointerFine && !prefersReducedMotion;

  return (
    <section
      id="work"
      className="snap-start py-14 sm:py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-[#262626]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header + Functional Segmented Filter Bar */}
        <div data-choreo="" className="space-y-6">
          <DrawRule />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 sm:pb-10 border-b border-[#E5E5E5] dark:border-[#262626]">
            <div>
              <DrawEyebrow
                delay={0.1}
                className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A] mb-2.5 sm:mb-3"
              >
                02. Selected Works
              </DrawEyebrow>
              <BlurSlideReveal delay={0.16}>
                <h2
                  className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0A0A0A] dark:text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Case Studies &amp; Hardware Research
                </h2>
              </BlurSlideReveal>
            </div>

            <div
              role="tablist"
              aria-label="Filter projects by discipline"
              className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 rounded-xl bg-[#F5F5F5] dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] self-stretch sm:self-start lg:self-auto w-full sm:w-auto"
            >
              {FILTER_OPTIONS.map((option) => {
                const isSelected = activeFilter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleFilterClick(option.id)}
                    className={`relative min-h-[40px] px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
                      isSelected
                        ? 'text-white dark:text-[#0A0A0A]'
                        : 'text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="works-active-tab"
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 420, damping: 32 }
                        }
                        className="absolute inset-0 rounded-lg bg-[#0A0A0A] dark:bg-[#FF721A]"
                      />
                    )}
                    <span className="relative z-10">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Bento Grid with Staggered Category Filter Transitions & Layout Expansion */}
        <LayoutGroup id="works-cards-layout">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeFilter}
              data-reveal-group=""
              custom={prefersReducedMotion}
              variants={GRID_STAGGER_VARIANTS}
              initial="hidden"
              animate={hasSwitchedFilter ? 'visible' : undefined}
              whileInView={hasSwitchedFilter ? undefined : 'visible'}
              exit="exit"
              viewport={
                hasSwitchedFilter
                  ? undefined
                  : { once: true, amount: 'some', margin: '0px 0px -48px 0px' }
              }
              className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8"
            >
              {filteredProjects.map((project, index) => (
                <MagneticProjectCard
                  key={`${activeFilter}-${project.id}`}
                  project={project}
                  index={index}
                  isLeadFeatured={activeFilter === 'all' && index === 0}
                  allowParallax={allowParallax}
                  prefersReducedMotion={prefersReducedMotion}
                  onOpenProject={onOpenProject}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
};
