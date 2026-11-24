import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ProjectCategory } from '../data/portfolio';
import { ExperienceTimeline } from './ExperienceTimeline';
import { LiveClock } from './LiveClock';
import { SafeImage } from './SafeImage';
import { warmImage } from '../utils/imagePreload';
import { TechnologyCloud } from './TechnologyCloud';
import {
  ARTCRAFT_EASE,
  DrawEyebrow,
  DrawRule,
  ParallaxLayer,
  RegistrationTick,
  RfFlickerText,
  SectionChoreoHeader,
} from './MotionPrimitives';
import { useLanguage } from './LanguageProvider';

const EASE_OUT_EXPO = ARTCRAFT_EASE;

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: 'p' | 'div' | 'h2';
  style?: React.CSSProperties;
}

const ScrollRevealText: React.FC<RevealTextProps> = ({
  children,
  className,
  delay = 0,
  as = 'p',
  style,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement & HTMLParagraphElement & HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(
    () => Boolean(prefersReducedMotion) || typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (prefersReducedMotion || isVisible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion, isVisible]);

  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref}
      style={style}
      className={className}
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: 18, filter: 'blur(6px)' }
      }
      animate={
        prefersReducedMotion || isVisible
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, y: 18, filter: 'blur(6px)' }
      }
      transition={{
        duration: 0.7,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASE_OUT_EXPO,
      }}
    >
      {children}
    </MotionTag>
  );
};

