import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface DevAnimationHudProps {
  theme: 'light' | 'dark';
}

interface HudMetrics {
  scrollY: number;
  scrollPct: number;
  activeSection: string;
  mouseX: number;
  mouseY: number;
  pageY: number;
  viewportW: number;
  viewportH: number;
}

const SECTION_IDS = ['top', 'works', 'experience', 'contact'] as const;

function readScrollMetrics(): Pick<
  HudMetrics,
  'scrollY' | 'scrollPct' | 'activeSection' | 'viewportW' | 'viewportH'
> {
  if (typeof window === 'undefined') {
    return {
      scrollY: 0,
      scrollPct: 0,
      activeSection: '#top',
      viewportW: 0,
      viewportH: 0,
    };
  }

  const scrollY = Math.round(window.scrollY);
  const maxScroll = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight
  );
  const scrollPct = Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100)));
  const probeY = window.innerHeight * 0.35;

  let activeSection = '#top';
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= probeY) {
      activeSection = `#${id}`;
    }
  }

  return {
    scrollY,
    scrollPct,
    activeSection,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
  };
}

export const DevAnimationHud: React.FC<DevAnimationHudProps> = ({ theme }) => {
  const [open, setOpen] = useState(false);
  const mouseRef = React.useRef({ x: 0, y: 0 });
  const [metrics, setMetrics] = useState<HudMetrics>(() => ({
    ...readScrollMetrics(),
    mouseX: 0,
    mouseY: 0,
    pageY: 0,
  }));

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const isEditable =
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (
        !isEditable &&
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (event.key === 'Escape') {
        setOpen((prev) => (prev ? false : prev));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || !open) return;

    let rafId = 0;

    const flush = () => {
      rafId = 0;
      const scroll = readScrollMetrics();
      const { x, y } = mouseRef.current;
      setMetrics({
        ...scroll,
        mouseX: Math.round(x),
        mouseY: Math.round(y),
        pageY: Math.round(y + window.scrollY),
      });
    };

    const scheduleFlush = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
      scheduleFlush();
    };

    flush();
    window.addEventListener('scroll', scheduleFlush, { passive: true });
    window.addEventListener('resize', scheduleFlush, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleFlush);
      window.removeEventListener('resize', scheduleFlush);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [open]);

  if (!import.meta.env.DEV || !open) return null;

  return (
    <aside
      role="region"
      aria-label="Developer animation inspector"
      className="fixed bottom-4 left-4 z-[80] w-60 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md text-[#0A0A0A] dark:text-white shadow-xl font-mono text-[11px] leading-relaxed select-none"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E5E5] dark:border-[#262626]">
        <span className="inline-flex items-center gap-1.5 font-bold tracking-[0.06em] uppercase text-[10px]">
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 bg-[#FF721A] shrink-0"
          />
          <span>Motion HUD · Ctrl+D</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close developer panel"
          className="p-0.5 rounded text-[#525252] dark:text-[#A3A3A3] hover:text-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-[#FF721A]"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>

      <dl className="px-3 py-2.5 space-y-1.5 tabular-nums">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-[#525252] dark:text-[#A3A3A3]">Scroll</dt>
          <dd className="font-semibold">
            {metrics.scrollY}px ({metrics.scrollPct}%)
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-[#525252] dark:text-[#A3A3A3]">Section</dt>
          <dd className="font-semibold text-[#C94B00] dark:text-[#FF721A]">
            {metrics.activeSection}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-[#525252] dark:text-[#A3A3A3]">Theme</dt>
          <dd className="font-semibold uppercase">{theme}</dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-[#525252] dark:text-[#A3A3A3]">Mouse</dt>
          <dd className="font-semibold">
            {metrics.mouseX}, {metrics.mouseY} (docY {metrics.pageY})
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-[#525252] dark:text-[#A3A3A3]">Viewport</dt>
          <dd className="font-semibold">
            {metrics.viewportW} × {metrics.viewportH}
          </dd>
        </div>
      </dl>
    </aside>
  );
};
