import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

export const ARTCRAFT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const OSMO_EASE: [number, number, number, number] = [0.625, 0.05, 0, 1];
export const PARALLAX_SPRING = { stiffness: 150, damping: 26, mass: 0.45 };

/**
 * Generates a deterministic Fisher-Yates shuffled index order for `count` characters
 * so ReFactory-style staggered character flicker never jitters across React renders.
 */
function buildShuffledIndices(count: number, seed = 27): number[] {
  const arr = Array.from({ length: count }, (_, idx) => idx);
  let state = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface RfTextSegment {
  text: string;
  className?: string;
}

interface RfFlickerTextProps {
  segments: RfTextSegment[];
  mode?: 'heading' | 'para';
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  onMount?: boolean;
  ready?: boolean;
  mountDelayMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

const HAS_COMPLEX_SCRIPT_RE = /[\u0D00-\u0D7F]/;

/**
 * ReFactory-style staggered shuffled-character optical flicker / appear text reveal.
 * Preserves semantic screen-reader phrasing via aria-label while marking split spans aria-hidden.
 */
export const RfFlickerText: React.FC<RfFlickerTextProps> = ({
  segments,
  mode = 'heading',
  as = 'span',
  onMount = false,
  ready = true,
  mountDelayMs = 0,
  className = '',
  style,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(
    () => prefersReducedMotion || (onMount && ready && mountDelayMs === 0)
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealed(true);
      return;
    }

    if (!ready) {
      return;
    }

    if (onMount) {
      if (mountDelayMs === 0) {
        setRevealed(true);
        return;
      }
      const timer = window.setTimeout(() => {
        setRevealed(true);
      }, mountDelayMs);
      return () => window.clearTimeout(timer);
    }

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion, onMount, ready, mountDelayMs]);

  const fullText = useMemo(
    () => segments.map((s) => s.text).join(''),
    [segments]
  );

  const tokenized = useMemo(() => {
    const rawWords: { word: string; className?: string; leadingSpace: boolean; isComplex: boolean }[] = [];
    let totalUnits = 0;
    let pendingSpace = false;

    segments.forEach((seg) => {
      const parts = seg.text.split(/(\s+)/);
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          pendingSpace = true;
        } else {
          const isComplex = HAS_COMPLEX_SCRIPT_RE.test(part);
          rawWords.push({
            word: part,
            className: seg.className,
            leadingSpace: pendingSpace,
            isComplex,
          });
          totalUnits += isComplex ? 1 : part.length;
          pendingSpace = false;
        }
      });
    });

    const shuffled = buildShuffledIndices(totalUnits, fullText.length + 17);
    let cursor = 0;

    return rawWords.map((item) => {
      const units = item.isComplex
        ? [{ ch: item.word, order: shuffled[cursor++] ?? 0 }]
        : Array.from(item.word).map((ch) => ({
            ch,
            order: shuffled[cursor++] ?? 0,
          }));
      return { ...item, chars: units };
    });
  }, [segments, fullText.length]);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={containerRef}
      aria-label={fullText}
      data-rf-split={mode}
      style={style}
      className={`${revealed ? 'is-rf-revealed' : ''} ${className}`.trim()}
    >
      <span aria-hidden="true">
        {tokenized.map((wordObj, wIdx) => (
          <React.Fragment key={`${wordObj.word}-${wIdx}`}>
            {wordObj.leadingSpace ? ' ' : ''}
            <span className={`inline-block whitespace-nowrap ${wordObj.className ?? ''}`}>
              {wordObj.chars.map((charObj, cIdx) => (
                <span
                  key={cIdx}
                  className="rf-char inline-block"
                  style={{ '--rf-i': charObj.order } as React.CSSProperties}
                >
                  {charObj.ch}
                </span>
              ))}
            </span>
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
};

interface RfButtonFlickerTextProps {
  text: string;
  className?: string;
}

/**
 * ReFactory-style hover character flicker text (`[data-button-flicker-text]`).
 * Place inside an element with class `rf-btn-flicker`.
 */
export const RfButtonFlickerText: React.FC<RfButtonFlickerTextProps> = ({
  text,
  className = '',
}) => {
  const isComplex = HAS_COMPLEX_SCRIPT_RE.test(text);

  const tokens = useMemo(() => {
    if (isComplex) {
      const parts = text.split(/(\s+)/).filter(Boolean);
      const wordCount = parts.filter((p) => !/^\s+$/.test(p)).length;
      const shuffled = buildShuffledIndices(wordCount, text.length + 7);
      let cursor = 0;
      return parts.map((part) =>
        /^\s+$/.test(part)
          ? { ch: part, order: 0, isSpace: true }
          : { ch: part, order: shuffled[cursor++] ?? 0, isSpace: false }
      );
    }

    const nonSpaceCount = text.replace(/\s/g, '').length;
    const shuffled = buildShuffledIndices(nonSpaceCount, text.length + 7);
    let cursor = 0;
    return Array.from(text).map((ch) =>
      /\s/.test(ch)
        ? { ch, order: 0, isSpace: true }
        : { ch, order: shuffled[cursor++] ?? 0, isSpace: false }
    );
  }, [text, isComplex]);

  return (
    <span aria-label={text} className={`inline-flex items-baseline ${className}`}>
      <span aria-hidden="true" className="inline-flex">
        {tokens.map((item, idx) =>
          item.isSpace ? (
            <span key={idx}>&nbsp;</span>
          ) : (
            <span
              key={idx}
              className="rf-hover-char inline-block"
              style={{ '--rf-i': item.order } as React.CSSProperties}
            >
              {item.ch}
            </span>
          )
        )}
      </span>
    </span>
  );
};

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
 * 3) Headline reveal (180ms)
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

interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  axis?: 'y' | 'x';
  scaleRange?: [number, number];
  layout?: boolean | 'position' | 'size';
}

/**
 * Spring-smoothed scroll parallax wrapper using GPU-only transforms.
 */
export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  className = '',
  speed = 20,
  axis = 'y',
  scaleRange,
  layout = false,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const delta = useTransform(smoothProgress, [0, 1], [speed, -speed]);
  const scale = useTransform(
    smoothProgress,
    [0, 1],
    scaleRange ?? [1, 1]
  );

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={containerRef}
      layout={layout}
      transition={
        layout
          ? { layout: { duration: 0.45, ease: ARTCRAFT_EASE } }
          : undefined
      }
      className={className}
    >
      <motion.div
        style={{
          y: axis === 'y' ? delta : 0,
          x: axis === 'x' ? delta : 0,
          scale: scaleRange ? scale : undefined,
          willChange: 'transform',
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

interface ParallaxMediaApertureProps {
  children: React.ReactNode;
  className?: string;
  shiftPercent?: number;
  overscanScale?: number;
}

/**
 * Scrubs media smoothly inside an overflow-hidden aperture as the frame traverses the viewport.
 */
export const ParallaxMediaAperture: React.FC<ParallaxMediaApertureProps> = ({
  children,
  className = '',
  shiftPercent = 7,
  overscanScale = 1.14,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const apertureRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: apertureRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const mediaY = useTransform(
    smoothProgress,
    [0, 1],
    [`-${shiftPercent}%`, `${shiftPercent}%`]
  );

  return (
    <div ref={apertureRef} className={`w-full h-full ${className}`}>
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                y: mediaY,
                scale: overscanScale,
                willChange: 'transform',
              }
        }
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};
