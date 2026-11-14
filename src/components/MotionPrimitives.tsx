import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const ARTCRAFT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface DrawRuleProps {
  className?: string;
  delay?: number;
  accent?: boolean;
  onMount?: boolean;
}

/**
 * Architectural hairline rule (`data-draw-rule`) that draws across along X (`scaleX: 0 -> 1`).
 */
export const DrawRule: React.FC<DrawRuleProps> = ({
  className = '',
  delay = 0,
  accent = false,
  onMount = false,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      data-draw-rule=""
      initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0.35 }}
      animate={onMount ? { scaleX: 1, opacity: 1 } : undefined}
      whileInView={onMount ? undefined : { scaleX: 1, opacity: 1 }}
      viewport={onMount ? undefined : { once: true, amount: 'some' }}
      transition={{
        duration: 0.7,
        delay: prefersReducedMotion ? 0 : delay,
        ease: ARTCRAFT_EASE,
      }}
      style={{ transformOrigin: 'left center' }}
      className={`h-px w-full ${
        accent ? 'bg-[#FF721A]' : 'bg-[#E5E5E5] dark:bg-[#262626]'
      } ${className}`}
    />
  );
};

interface DrawEyebrowProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onMount?: boolean;
}

/**
 * Section/Hero kicker (`data-draw-eyebrow` + `data-draw-tick`) with drawn orange rule
 * and blur-to-sharp entry.
 */
export const DrawEyebrow: React.FC<DrawEyebrowProps> = ({
  children,
  className = '',
  delay = 0,
  onMount = false,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      data-draw-eyebrow=""
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <motion.span
        aria-hidden="true"
        data-draw-tick=""
        initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={onMount ? { scaleX: 1, opacity: 1 } : undefined}
        whileInView={onMount ? undefined : { scaleX: 1, opacity: 1 }}
        viewport={onMount ? undefined : { once: true, amount: 'some' }}
        transition={{
          duration: 0.45,
          delay: prefersReducedMotion ? 0 : delay,
          ease: ARTCRAFT_EASE,
        }}
        style={{ transformOrigin: 'left center' }}
        className="inline-block w-5 h-[2px] bg-[#FF721A] shrink-0"
      />
      <motion.span
        initial={
          prefersReducedMotion
            ? false
            : { opacity: 0, y: 12, filter: 'blur(6px)' }
        }
        animate={
          onMount ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined
        }
        whileInView={
          onMount ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }
        }
        viewport={onMount ? undefined : { once: true, amount: 'some' }}
        transition={{
          duration: 0.65,
          delay: prefersReducedMotion ? 0 : delay + 0.1,
          ease: ARTCRAFT_EASE,
        }}
      >
        {children}
      </motion.span>
    </div>
  );
};

interface BlurSlideRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onMount?: boolean;
  distance?: number;
}

/**
 * ArtCraft-signature optical sharpen reveal (`opacity: 0, y: 24, filter: blur(8px) -> sharp`).
 */
export const BlurSlideReveal: React.FC<BlurSlideRevealProps> = ({
  children,
  className = '',
  delay = 0,
  onMount = false,
  distance = 24,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-reveal=""
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: distance, filter: 'blur(8px)' }
      }
      animate={
        onMount ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined
      }
      whileInView={
        onMount ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }
      }
      viewport={onMount ? undefined : { once: true, amount: 'some' }}
      transition={{
        duration: 0.8,
        delay: prefersReducedMotion ? 0 : delay,
        ease: ARTCRAFT_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface RegistrationTickProps {
  delay?: number;
  onMount?: boolean;
  className?: string;
}

/**
 * Precision crosshair / square tick mark (`data-draw-tick`) that pops in after the rule draws.
 */
export const RegistrationTick: React.FC<RegistrationTickProps> = ({
  delay = 0.28,
  onMount = false,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      data-draw-tick=""
      initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
      animate={onMount ? { scale: 1, opacity: 1 } : undefined}
      whileInView={onMount ? undefined : { scale: 1, opacity: 1 }}
      viewport={onMount ? undefined : { once: true, amount: 'some' }}
      transition={{
        duration: 0.35,
        delay: prefersReducedMotion ? 0 : delay,
        ease: ARTCRAFT_EASE,
      }}
      className={`inline-block w-1.5 h-1.5 bg-[#FF721A] shrink-0 ${className}`}
    />
  );
};

interface SectionChoreoProps {
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Orchestrated section header (`data-choreo`) combining:
 * 1) Drawn horizontal rule (0ms)
 * 2) Eyebrow blur-slide + tick (120ms)
 * 3) Headline blur-to-sharp reveal (180ms)
 */
export const SectionChoreoHeader: React.FC<SectionChoreoProps> = ({
  eyebrow,
  children,
  className = '',
}) => {
  return (
    <div data-choreo="" className={`space-y-3 sm:space-y-4 ${className}`}>
      <DrawRule />
      <div className="pt-2 flex items-center justify-between gap-4">
        <DrawEyebrow
          delay={0.12}
          className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]"
        >
          {eyebrow}
        </DrawEyebrow>
        <RegistrationTick delay={0.32} />
      </div>
      <BlurSlideReveal delay={0.18}>{children}</BlurSlideReveal>
    </div>
  );
};

interface WordToken {
  text: string;
  italic?: boolean;
}

interface StaggeredHeadlineProps {
  tokens: WordToken[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Hero word-by-word optical blur + baseline snap intro modeled after getartcraft.com's wm-letter intro.
 */
export const StaggeredHeadline: React.FC<StaggeredHeadlineProps> = ({
  tokens,
  className = '',
  style,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <h1 className={className} style={style}>
      {tokens.map((token, idx) => (
        <React.Fragment key={`${token.text}-${idx}`}>
          <motion.span
            className={`inline-block ${
              token.italic
                ? 'font-serif italic font-medium text-[#C94B00] dark:text-[#FF721A]'
                : ''
            }`}
            style={{ willChange: 'transform, opacity, filter' }}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 24, filter: 'blur(8px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.72,
              delay: prefersReducedMotion ? 0 : 0.08 + idx * 0.065,
              ease: ARTCRAFT_EASE,
            }}
          >
            {token.text}
          </motion.span>
          {idx < tokens.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </h1>
  );
};
