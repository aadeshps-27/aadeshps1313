import React, { useEffect, useRef } from 'react';
import type { RobotMood, RobotSection } from './Robot3DCanvas';

export interface RobotDataStreamCanvasProps {
  mood: RobotMood;
  activeSection: RobotSection;
  lookRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollVelocityRef: React.MutableRefObject<number>;
  isHovered: boolean;
  isDragging: boolean;
  isFastPointer: boolean;
  isNearPointer: boolean;
  radarActive: boolean;
  danceActive: boolean;
  prefersReducedMotion: boolean;
}

interface DataParticle {
  lane: number;
  angle: number;
  speed: number;
  radiusJitter: number;
  length: number;
  size: number;
  phase: number;
  kind: 0 | 1 | 2; // 0 = packet streak, 1 = telemetry node, 2 = micro tick
  isAccent: boolean;
}

const CANVAS_SIZE = 148;
const PARTICLE_COUNT = 26;

// Three inclined elliptical orbital planes framing the 3D robot silhouette
const ORBIT_LANES = [
  { rx: 50, ry: 20, tilt: -0.34, yOffset: -2, dir: 1 },
  { rx: 58, ry: 23, tilt: 0.42, yOffset: 4, dir: -1 },
  { rx: 43, ry: 30, tilt: 0.08, yOffset: -5, dir: 1 },
] as const;

