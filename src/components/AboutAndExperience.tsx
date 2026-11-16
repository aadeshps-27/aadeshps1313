import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  EXPERIENCE,
  PROCESS_PILLARS,
  PROFILE,
  SKILL_MARQUEE_ITEMS,
} from '../data/portfolio';
import { ExperienceTimeline } from './ExperienceTimeline';
import { SafeImage } from './SafeImage';
import {
  ARTCRAFT_EASE,
  PARALLAX_SPRING,
  ParallaxLayer,
  RegistrationTick,
  SectionChoreoHeader,
} from './MotionPrimitives';

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

export const AboutAndExperience: React.FC = () => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [aboutHovered, setAboutHovered] = useState(false);
  const aboutBlockRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: marqueeProgress } = useScroll({
    target: marqueeRef,
    offset: ['start end', 'end start'],
  });
  const smoothMarquee = useSpring(marqueeProgress, PARALLAX_SPRING);
  const marqueeParallaxX = useTransform(smoothMarquee, [0, 1], [60, -140]);

  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);
  const smoothX = useSpring(hoverX, { stiffness: 220, damping: 24, mass: 0.5 });
  const smoothY = useSpring(hoverY, { stiffness: 220, damping: 24, mass: 0.5 });

  const portraitX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const portraitY = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);
  const portraitRotate = useTransform(smoothX, [-0.5, 0.5], [-2.2, 2.2]);

  useEffect(() => {
    if (typeof window === 'undefined' || !PROFILE.portraitImage) return;
    const preload = new window.Image();
    preload.src = PROFILE.portraitImage;
  }, []);

  const handleAboutPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch' && !aboutHovered) {
      setAboutHovered(true);
    }
    if (prefersReducedMotion || !aboutBlockRef.current) return;
    const rect = aboutBlockRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
    const ny = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5));
    hoverX.set(nx);
    hoverY.set(ny);
  };

  const handleAboutLeave = () => {
    setAboutHovered(false);
    hoverX.set(0);
    hoverY.set(0);
  };

  return (
    <>
      {/* Discipline Marquee Divider with Scroll-Scrubbed Horizontal Parallax */}
      <div
        ref={marqueeRef}
        aria-hidden="true"
        className="overflow-hidden border-b border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] py-3 sm:py-3.5"
      >
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : { x: marqueeParallaxX, willChange: 'transform' }
          }
        >
          <div className="animate-marquee text-xs font-mono text-[#525252] dark:text-[#A3A3A3]">
            {[...SKILL_MARQUEE_ITEMS, ...SKILL_MARQUEE_ITEMS].map((item, idx) => (
              <span key={`${item}-${idx}`} className="inline-flex items-center">
                <span className="px-4 sm:px-5">{item}</span>
                <span className="text-[#FF721A]">·</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Practice & Philosophy */}
      <section
        id="about"
        className="py-14 sm:py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-[#262626]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <ParallaxLayer speed={14} className="relative z-30 lg:col-span-6">
              <div className="space-y-5 sm:space-y-6">
              <SectionChoreoHeader eyebrow="02. Origins & Ethos">
                <h2
                  className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0A0A0A] dark:text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Where applied electronics meets{' '}
                  <span className="font-serif italic font-medium text-[#C94B00] dark:text-[#FF721A]">
                    intentional
                  </span>{' '}
                  design.
                </h2>
              </SectionChoreoHeader>

              {/* Interactive Primary About Text Block with Hover-Revealed Engineer Portrait */}
              <div
                ref={aboutBlockRef}
                tabIndex={0}
                onMouseEnter={() => setAboutHovered(true)}
                onMouseLeave={handleAboutLeave}
                onPointerMove={handleAboutPointerMove}
                onFocus={() => setAboutHovered(true)}
                onBlur={handleAboutLeave}
                className="group relative max-w-xl p-4 sm:p-5 -mx-4 sm:-mx-5 rounded-2xl border border-transparent hover:border-[#E5E5E5] dark:hover:border-[#262626] hover:bg-[#FAFAFA]/80 dark:hover:bg-[#0A0A0A]/80 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                  <ScrollRevealText as="p" delay={0.08}>
                    I am{' '}
                    <strong className="font-bold text-[#0A0A0A] dark:text-white">
                      {PROFILE.name}
                    </strong>
                    , a creative developer and visual designer based in {PROFILE.location}. Holding
                    a {PROFILE.education}, my work lives at the intersection of tactile hardware
                    systems and human-centered web software.
                  </ScrollRevealText>
                  <ScrollRevealText
                    as="p"
                    delay={0.12}
                    className="font-serif italic text-base sm:text-lg text-[#0A0A0A] dark:text-white"
                  >
                    &ldquo;I don&apos;t just build interfaces; I construct digital architectures
                    that prioritize human intuition over technical complexity.&rdquo;
                  </ScrollRevealText>
                  <ScrollRevealText as="p" delay={0.16}>
                    Whether calibrating an RF trilateration filter on an ESP32 or refining bezier
                    curves in Affinity and Illustrator, I bring disciplined engineering clarity to
                    expressive creative execution.
                  </ScrollRevealText>
                </div>

                {/* Desktop Floating Stylized Engineer Portrait (centered cleanly & elevated above neighbor column) */}
                <div className="hidden md:block pointer-events-none absolute top-1/2 -translate-y-1/2 left-[calc(100%-3rem)] lg:left-[calc(100%-2.25rem)] z-40 w-48 lg:w-56">
                  <AnimatePresence>
                    {aboutHovered && (
                      <motion.div
                        key="engineer-hover-portrait"
                        aria-hidden="true"
                        initial={
                          prefersReducedMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.88, filter: 'blur(8px)' }
                        }
                        animate={
                          prefersReducedMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 1, scale: 1.03, filter: 'blur(0px)' }
                        }
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.92, filter: 'blur(6px)' }
                        }
                        transition={{ duration: 0.36, ease: EASE_OUT_EXPO }}
                        style={
                          prefersReducedMotion
                            ? undefined
                            : {
                                x: portraitX,
                                y: portraitY,
                                rotate: portraitRotate,
                                willChange: 'transform, opacity',
                              }
                        }
                        className="w-full rounded-2xl border border-[#FF721A]/85 bg-white dark:bg-[#0A0A0A] shadow-2xl overflow-hidden"
                      >
                        <div className="aspect-square overflow-hidden bg-[#FAFAFA] dark:bg-[#141414]">
                          <motion.div
                            className="w-full h-full"
                            initial={prefersReducedMotion ? false : { scale: 1.08 }}
                            animate={{ scale: 1.01 }}
                            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                          >
                            <SafeImage
                              src={PROFILE.portraitImage}
                              alt={PROFILE.portraitImageAlt}
                              fallbackLabel={PROFILE.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </motion.div>
                        </div>
                        <div className="px-3.5 py-2.5 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="font-semibold text-[#0A0A0A] dark:text-white truncate">
                            {PROFILE.name}
                          </span>
                          <span className="text-[#C94B00] dark:text-[#FF721A] shrink-0">
                            AE · SWE
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Compact Touch / Mobile Portrait Signature */}
                <motion.div
                  whileTap={prefersReducedMotion ? undefined : { scale: 1.03 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className="md:hidden mt-5 pt-4 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center gap-3.5"
                >
                  <div className="w-16 aspect-square rounded-xl overflow-hidden border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#141414] shrink-0">
                    <SafeImage
                      src={PROFILE.portraitImage}
                      alt={PROFILE.portraitImageAlt}
                      fallbackLabel={PROFILE.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-[#0A0A0A] dark:text-white">
                      {PROFILE.name}
                    </p>
                    <p className="text-[#525252] dark:text-[#A3A3A3]">
                      {PROFILE.education}
                    </p>
                    <p className="font-mono text-[#C94B00] dark:text-[#FF721A]">
                      {PROFILE.location}
                    </p>
                  </div>
                </motion.div>
              </div>
              </div>
            </ParallaxLayer>

            {/* 4-Stage Process Grid with staggered depth parallax */}
            <div
              data-reveal-group=""
              className="relative z-10 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              {PROCESS_PILLARS.map((pillar, idx) => (
                <ParallaxLayer
                  key={pillar.step}
                  speed={idx % 2 === 0 ? 10 : 22}
                  className="h-full"
                >
                  <motion.div
                    data-reveal=""
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 22, filter: 'blur(6px)' }
                    }
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.15 }}
                    whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                    transition={{
                      duration: 0.68,
                      delay: prefersReducedMotion ? 0 : idx * 0.07,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="h-full rule-reveal overflow-hidden p-5 sm:p-7 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors duration-200 space-y-2.5 sm:space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
                        {pillar.step}
                      </span>
                      <RegistrationTick delay={idx * 0.07 + 0.2} />
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A0A0A] dark:text-white">
                      {pillar.title}
                    </h3>
                    <ScrollRevealText
                      as="p"
                      delay={idx * 0.05 + 0.08}
                      className="text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]"
                    >
                      {pillar.desc}
                    </ScrollRevealText>
                  </motion.div>
                </ParallaxLayer>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Experience & Academic Timeline */}
      <section
        id="experience"
        className="py-14 sm:py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-[#262626]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3 sm:space-y-4">
              <SectionChoreoHeader eyebrow="03. Journey">
                <h2
                  className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0A0A0A] dark:text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Experience &amp; Academic Foundation
                </h2>
              </SectionChoreoHeader>
              <ScrollRevealText
                as="p"
                delay={0.14}
                className="text-sm leading-relaxed text-[#525252] dark:text-[#A3A3A3]"
              >
                Multidisciplinary progression across digital brand strategy, full-stack web
                engineering, and postgraduate applied electronics research.
              </ScrollRevealText>
            </div>

            <div className="lg:col-span-8">
              <ExperienceTimeline
                items={EXPERIENCE}
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
    </>
  );
};
