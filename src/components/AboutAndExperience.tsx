import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  EXPERIENCE,
  PROCESS_PILLARS,
  PROFILE,
  SKILL_MARQUEE_ITEMS,
} from '../data/portfolio';
import { ExperienceTimeline } from './ExperienceTimeline';
import { ARTCRAFT_EASE, RegistrationTick, SectionChoreoHeader } from './MotionPrimitives';

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
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Discipline Marquee Divider */}
      <div
        aria-hidden="true"
        className="overflow-hidden border-b border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] py-3 sm:py-3.5"
      >
        <div className="animate-marquee text-xs font-mono text-[#525252] dark:text-[#A3A3A3]">
          {[...SKILL_MARQUEE_ITEMS, ...SKILL_MARQUEE_ITEMS].map((item, idx) => (
            <span key={`${item}-${idx}`} className="inline-flex items-center">
              <span className="px-4 sm:px-5">{item}</span>
              <span className="text-[#FF721A]">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Practice & Philosophy */}
      <section
        id="about"
        className="py-14 sm:py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-[#262626]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
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

              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3] max-w-xl">
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
            </div>

            {/* 4-Stage Process Grid */}
            <div
              data-reveal-group=""
              className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              {PROCESS_PILLARS.map((pillar, idx) => (
                <motion.div
                  key={pillar.step}
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
                  className="rule-reveal overflow-hidden p-5 sm:p-7 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors duration-200 space-y-2.5 sm:space-y-3"
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
            <div className="lg:col-span-4 space-y-3 sm:space-y-4">
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