interface AboutSectionProps {
  entranceReady?: boolean;
  onSelectDisciplineFilter?: (filter: Exclude<ProjectCategory, 'all'>) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  entranceReady = true,
  onSelectDisciplineFilter,
}) => {
  const { lang, t } = useLanguage();
  const profile = t.portfolio.profile;
  const processPillars = t.portfolio.processPillars;
  const disciplines = t.portfolio.disciplines;
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [pointerFine, setPointerFine] = useState(false);
  const [portraitHovered, setPortraitHovered] = useState(false);
  const portraitFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const allowTilt = pointerFine && !prefersReducedMotion;
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 24, mass: 0.55 });
  const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 24, mass: 0.55 });

  useEffect(() => {
    if (profile.portraitImage) {
      warmImage(profile.portraitImage);
    }
  }, [profile.portraitImage]);

  const [bioEndBeforeEdu, bioEndAfterEdu] = t.about.bioEnd.split('{education}');

  const handlePortraitMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!allowTilt || !portraitFrameRef.current) return;
    const rect = portraitFrameRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawRotateX.set(-py * 7);
    rawRotateY.set(px * 7);
  };

  const handlePortraitLeave = () => {
    setPortraitHovered(false);
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  return (
    <section
      id="about"
      className="snap-start pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div id="top" className="space-y-8 sm:space-y-10">
          {/* Top Architectural Kicker & Live Location */}
          <div data-choreo="" className="space-y-3 sm:space-y-4">
            <DrawRule onMount />
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
              <DrawEyebrow
                onMount
                delay={0.08}
                className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]"
              >
                {t.about.eyebrow}
              </DrawEyebrow>
              <div className="inline-flex items-center gap-2 text-xs text-[#525252] dark:text-[#A3A3A3]">
                <RegistrationTick onMount delay={0.22} />
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <span>{profile.location}</span>
                  <span aria-hidden="true" className="text-[#C94B00] dark:text-[#FF721A]">·</span>
                  <LiveClock className="text-[#0A0A0A] dark:text-white" />
                </span>
              </div>
            </div>
          </div>

          {/* Full-Width Oversized Display Statement with ReFactory character flicker */}
          <div className="max-w-4xl">
            <RfFlickerText
              key={`hero-h1-${lang}`}
              as="h1"
              mode="heading"
              onMount
              ready={entranceReady}
              mountDelayMs={90}
              className={`font-display font-bold tracking-tight text-[#0A0A0A] dark:text-white text-[clamp(2.1rem,4.7vw,4.35rem)] ${
                lang === 'ml' ? 'leading-[1.24]' : 'leading-[1.08]'
              }`}
              style={{ textWrap: 'balance' }}
              segments={t.about.headlineSegments.map((seg) => ({
                text: seg.text,
                className: seg.accent
                  ? 'font-serif italic font-medium text-[#C94B00] dark:text-[#FF721A]'
                  : undefined,
              }))}
            />
          </div>

          {/* Balanced 12-Col Hero Showcase: Orbital Portrait Monolith + Editorial Manifesto & Process */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Tactile 3D Orbital Portrait Frame */}
            <div className="lg:col-span-5 flex flex-col">
              <motion.div
                ref={portraitFrameRef}
                onPointerEnter={() => setPortraitHovered(true)}
                onPointerMove={handlePortraitMove}
                onPointerLeave={handlePortraitLeave}
                onPointerCancel={handlePortraitLeave}
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 22, scale: 0.98, filter: 'blur(8px)' }
                }
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.78, delay: 0.16, ease: ARTCRAFT_EASE }}
                style={
                  allowTilt
                    ? { rotateX, rotateY, transformPerspective: 1000, willChange: 'transform' }
                    : undefined
                }
                className="group flex-1 flex flex-col rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A]/80 transition-colors duration-200 overflow-hidden"
              >
                <div className="rf-reticle-corners relative w-full overflow-hidden bg-[#F5F5F5] dark:bg-[#111111]">
                  {/* Subtle ambient radial studio backdrop */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-80"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 42%, rgba(255,114,26,0.12) 0%, transparent 62%)',
                    }}
                  />

                  {/* Concentric Orbital Calibration Hairlines */}
                  <motion.svg
                    aria-hidden="true"
                    viewBox="0 0 400 400"
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : { rotate: portraitHovered ? 24 : 360 }
                    }
                    transition={
                      prefersReducedMotion
                        ? undefined
                        : portraitHovered
                          ? { duration: 0.9, ease: ARTCRAFT_EASE }
                          : { duration: 48, repeat: Infinity, ease: 'linear' }
                    }
                    className="pointer-events-none absolute inset-0 w-full h-full text-[#0A0A0A]/12 dark:text-white/12 scale-110"
                  >
                    <circle
                      cx="200"
                      cy="200"
                      r="176"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 8"
                    />
                    <circle
                      cx="200"
                      cy="200"
                      r="142"
                      fill="none"
                      stroke="#FF721A"
                      strokeOpacity="0.32"
                      strokeWidth="1"
                    />
                    <line x1="200" y1="14" x2="200" y2="28" stroke="#FF721A" strokeWidth="1.5" />
                    <line x1="200" y1="372" x2="200" y2="386" stroke="#FF721A" strokeWidth="1.5" />
                    <line x1="14" y1="200" x2="28" y2="200" stroke="currentColor" strokeWidth="1.2" />
                    <line x1="372" y1="200" x2="386" y2="200" stroke="currentColor" strokeWidth="1.2" />
                  </motion.svg>

                  {/* Stylized Geometric Engineer Portrait with Natural Proportions */}
                  <motion.div
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : { scale: portraitHovered ? 1.035 : 1 }
                    }
                    transition={{ duration: 0.45, ease: ARTCRAFT_EASE }}
                    className="relative z-10 w-full"
                  >
                    <SafeImage
                      src={profile.portraitImage}
                      alt={profile.portraitImageAlt}
                      fallbackLabel={profile.name}
                      priority="high"
                      loading="eager"
                      decoding="async"
                      className="w-full h-auto object-contain object-top"
                    />
                  </motion.div>

                  {/* Soft bottom edge gradient scrim */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 via-black/10 to-transparent z-20"
                  />
                </div>

                {/* Clean Typography Caption Footer */}
                <div className="px-5 py-4 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-3 bg-white dark:bg-[#0A0A0A]">
                  <div className="min-w-0">
                    <p className="font-display text-sm sm:text-base font-bold text-[#0A0A0A] dark:text-white leading-snug">
                      {profile.name}
                    </p>
                    <p className="text-xs text-[#525252] dark:text-[#A3A3A3] leading-snug">
                      {profile.education}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A] whitespace-nowrap shrink-0">
                    AE · SWE
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Origins Statement + 2x2 Process Pillars aligned cleanly */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-7 sm:gap-8">
              <div className="space-y-5 sm:space-y-6">
                <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                  <ScrollRevealText as="p" delay={0.08}>
                    {t.about.bioPrefix}
                    <strong className="font-bold text-[#0A0A0A] dark:text-white">
                      {profile.name}
                    </strong>
                    {t.about.bioMiddle}
                    {profile.location}
                    {bioEndBeforeEdu}
                    {profile.education}
                    {bioEndAfterEdu ?? ''}
                  </ScrollRevealText>

                  <div className="pt-4 pb-1 border-t border-[#E5E5E5] dark:border-[#262626]">
                    <ScrollRevealText
                      as="p"
                      delay={0.12}
                      className="font-serif italic text-lg sm:text-xl leading-snug text-[#0A0A0A] dark:text-white"
                    >
                      {t.about.quote}
                    </ScrollRevealText>
                  </div>

                  <ScrollRevealText as="p" delay={0.16}>
                    {t.about.secondPara}
                  </ScrollRevealText>
                </div>
              </div>

              {/* 4-Stage Process Grid anchoring bottom baseline alongside the portrait */}
              <div
                data-reveal-group=""
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
              >
                {processPillars.map((pillar, idx) => (
                  <ParallaxLayer
                    key={pillar.step}
                    speed={idx % 2 === 0 ? 6 : 12}
                    className="h-full"
                  >
                    <motion.div
                      data-reveal=""
                      initial={
                        prefersReducedMotion
                          ? false
                          : { opacity: 0, y: 20, filter: 'blur(6px)' }
                      }
                      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      viewport={{ once: true, amount: 0.15 }}
                      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                      transition={{
                        duration: 0.65,
                        delay: prefersReducedMotion ? 0 : idx * 0.06,
                        ease: EASE_OUT_EXPO,
                      }}
                      className="h-full rule-reveal overflow-hidden p-5 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors duration-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
                          {pillar.step}
                        </span>
                        <RegistrationTick delay={idx * 0.06 + 0.18} />
                      </div>
                      <h2 className="font-display text-base sm:text-lg font-bold text-[#0A0A0A] dark:text-white">
                        {pillar.title}
                      </h2>
                      <ScrollRevealText
                        as="p"
                        delay={idx * 0.04 + 0.08}
                        className="text-xs sm:text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]"
                      >
                        {pillar.desc}
                      </ScrollRevealText>
                    </motion.div>
                  </ParallaxLayer>
                ))}
              </div>
            </div>
          </div>
        </div>

        <TechnologyCloud />

        {/* Interactive 4-Column Discipline Index Strip bridging into Selected Works */}
        <div className="mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-[#E5E5E5] dark:border-[#262626] space-y-5 sm:space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DrawEyebrow
              delay={0.08}
              className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]"
            >
              {t.about.coreDisciplines}
            </DrawEyebrow>
            <span className="font-mono text-[11px] text-[#525252] dark:text-[#A3A3A3]">
              {t.about.selectDisciplineHint}
            </span>
          </div>

          <div
            data-reveal-group=""
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6"
          >
            {disciplines.map((item, idx) => (
              <ParallaxLayer
                key={item.number}
                speed={idx % 2 === 0 ? 7 : 15}
                className="h-full"
              >
                <motion.button
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
                    onSelectDisciplineFilter?.(item.filter);
                    const el = document.getElementById('work');
                    el?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                  }}
                  className="w-full h-full group rule-reveal overflow-hidden text-left p-4 sm:p-5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
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
                  <h3 className="font-display text-base font-semibold text-[#0A0A0A] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#525252] dark:text-[#A3A3A3]">
                    {item.detail}
                  </p>
                </motion.button>
              </ParallaxLayer>
            ))}
          </div>

          {/* Architectural Scroll-Down Indicator guiding toward Selected Works */}
          <div className="pt-2 sm:pt-4 flex items-center gap-4 sm:gap-6">
            <span
              aria-hidden="true"
              className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent to-[#E5E5E5] dark:to-[#262626]"
            />

            <motion.button
              type="button"
              aria-label={t.about.scrollToWorksAria}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              whileHover={prefersReducedMotion ? undefined : { y: 2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
              transition={{ duration: 0.5, ease: ARTCRAFT_EASE }}
              onClick={() => {
                const el = document.getElementById('work');
                el?.scrollIntoView({
                  behavior: prefersReducedMotion ? 'auto' : 'smooth',
                });
              }}
              className="group mx-auto inline-flex items-center gap-3 px-4 py-2 min-h-[44px] rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A]"
            >
              <span
                aria-hidden="true"
                className="relative w-px h-5 bg-[#E5E5E5] dark:bg-[#262626] overflow-hidden shrink-0"
              >
                {prefersReducedMotion ? (
                  <span className="absolute bottom-0 left-0 w-full h-2 bg-[#FF721A]" />
                ) : (
                  <motion.span
                    animate={{ y: ['-100%', '220%'] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="block w-full h-2.5 bg-[#FF721A]"
                  />
                )}
              </span>

              <span className="font-mono text-[11px] tabular-nums font-semibold tracking-wide text-[#525252] dark:text-[#A3A3A3] group-hover:text-[#0A0A0A] dark:group-hover:text-white transition-colors whitespace-nowrap">
                <span className="text-[#C94B00] dark:text-[#FF721A] mr-1.5">02</span>
                {t.about.scrollToWorks}
              </span>

              <span
                aria-hidden="true"
                className="flex flex-col items-center -space-y-1.5 text-[#C94B00] dark:text-[#FF721A]"
              >
                {[0, 1].map((idx) => (
                  <motion.span
                    key={idx}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : {
                            y: [0, 2.5, 0],
                            opacity: [0.3, 1, 0.3],
                          }
                    }
                    transition={
                      prefersReducedMotion
                        ? undefined
                        : {
                            duration: 1.4,
                            delay: idx * 0.22,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                    }
                    className="inline-flex leading-none"
                  >
                    <ChevronDown size={13} strokeWidth={2.2} />
                  </motion.span>
                ))}
              </span>
            </motion.button>

            <span
              aria-hidden="true"
              className="hidden sm:block h-px flex-1 bg-gradient-to-l from-transparent to-[#E5E5E5] dark:to-[#262626]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export const ExperienceSection: React.FC = () => {
  const { lang, t } = useLanguage();

  return (
    <section
        id="experience"
        className="snap-start py-12 sm:py-16 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3 sm:space-y-4">
              <SectionChoreoHeader eyebrow={t.about.experienceEyebrow}>
                <RfFlickerText
                  key={`exp-h2-${lang}`}
                  as="h2"
                  mode="heading"
                  className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0A0A0A] dark:text-white"
                  style={{ textWrap: 'balance' }}
                  segments={[{ text: t.about.experienceTitle }]}
                />
              </SectionChoreoHeader>
              <ScrollRevealText
                as="p"
                delay={0.14}
                className="text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]"
              >
                {t.about.experienceSubtitle}
              </ScrollRevealText>
            </div>

            <div className="lg:col-span-8">
              <ExperienceTimeline
                items={t.portfolio.experience}
                renderRevealText={({ children, className, delay, as }) => (
                  <ScrollRevealText className={className} delay={delay} as={as}>
                    {children}
                  </ScrollRevealText>
                )}
              />
            </div>
          </div>
        </div>
      </section>
  );
};

export const AboutAndExperience: React.FC<AboutSectionProps> = ({
  onSelectDisciplineFilter,
}) => (
  <>
    <AboutSection onSelectDisciplineFilter={onSelectDisciplineFilter} />
    <ExperienceSection />
  </>
);
