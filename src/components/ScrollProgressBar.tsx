import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react';
import { smoothScrollToY } from '../utils/smoothScroll';

interface ScrollProgressBarProps {
  isModalOpen?: boolean;
}

interface SectionAnchor {
  id: string;
  label: string;
  name: string;
}

interface SectionMarker {
  id: string;
  label: string;
  name: string;
  ratio: number;
}

const DESKTOP_EDGE_PAD = 20;
const MOBILE_EDGE_PAD = 16;
const DESKTOP_RAIL_WIDTH = 34;
const MOBILE_RAIL_WIDTH = 26;
const TOTAL_TICKS = 50; // Every 2% from 0% to 100%
const SCROLL_IDLE_DELAY_MS = 1100; // > 1 second after scrolling stops

const LABEL_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 26,
  mass: 0.6,
};

const SECTION_ANCHORS: SectionAnchor[] = [
  { id: 'about', label: '01', name: 'Origins & Ethos' },
  { id: 'work', label: '02', name: 'Selected Works' },
  { id: 'experience', label: '03', name: 'Journey' },
  { id: 'contact', label: '04', name: 'Connection' },
];

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({
  isModalOpen = false,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const [isDesktopRuler, setIsDesktopRuler] = useState(false);
  const [percent, setPercent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrollIdle, setIsScrollIdle] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionAnchor>(
    SECTION_ANCHORS[0]
  );
  const [ghostY, setGhostY] = useState<number | null>(null);
  const [ghostPercent, setGhostPercent] = useState<number | null>(null);
  const [sectionMarkers, setSectionMarkers] = useState<SectionMarker[]>([]);
  const [metrics, setMetrics] = useState({
    vh: 800,
    docH: 3000,
    scrollY: 0,
  });

  const railRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const dragMovedRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(
    typeof window !== 'undefined' ? window.scrollY : 0
  );

  const railWidth = isDesktopRuler ? DESKTOP_RAIL_WIDTH : MOBILE_RAIL_WIDTH;
  const edgePad = isDesktopRuler ? DESKTOP_EDGE_PAD : MOBILE_EDGE_PAD;

  // Enable expanded architectural ruler metrics on tablet/desktop viewports (>= 768px)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const syncMode = () => setIsDesktopRuler(mq.matches);
    syncMode();
    mq.addEventListener('change', syncMode);
    return () => mq.removeEventListener('change', syncMode);
  }, []);

  // Toggle html[data-ruler="on"] to hide native OS scrollbar while the architectural ruler bar is active
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!isModalOpen) {
      root.setAttribute('data-ruler', 'on');
    } else {
      root.removeAttribute('data-ruler');
    }
    return () => {
      root.removeAttribute('data-ruler');
    };
  }, [isModalOpen]);

  // Temporarily pause CSS scroll-snap during direct ruler scrubbing
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDragging) {
      root.setAttribute('data-snap', 'off');
    } else {
      root.removeAttribute('data-snap');
    }
    return () => {
      root.removeAttribute('data-snap');
    };
  }, [isDragging]);

  const measureGeometry = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vh = window.innerHeight || 800;
    const docH = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      vh + 1
    );
    const maxScroll = Math.max(1, docH - vh);
    const scrollY = window.scrollY;
    const ratio = Math.min(1, Math.max(0, scrollY / maxScroll));

    setMetrics({ vh, docH, scrollY });
    setPercent(Math.round(ratio * 100));

    const markers: SectionMarker[] = [];
    const triggerLine = vh * 0.42;
    let currentSection: SectionAnchor = SECTION_ANCHORS[0];

    for (const anchor of SECTION_ANCHORS) {
      const el = document.getElementById(anchor.id);
      if (el) {
        const rectTop = el.getBoundingClientRect().top;
        const absTop = rectTop + scrollY;
        const clamped = Math.min(1, Math.max(0, absTop / maxScroll));
        markers.push({
          id: anchor.id,
          label: anchor.label,
          name: anchor.name,
          ratio: clamped,
        });
        if (rectTop <= triggerLine) {
          currentSection = anchor;
        }
      }
    }

    if (scrollY + vh >= docH - 48 && markers.length > 0) {
      const last = markers[markers.length - 1];
      currentSection = { id: last.id, label: last.label, name: last.name };
    }

    setSectionMarkers(markers);
    setActiveSection((prev) =>
      prev.id === currentSection.id ? prev : currentSection
    );
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setIsScrollIdle(false);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const scheduleIdleReveal = () => {
      setIsScrollIdle(false);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        setIsScrollIdle(true);
        idleTimerRef.current = null;
      }, SCROLL_IDLE_DELAY_MS);
    };

    const scheduleMeasure = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        measureGeometry();
      });
    };

    const handleWindowScroll = () => {
      scheduleMeasure();
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastScrollYRef.current) > 0.5) {
        lastScrollYRef.current = currentY;
        scheduleIdleReveal();
      }
    };

    measureGeometry();
    // Re-measure shortly after load/layout shifts
    const settleTimer = window.setTimeout(measureGeometry, 350);

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleMeasure)
        : null;
    if (resizeObserver && document.body) {
      resizeObserver.observe(document.body);
    }

    return () => {
      window.clearTimeout(settleTimer);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('resize', scheduleMeasure);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      resizeObserver?.disconnect();
    };
  }, [isModalOpen, measureGeometry]);

  const getClampedRatio = useCallback(
    (clientY: number) => {
      const span = Math.max(1, metrics.vh - edgePad * 2);
      const clampedY = Math.min(edgePad + span, Math.max(edgePad, clientY));
      const ratio = (clampedY - edgePad) / span;
      return { ratio, clampedY, span };
    },
    [edgePad, metrics.vh]
  );

  const scrollToRatio = useCallback(
    (ratio: number, instant: boolean) => {
      const maxScroll = Math.max(1, metrics.docH - metrics.vh);
      const targetTop = ratio * maxScroll;
      smoothScrollToY(targetTop, {
        immediate: instant || Boolean(prefersReducedMotion),
      });
    },
    [metrics.docH, metrics.vh, prefersReducedMotion]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    dragStartYRef.current = e.clientY;
    dragMovedRef.current = 0;
    setIsDragging(true);
    if (e.pointerType === 'touch') {
      setIsHovered(true);
    }
    setIsScrollIdle(false);
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    e.currentTarget.setPointerCapture(e.pointerId);

    const { ratio, clampedY } = getClampedRatio(e.clientY);
    setGhostY(clampedY);
    setGhostPercent(Math.round(ratio * 100));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { ratio, clampedY } = getClampedRatio(e.clientY);
    setGhostY(clampedY);
    setGhostPercent(Math.round(ratio * 100));

    if (isDragging) {
      dragMovedRef.current = Math.max(
        dragMovedRef.current,
        Math.abs(e.clientY - dragStartYRef.current)
      );
      if (dragMovedRef.current > 3) {
        scrollToRatio(ratio, true);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      const { ratio } = getClampedRatio(e.clientY);
      if (dragMovedRef.current <= 3) {
        scrollToRatio(ratio, false);
      }
      setIsDragging(false);
    }

    const rect = railRef.current?.getBoundingClientRect();
    const inside =
      rect &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!inside || e.pointerType === 'touch') {
      setIsHovered(false);
      setGhostY(null);
      setGhostPercent(null);
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setIsHovered(false);
    setGhostY(null);
    setGhostPercent(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.08;
    const currentRatio =
      metrics.scrollY / Math.max(1, metrics.docH - metrics.vh);
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      scrollToRatio(Math.min(1, currentRatio + step), false);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      scrollToRatio(Math.max(0, currentRatio - step), false);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToRatio(0, false);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToRatio(1, false);
    }
  };

  if (isModalOpen) {
    return null;
  }

  const span = Math.max(1, metrics.vh - edgePad * 2);
  const maxScroll = Math.max(1, metrics.docH - metrics.vh);
  const progressRatio = Math.min(1, Math.max(0, metrics.scrollY / maxScroll));
  const needleY = edgePad + progressRatio * span;

  // Viewport window thumb indicator
  const thumbTop = edgePad + (metrics.scrollY / Math.max(1, metrics.docH)) * span;
  const thumbHeight = Math.max(
    18,
    (metrics.vh / Math.max(1, metrics.docH)) * span
  );

  const activeZoom = isHovered || isDragging;
  const nearBottom = progressRatio > 0.9;
  const showFloatingLabel = isScrollIdle && !isDragging;
  const minLabelTop = isDesktopRuler ? 76 : 68;
  const maxLabelTop = Math.max(
    minLabelTop,
    metrics.vh - (isDesktopRuler ? 120 : 136)
  );
  const labelTop = Math.min(Math.max(minLabelTop, needleY - 16), maxLabelTop);

  // Format 3-column odometer digits ("000" -> "100", or padded two/three digit display)
  const padded = String(percent).padStart(3, '0');
  const digitCols = [Number(padded[0]), Number(padded[1]), Number(padded[2])];

  return (
    <>
      {/* Architectural Vertical Scroll Ruler Bar (Mobile + Desktop) */}
      <div
        ref={railRef}
        role="scrollbar"
        tabIndex={0}
        aria-controls="main"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Page scroll ruler"
        onPointerEnter={(e) => {
          if (e.pointerType !== 'touch') setIsHovered(true);
        }}
        onPointerLeave={() => {
          if (!isDragging) {
            setIsHovered(false);
            setGhostY(null);
            setGhostPercent(null);
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        style={{ width: railWidth }}
        className="fixed inset-y-0 right-0 z-[45] cursor-crosshair select-none touch-none overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF721A]"
      >
        {/* Frosted right-edge veil */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none transition-opacity duration-200 bg-white/60 dark:bg-black/60"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to left, black 38%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to left, black 38%, transparent 100%)',
            opacity: activeZoom ? 0.96 : 0.72,
          }}
        />

        {/* Subtle right hairline spine */}
        <div
          aria-hidden="true"
          className="absolute right-0 pointer-events-none bg-[#E5E5E5] dark:bg-[#262626]"
          style={{ top: edgePad, bottom: edgePad, width: 1 }}
        />

        {/* Viewport span band (illuminates on hover / drag) */}
        <div
          aria-hidden="true"
          className="absolute right-0 pointer-events-none transition-opacity duration-200 bg-[#0A0A0A]/[0.06] dark:bg-white/[0.08] border-r-2 border-[#FF721A]/70"
          style={{
            top: 0,
            width: activeZoom ? railWidth - 4 : isDesktopRuler ? 6 : 4,
            height: thumbHeight,
            transform: `translate3d(0, ${thumbTop}px, 0)`,
            opacity: activeZoom ? 1 : 0.45,
            transitionProperty: 'opacity, width',
          }}
        />

        {/* Precision Architectural Ruler Ticks (minor 2%, mid 10%, major 20%) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
        >
          {Array.from({ length: TOTAL_TICKS + 1 }).map((_, idx) => {
            const tickRatio = idx / TOTAL_TICKS;
            const y = edgePad + tickRatio * span;
            const isMajor = idx % 10 === 0;
            const isMid = idx % 5 === 0 && !isMajor;
            const distFromNeedle = Math.abs(y - needleY);
            const nearNeedle = distFromNeedle < 28;

            const tickWidth = isMajor
              ? activeZoom
                ? isDesktopRuler
                  ? 13
                  : 10
                : isDesktopRuler
                  ? 9
                  : 7
              : nearNeedle
                ? isDesktopRuler
                  ? 7
                  : 6
                : isMid
                  ? isDesktopRuler
                    ? 6
                    : 5
                  : isDesktopRuler
                    ? 4
                    : 3;

            return (
              <span
                key={idx}
                className={`absolute right-0 block h-px transition-all duration-150 ${
                  nearNeedle
                    ? 'bg-[#FF721A]/85'
                    : isMajor
                      ? 'bg-[#0A0A0A]/40 dark:bg-white/40'
                      : isMid
                        ? 'bg-[#0A0A0A]/28 dark:bg-white/28'
                        : 'bg-[#0A0A0A]/16 dark:bg-white/16'
                }`}
                style={{
                  width: tickWidth,
                  transform: `translate3d(0, ${y}px, 0)`,
                }}
              />
            );
          })}

          {/* Section registration tick marks */}
          {sectionMarkers.map((marker) => {
            const y = edgePad + marker.ratio * span;
            const isCurrent = Math.abs(marker.ratio - progressRatio) < 0.06;
            return (
              <span
                key={marker.id}
                className="absolute right-0 flex items-center justify-end pointer-events-none transition-colors duration-200"
                style={{ transform: `translate3d(0, ${y - 5}px, 0)`, height: 10 }}
              >
                {activeZoom && isDesktopRuler && (
                  <span
                    className={`mr-3.5 font-mono text-[8px] tabular-nums leading-none ${
                      isCurrent
                        ? 'text-[#C94B00] dark:text-[#FF721A] font-bold'
                        : 'text-[#525252]/75 dark:text-[#A3A3A3]/75'
                    }`}
                  >
                    {marker.label}
                  </span>
                )}
                <span
                  className={`block h-[2px] ${
                    isCurrent
                      ? isDesktopRuler
                        ? 'w-3 bg-[#FF721A]'
                        : 'w-2.5 bg-[#FF721A]'
                      : isDesktopRuler
                        ? 'w-2.5 bg-[#0A0A0A]/55 dark:bg-white/55'
                        : 'w-2 bg-[#0A0A0A]/55 dark:bg-white/55'
                  }`}
                />
              </span>
            );
          })}
        </div>

        {/* Hover / Scrub Ghost Preview Hairline */}
        {ghostY !== null && activeZoom && !isDragging && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 pointer-events-none"
            style={{
              top: 0,
              transform: `translate3d(0, ${ghostY}px, 0)`,
            }}
          >
            <span className="block w-full h-px bg-[#0A0A0A]/35 dark:bg-white/35" />
            {ghostPercent !== null && Math.abs(ghostY - needleY) > 22 && (
              <span
                className={`absolute -top-3.5 font-mono text-[8px] tabular-nums text-[#525252] dark:text-[#A3A3A3] ${
                  isDesktopRuler ? 'right-1.5' : 'right-1'
                }`}
              >
                {ghostPercent}%
              </span>
            )}
          </div>
        )}

        {/* Active Scroll Hairline Needle + Rolling Odometer Percentage Readout */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            transform: `translate3d(0, ${needleY}px, 0)`,
            willChange: 'transform',
          }}
        >
          <span
            className="block w-full bg-[#FF721A]"
            style={{
              height: activeZoom ? 2 : 1.5,
              boxShadow: '0 0 8px rgba(255, 114, 26, 0.55)',
            }}
          />
          <span
            className={`absolute whitespace-nowrap font-mono tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A] inline-flex items-center ${
              isDesktopRuler ? 'right-1.5' : 'right-1'
            }`}
            style={{
              top: nearBottom ? -15 : 4,
              fontSize: isDesktopRuler ? 9 : 8,
              letterSpacing: isDesktopRuler ? '0.04em' : '0.01em',
            }}
          >
            <span className="ruler-digits">
              {digitCols.map((digit, colIdx) => {
                // Hide leading zeros except for units digit
                const isHiddenZero =
                  (colIdx === 0 && percent < 100) ||
                  (colIdx === 1 && percent < 10);
                if (isHiddenZero) return null;
                return (
                  <span
                    key={colIdx}
                    className="ruler-digit-col"
                    style={{
                      transform: prefersReducedMotion
                        ? `translateY(-${digit}em)`
                        : `translate3d(0, -${digit}em, 0)`,
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </span>
                );
              })}
            </span>
            <span className="ml-[1px]">%</span>
          </span>
        </div>
      </div>

      {/* Floating active section label shown after scrolling stops for > 1s */}
      <AnimatePresence>
        {showFloatingLabel && (
          <motion.div
            key="section-floating-label"
            aria-live="polite"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, x: 12, scale: 0.94 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 10, scale: 0.96 }
            }
            transition={prefersReducedMotion ? { duration: 0.12 } : LABEL_SPRING}
            style={{
              right: railWidth + 10,
              top: labelTop,
            }}
            className="fixed z-[45] pointer-events-none select-none"
          >
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white/92 dark:bg-[#0A0A0A]/92 backdrop-blur-md shadow-md">
              <span className="w-1.5 h-1.5 bg-[#FF721A] shrink-0" aria-hidden="true" />
              <span className="font-mono text-[10px] tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
                {activeSection.label}
              </span>
              <span className="h-3 w-px bg-[#E5E5E5] dark:bg-[#262626]" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-tight text-[#0A0A0A] dark:text-white whitespace-nowrap">
                {activeSection.name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