export const RobotDataStreamCanvas: React.FC<RobotDataStreamCanvasProps> = ({
  mood,
  activeSection,
  lookRef,
  scrollVelocityRef,
  isHovered,
  isDragging,
  isFastPointer,
  isNearPointer,
  radarActive,
  danceActive,
  prefersReducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const liveStateRef = useRef({
    mood,
    activeSection,
    isHovered,
    isDragging,
    isFastPointer,
    isNearPointer,
    radarActive,
    danceActive,
    prefersReducedMotion,
  });

  liveStateRef.current = {
    mood,
    activeSection,
    isHovered,
    isDragging,
    isFastPointer,
    isNearPointer,
    radarActive,
    danceActive,
    prefersReducedMotion,
  };

  const redrawStaticRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    redrawStaticRef.current?.();
  }, [mood, activeSection, isHovered, prefersReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;

    // Pre-allocate fixed particle pool (zero allocations during animation loop)
    const particles: DataParticle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const lane = i % ORBIT_LANES.length;
      const isAccent = i % 3 !== 2;
      const kind = (i % 5 === 0 ? 1 : i % 4 === 0 ? 2 : 0) as 0 | 1 | 2;
      particles.push({
        lane,
        angle: (i / PARTICLE_COUNT) * Math.PI * 2 + lane * 0.85,
        speed: 0.55 + ((i * 7) % 11) * 0.065,
        radiusJitter: (((i * 13) % 9) - 4) * 1.15,
        length: 0.14 + ((i * 5) % 7) * 0.032,
        size: kind === 1 ? 2.1 : kind === 2 ? 1.5 : 1.35,
        phase: i * 1.37,
        kind,
        isAccent,
      });
    }

    let isDarkTheme = document.documentElement.classList.contains('dark');
    const themeObserver = new MutationObserver(() => {
      isDarkTheme = document.documentElement.classList.contains('dark');
      redrawStaticRef.current?.();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    let smoothLookX = 0;
    let smoothLookY = 0;
    let prevLookX = lookRef.current.x;
    let prevLookY = lookRef.current.y;
    let pointerImpulse = 0;
    let smoothScroll = 0;
    let elapsed = 0;
    let lastTime = performance.now();
    let rafId = 0;
    let disposed = false;

    const drawFrame = (dt: number) => {
      const s = liveStateRef.current;
      elapsed += dt;

      // Smooth cursor vector + detect instantaneous cursor motion energy
      const targetLX = s.prefersReducedMotion || s.mood === 'sleep' ? 0 : lookRef.current.x;
      const targetLY = s.prefersReducedMotion || s.mood === 'sleep' ? 0 : lookRef.current.y;
      const lookDelta = Math.hypot(targetLX - prevLookX, targetLY - prevLookY);
      prevLookX = targetLX;
      prevLookY = targetLY;

      const dampFactor = s.prefersReducedMotion ? 1 : 1 - Math.exp(-8.5 * dt);
      smoothLookX += (targetLX - smoothLookX) * dampFactor;
      smoothLookY += (targetLY - smoothLookY) * dampFactor;

      const rawImpulse = Math.min(1.6, lookDelta * 14);
      pointerImpulse = s.prefersReducedMotion
        ? 0
        : Math.max(pointerImpulse * Math.exp(-3.4 * dt), rawImpulse);

      const rawScroll = s.prefersReducedMotion ? 0 : scrollVelocityRef.current;
      smoothScroll += (rawScroll - smoothScroll) * dampFactor;
      const absScroll = Math.abs(smoothScroll);

      // Speed & luminosity modulation from interaction state and active section
      const sectionBoost = s.activeSection === 'work' ? 1.25 : s.activeSection === 'contact' ? 1.1 : 1.0;
      const stateBoost =
        s.mood === 'overdrive'
          ? 2.8
          : s.radarActive || s.danceActive
            ? 2.0
            : s.isDragging || s.isFastPointer
              ? 1.85
              : s.isHovered || s.isNearPointer
                ? 1.45
                : s.mood === 'sleep'
                  ? 0.32
                  : 1.0;

      const streamSpeed = sectionBoost * stateBoost + pointerImpulse * 1.45 + absScroll * 1.75;
      const alphaScale =
        s.mood === 'sleep'
          ? 0.42
          : s.mood === 'overdrive'
            ? 1.35
            : s.isHovered || s.isNearPointer || pointerImpulse > 0.15
              ? 1.18
              : 1.0;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const cx = CANVAS_SIZE * 0.5 + smoothLookX * 5.5;
      const cy = CANVAS_SIZE * 0.52 + smoothLookY * 4.5 + smoothScroll * 3.5;

      const neutralRgb = isDarkTheme ? '229, 231, 235' : '24, 25, 32';
      const guideAlpha = (isDarkTheme ? 0.085 : 0.07) * alphaScale;

      // Draw whisper-subtle tilted orbital guide hairlines for data-stream continuity
      ctx.lineWidth = 0.75;
      for (let l = 0; l < ORBIT_LANES.length; l++) {
        const lane = ORBIT_LANES[l];
        const laneTilt = lane.tilt + smoothLookX * 0.16 * (l === 1 ? -1 : 1);
        const laneRy = Math.max(10, lane.ry + smoothLookY * (l === 2 ? -6 : 5));

        ctx.save();
        ctx.translate(cx, cy + lane.yOffset);
        ctx.rotate(laneTilt);
        ctx.setLineDash(l === 1 ? [2, 6] : [3, 8]);
        ctx.lineDashOffset = -elapsed * (10 * lane.dir * sectionBoost);
        ctx.strokeStyle =
          l === 0
            ? `rgba(253, 103, 1, ${Math.min(0.24, guideAlpha * 1.35).toFixed(3)})`
            : `rgba(${neutralRgb}, ${Math.min(0.18, guideAlpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, lane.rx, laneRy, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.setLineDash([]);

      // Update & draw orbital data-stream packets
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const lane = ORBIT_LANES[p.lane];

        if (!s.prefersReducedMotion) {
          p.angle += dt * p.speed * streamSpeed * lane.dir;
        }

        const laneTilt = lane.tilt + smoothLookX * 0.16 * (p.lane === 1 ? -1 : 1);
        const cosTilt = Math.cos(laneTilt);
        const sinTilt = Math.sin(laneTilt);
        const laneRx = lane.rx + p.radiusJitter + pointerImpulse * 2.5;
        const laneRy = Math.max(10, lane.ry + p.radiusJitter * 0.4 + smoothLookY * (p.lane === 2 ? -6 : 5));
        const laneCy = cy + lane.yOffset;

        // Current head position in inclined orbital coordinates
        const lx = Math.cos(p.angle) * laneRx;
        const ly = Math.sin(p.angle) * laneRy;
        const px = cx + lx * cosTilt - ly * sinTilt;
        const py = laneCy + lx * sinTilt + ly * cosTilt;

        // Depth factor [-1, 1] along orbit gives natural front/back luminosity falloff
        const depth = Math.sin(p.angle);
        const depthAlpha = 0.32 + (depth + 1) * 0.34;
        const pulse = 0.78 + 0.22 * Math.sin(elapsed * 3.4 + p.phase);
        const baseAlpha = Math.min(0.92, depthAlpha * pulse * alphaScale);
        const rgb = p.isAccent ? '253, 103, 1' : neutralRgb;

        if (p.kind === 0) {
          // Flowing data-packet arc streak + bright leading head
          const arcSpan = p.length * (1 + Math.min(0.95, pointerImpulse * 0.55 + absScroll * 0.45));
          const tailAngle = p.angle - lane.dir * arcSpan;
          const midAngle = p.angle - lane.dir * (arcSpan * 0.5);

          const tlx = Math.cos(tailAngle) * laneRx;
          const tly = Math.sin(tailAngle) * laneRy;
          const tx = cx + tlx * cosTilt - tly * sinTilt;
          const ty = laneCy + tlx * sinTilt + tly * cosTilt;

          const mlx = Math.cos(midAngle) * laneRx;
          const mly = Math.sin(midAngle) * laneRy;
          const mx = cx + mlx * cosTilt - mly * sinTilt;
          const my = laneCy + mlx * sinTilt + mly * cosTilt;

          ctx.strokeStyle = `rgba(${rgb}, ${(baseAlpha * 0.46).toFixed(3)})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(mx, my, px, py);
          ctx.stroke();

          ctx.fillStyle = `rgba(${rgb}, ${Math.min(0.95, baseAlpha * 0.95).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 0.95, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 1) {
          // Crisp telemetry square node with subtle core highlight
          const r = p.size * (0.85 + (depth + 1) * 0.2);
          ctx.fillStyle = `rgba(${rgb}, ${baseAlpha.toFixed(3)})`;
          ctx.fillRect(px - r, py - r, r * 2, r * 2);
          if (p.isAccent && depth > 0) {
            ctx.fillStyle = `rgba(255, 224, 194, ${(baseAlpha * 0.72).toFixed(3)})`;
            ctx.fillRect(px - 0.65, py - 0.65, 1.3, 1.3);
          }
        } else {
          // Tangential micro-tick aligned along instantaneous orbital velocity
          const vx = -Math.sin(p.angle) * laneRx;
          const vy = Math.cos(p.angle) * laneRy;
          const rotVx = vx * cosTilt - vy * sinTilt;
          const rotVy = vx * sinTilt + vy * cosTilt;
          const vLen = Math.hypot(rotVx, rotVy) || 1;
          const ux = (rotVx / vLen) * (3.2 + pointerImpulse * 2.2);
          const uy = (rotVy / vLen) * (3.2 + pointerImpulse * 2.2);

          ctx.strokeStyle = `rgba(${rgb}, ${(baseAlpha * 0.8).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px - ux * 0.5, py - uy * 0.5);
          ctx.lineTo(px + ux * 0.5, py + uy * 0.5);
          ctx.stroke();
        }
      }
    };

    redrawStaticRef.current = () => {
      if (liveStateRef.current.prefersReducedMotion && !disposed) {
        drawFrame(0);
      }
    };

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (liveStateRef.current.prefersReducedMotion) {
        drawFrame(0);
        return;
      }

      if (!document.hidden) {
        drawFrame(dt);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    if (liveStateRef.current.prefersReducedMotion) {
      drawFrame(0);
    } else {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      redrawStaticRef.current = null;
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibility);
      themeObserver.disconnect();
    };
  }, [lookRef, scrollVelocityRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[52px] -translate-x-1/2 -translate-y-1/2 w-[148px] h-[148px] select-none"
    />
  );
};
