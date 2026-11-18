import React, { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { ARTCRAFT_EASE, PARALLAX_SPRING } from './MotionPrimitives';

interface SectionDividerProps {
  index: string;
  label: string;
  descriptor?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  index,
  label,
  descriptor,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const dividerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: dividerRef,
    offset: ['start 95%', 'end 10%'],
  });

  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  // Subtle scroll-linked horizontal needle glints sliding inward along the hairlines
  const leftGlintX = useTransform(smoothProgress, [0, 1], ['-65%', '15%']);
  const rightGlintX = useTransform(smoothProgress, [0, 1], ['65%', '-15%']);

  return (
    <div
      ref={dividerRef}
      role="separator"
      aria-label={`${index}. ${label}`}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-2 select-none"
    >
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Left Symmetric Hairline + Registration Tick */}
        <div className="relative flex-1 flex items-center justify-end overflow-hidden h-3">
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0.3 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.72,
              ease: ARTCRAFT_EASE,
            }}
            style={{ transformOrigin: 'right center' }}
            className="relative h-px w-full bg-[#E5E5E5] dark:bg-[#262626] overflow-hidden"
          >
            {!prefersReducedMotion && (
              <motion.span
                style={{ x: leftGlintX }}
                className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#FF721A]/70 via-[#FF721A]/25 to-transparent"
              />
            )}
          </motion.div>
          <motion.span
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.32,
              delay: prefersReducedMotion ? 0 : 0.16,
              ease: ARTCRAFT_EASE,
            }}
            className="ml-2 w-1.5 h-1.5 bg-[#FF721A] shrink-0"
          />
        </div>

        {/* Centered Unboxed Editorial Label */}
        <motion.div
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, y: 8, filter: 'blur(6px)' }
          }
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 'some' }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.65,
            delay: prefersReducedMotion ? 0 : 0.08,
            ease: ARTCRAFT_EASE,
          }}
          className="inline-flex items-center gap-2 px-1 sm:px-2 shrink-0"
        >
          <span className="font-mono text-[11px] tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
            {index}
          </span>
          <span
            aria-hidden="true"
            className="text-[#A3A3A3] dark:text-[#525252]"
          >
            ·
          </span>
          <span className="font-serif italic text-sm sm:text-base font-medium tracking-tight text-[#0A0A0A] dark:text-white whitespace-nowrap">
            {label}
          </span>
          {descriptor && (
            <>
              <span
                aria-hidden="true"
                className="hidden sm:inline text-[#D4D4D4] dark:text-[#404040]"
              >
                /
              </span>
              <span className="hidden sm:inline font-mono text-[11px] text-[#737373] dark:text-[#737373] whitespace-nowrap">
                {descriptor}
              </span>
            </>
          )}
        </motion.div>

        {/* Right Registration Tick + Symmetric Hairline */}
        <div className="relative flex-1 flex items-center justify-start overflow-hidden h-3">
          <motion.span
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.32,
              delay: prefersReducedMotion ? 0 : 0.16,
              ease: ARTCRAFT_EASE,
            }}
            className="mr-2 w-1.5 h-1.5 bg-[#FF721A] shrink-0"
          />
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0.3 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.72,
              ease: ARTCRAFT_EASE,
            }}
            style={{ transformOrigin: 'left center' }}
            className="relative h-px w-full bg-[#E5E5E5] dark:bg-[#262626] overflow-hidden"
          >
            {!prefersReducedMotion && (
              <motion.span
                style={{ x: rightGlintX }}
                className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#FF721A]/70 via-[#FF721A]/25 to-transparent"
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
