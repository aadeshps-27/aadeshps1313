import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { BRAND_LOGO_URL } from '../data/portfolio';

interface NavbarLogoParticlesProps {
  brandRevealed: boolean;
  hoverPulseKey: number;
  theme: 'light' | 'dark';
}

interface LogoSamplePoint {
  nx: number; // normalized [0..1] inside logo box
  ny: number; // normalized [0..1] inside logo box
  isAccent: boolean;
}

interface FlockParticle {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  ctrlX: number;
  ctrlY: number;
  delay: number;
  duration: number;
  size: number;
  phase: number;
  isAccent: boolean;
}

// Canvas padding around the logo box so swarming particles can arc outside the letter bounds
const PAD_X = 18;
const PAD_Y = 14;

function osmoEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(1 - t, 3.4);
}

/**
 * Extracts crisp glyph target coordinates directly from the same-origin brand logo image.
 * Falls back cleanly to geometric wordmark coordinates if image pixels aren't ready yet.
 */
function sampleLogoPoints(img: HTMLImageElement): LogoSamplePoint[] {
  const sw = 128;
  const sh = 32;
  const off = document.createElement('canvas');
  off.width = sw;
  off.height = sh;
  const octx = off.getContext('2d');
  if (!octx) return [];

  try {
    octx.drawImage(img, 0, 0, sw, sh);
    const data = octx.getImageData(0, 0, sw, sh).data;
    const points: LogoSamplePoint[] = [];

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 80) continue;

        // Brand logo is black letters + #FF721A dot on white ground
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const isOrange = r > 170 && r - b > 70;
        const isInk = luminance < 155;

        if (isOrange || isInk) {
          points.push({
            nx: (x + 0.5) / sw,
            ny: (y + 0.5) / sh,
            isAccent: isOrange,
          });
        }
      }
    }
    return points;
  } catch {
    return [];
  }
}

function buildFallbackPoints(): LogoSamplePoint[] {
  const pts: LogoSamplePoint[] = [];
  // Distribute crisp sample points across AADESH (x: 0.16..0.76) + dot (x: 0.81, y: 0.50)
  for (let i = 0; i < 120; i++) {
    const t = i / 119;
    pts.push({
      nx: 0.16 + t * 0.6,
      ny: 0.34 + ((i * 37) % 10) * 0.035,
      isAccent: false,
    });
  }
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    pts.push({
      nx: 0.813 + Math.cos(ang) * 0.018,
      ny: 0.5 + Math.sin(ang) * 0.07,
      isAccent: true,
    });
  }
  return pts;
}

