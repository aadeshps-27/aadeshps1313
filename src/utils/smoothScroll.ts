/**
 * High-refresh-rate smooth scroll glide engine using exponential damping
 * and instant native scrollBehavior bypass so rapid keyboard arrow presses
 * accumulate fluidly without CSS scroll-snap or double-smoothing stutter.
 */

let activeRafId: number | null = null;
let targetY = 0;
let currentY = 0;
let lastFrameTime = 0;
let listenersBound = false;

function getMaxScroll(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  const vh = window.innerHeight || 800;
  const docH = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    vh
  );
  return Math.max(0, docH - vh);
}

function getStickyHeaderOffset(): number {
  if (typeof window === 'undefined') return 64;
  return window.innerWidth >= 640 ? 64 : 56;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stopActiveGlide() {
  if (activeRafId !== null) {
    window.cancelAnimationFrame(activeRafId);
    activeRafId = null;
  }
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-snap');
  }
}

function ensureInterruptListeners() {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;

  const cancelOnUserScroll = () => {
    if (activeRafId !== null) {
      stopActiveGlide();
    }
  };

  window.addEventListener('wheel', cancelOnUserScroll, { passive: true });
  window.addEventListener('touchstart', cancelOnUserScroll, { passive: true });
}

function tick(now: number) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  // Exponential critically-damped smoothing (fluid at 60Hz, 120Hz, 144Hz)
  const decay = 1 - Math.exp(-11.5 * dt);
  const diff = targetY - currentY;

  if (Math.abs(diff) <= 0.6) {
    window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
    stopActiveGlide();
    return;
  }

  currentY += diff * decay;
  window.scrollTo({ top: currentY, behavior: 'instant' as ScrollBehavior });
  activeRafId = window.requestAnimationFrame(tick);
}

export function smoothScrollToY(
  destinationY: number,
  options?: { immediate?: boolean }
) {
  if (typeof window === 'undefined') return;
  ensureInterruptListeners();

  const clamped = Math.max(0, Math.min(getMaxScroll(), destinationY));

  if (options?.immediate || prefersReducedMotion()) {
    stopActiveGlide();
    window.scrollTo({ top: clamped, behavior: 'auto' });
    return;
  }

  if (activeRafId === null) {
    currentY = window.scrollY;
    lastFrameTime = performance.now();
    document.documentElement.setAttribute('data-snap', 'off');
    targetY = clamped;
    activeRafId = window.requestAnimationFrame(tick);
  } else {
    targetY = clamped;
  }
}

export function smoothScrollBy(deltaY: number) {
  if (typeof window === 'undefined') return;
  const baseY = activeRafId !== null ? targetY : window.scrollY;
  smoothScrollToY(baseY + deltaY);
}

export function smoothScrollToSectionId(sectionId: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (sectionId === 'top') {
    smoothScrollToY(0);
    return;
  }
  const el = document.getElementById(sectionId);
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const offset = getStickyHeaderOffset();
  const destY = Math.max(0, rect.top + window.scrollY - offset);
  smoothScrollToY(destY);
}