export const NavbarLogoParticles: React.FC<NavbarLogoParticlesProps> = ({
  brandRevealed,
  hoverPulseKey,
  theme,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<LogoSamplePoint[] | null>(null);
  const particlesRef = useRef<FlockParticle[]>([]);
  const animStartRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const themeRef = useRef(theme);
  const hasPlayedRevealRef = useRef(false);
  const lastHoverKeyRef = useRef(hoverPulseKey);

  themeRef.current = theme;

  useEffect(() => {
    if (prefersReducedMotion) return;

    let cancelled = false;
    const img = new Image();
    img.src = BRAND_LOGO_URL;

    const handleLoad = () => {
      if (cancelled) return;
      const sampled = sampleLogoPoints(img);
      pointsRef.current = sampled.length > 0 ? sampled : buildFallbackPoints();
    };

    if (img.complete && img.naturalWidth > 0) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad, { once: true });
      img.addEventListener(
        'error',
        () => {
          if (!cancelled) pointsRef.current = buildFallbackPoints();
        },
        { once: true }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [prefersReducedMotion]);

  const spawnBurst = (mode: 'reveal' | 'hover') => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const logoW = Math.max(120, rect.width);
    const logoH = Math.max(28, rect.height);
    const cw = logoW + PAD_X * 2;
    const ch = logoH + PAD_Y * 2;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourcePoints =
      pointsRef.current && pointsRef.current.length > 0
        ? pointsRef.current
        : buildFallbackPoints();

    const maxParticles = mode === 'reveal' ? 190 : 75;
    const step = Math.max(1, Math.floor(sourcePoints.length / maxParticles));

    const nextParticles: FlockParticle[] = [];
    for (let i = 0; i < sourcePoints.length; i += step) {
      const p = sourcePoints[i];
      const tx = PAD_X + p.nx * logoW;
      const ty = PAD_Y + p.ny * logoH;

      if (mode === 'reveal') {
        // Skhiladze flock coalesce: particles stream in from slightly lower-right/left arc
        const spreadX = (Math.random() - 0.35) * 42 + p.nx * 14;
        const spreadY = (Math.random() - 0.15) * 26 + 8;
        const sx = tx + spreadX;
        const sy = ty + spreadY;
        nextParticles.push({
          tx,
          ty,
          sx,
          sy,
          ctrlX: (sx + tx) / 2 + (Math.random() - 0.5) * 20,
          ctrlY: Math.min(sy, ty) - 8 - Math.random() * 14,
          delay: p.nx * 0.24 + Math.random() * 0.08,
          duration: 0.48 + Math.random() * 0.24,
          size: p.isAccent ? 2.1 : 1.35 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          isAccent: p.isAccent || Math.random() < 0.22,
        });
      } else {
        // Hover pulse: micro-particles shimmer outward slightly then snap right back
        const ang = Math.random() * Math.PI * 2;
        const dist = 8 + Math.random() * 14;
        nextParticles.push({
          tx,
          ty,
          sx: tx + Math.cos(ang) * dist,
          sy: ty + Math.sin(ang) * dist,
          ctrlX: tx + Math.cos(ang + 0.9) * (dist * 0.7),
          ctrlY: ty + Math.sin(ang + 0.9) * (dist * 0.7),
          delay: Math.random() * 0.1,
          duration: 0.42 + Math.random() * 0.2,
          size: p.isAccent ? 2.0 : 1.25 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          isAccent: p.isAccent || Math.random() < 0.35,
        });
      }
    }

    particlesRef.current = nextParticles;
    animStartRef.current = performance.now();

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const renderFrame = (now: number) => {
      const elapsedSec = (now - animStartRef.current) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      const inkColor = themeRef.current === 'dark' ? '255, 255, 255' : '10, 10, 10';
      let anyAlive = false;

      for (let i = 0; i < particlesRef.current.length; i++) {
        const pt = particlesRef.current[i];
        const localT = (elapsedSec - pt.delay) / pt.duration;
        if (localT < 0) {
          anyAlive = true;
          continue;
        }
        if (localT >= 1) continue;

        anyAlive = true;
        const u = osmoEase(localT);
        const inv = 1 - u;

        // Quadratic Bezier arc interpolation + gentle harmonic wing flutter
        const flutter = Math.sin(localT * Math.PI * 2.5 + pt.phase) * (1 - u) * 2.2;
        const px =
          inv * inv * pt.sx + 2 * inv * u * pt.ctrlX + u * u * pt.tx + flutter;
        const py =
          inv * inv * pt.sy + 2 * inv * u * pt.ctrlY + u * u * pt.ty;

        // Crisp fade in then lock-out right on arrival
        const alpha =
          localT < 0.15
            ? (localT / 0.15) * 0.92
            : Math.max(0, (1 - Math.pow(u, 2.2)) * 0.92);

        const radius = pt.size * (1 - u * 0.25);
        ctx.fillStyle = pt.isAccent
          ? `rgba(255, 114, 26, ${alpha.toFixed(3)})`
          : `rgba(${inkColor}, ${alpha.toFixed(3)})`;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (anyAlive) {
        rafRef.current = window.requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, cw, ch);
        rafRef.current = null;
      }
    };

    rafRef.current = window.requestAnimationFrame(renderFrame);
  };

  // Trigger flock coalesce burst when navbar brand reveals
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (brandRevealed && !hasPlayedRevealRef.current) {
      hasPlayedRevealRef.current = true;
      spawnBurst('reveal');
    }
  }, [brandRevealed, prefersReducedMotion]);

  // Trigger subtle micro-flock shimmer when user hovers/taps navbar logo
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (hoverPulseKey !== lastHoverKeyRef.current) {
      lastHoverKeyRef.current = hoverPulseKey;
      if (hoverPulseKey > 0 && hasPlayedRevealRef.current) {
        spawnBurst('hover');
      }
    }
  }, [hoverPulseKey, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ left: -PAD_X, top: -PAD_Y }}
      className="pointer-events-none absolute z-20"
    />
  );
};
