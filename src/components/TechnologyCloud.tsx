import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Atom,
  Bot,
  Braces,
  Compass,
  Cpu,
  Layers,
  PenTool,
  Radio,
  Server,
  Sparkles,
  Terminal,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import {
  AnimatePresence,
  MotionValue,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ARTCRAFT_EASE } from './MotionPrimitives';

type Polarity = 'attract' | 'repel';
type CloudFieldMode = 'mixed' | 'attract' | 'repel';

interface TechNodeBase {
  id: string;
  name: string;
  discipline: string;
  polarity: Polarity;
  icon: LucideIcon;
}

interface TechSphereNode extends TechNodeBase {
  x0: number;
  y0: number;
  z0: number;
}

const RAW_TECH_ITEMS: TechNodeBase[] = [
  {
    id: 'react',
    name: 'React',
    discipline: 'Interactive UI Architecture',
    polarity: 'attract',
    icon: Atom,
  },
  {
    id: 'esp32',
    name: 'ESP32',
    discipline: 'Embedded Microcontroller',
    polarity: 'repel',
    icon: Cpu,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    discipline: 'Type-Safe Engineering',
    polarity: 'attract',
    icon: Braces,
  },
  {
    id: 'lora',
    name: 'SX1278 LoRa',
    discipline: 'Sub-GHz RF Telemetry',
    polarity: 'repel',
    icon: Radio,
  },
  {
    id: 'illustrator',
    name: 'Illustrator',
    discipline: 'Bezier Vector Craft',
    polarity: 'attract',
    icon: PenTool,
  },
  {
    id: 'robotics',
    name: 'Robotics / UGV',
    discipline: 'Autonomous Actuation',
    polarity: 'repel',
    icon: Bot,
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    discipline: 'Server & API Workflows',
    polarity: 'attract',
    icon: Server,
  },
  {
    id: 'embedded-c',
    name: 'Embedded C',
    discipline: 'Deterministic Firmware',
    polarity: 'repel',
    icon: Terminal,
  },
  {
    id: 'affinity',
    name: 'Affinity Suite',
    discipline: 'Visual Brand Systems',
    polarity: 'attract',
    icon: Layers,
  },
  {
    id: 'kalman',
    name: 'Kalman DSP',
    discipline: 'Signal Path-Loss Smoothing',
    polarity: 'repel',
    icon: Waves,
  },
  {
    id: 'motion',
    name: 'Motion',
    discipline: 'Spring Kinetic Systems',
    polarity: 'attract',
    icon: Sparkles,
  },
  {
    id: 'sensors',
    name: 'IMU & Sensors',
    discipline: 'Spatial Orientation Fusion',
    polarity: 'repel',
    icon: Compass,
  },
];

// Evenly distribute nodes across a unit 3D sphere using a Fibonacci lattice
const TECH_SPHERE_NODES: TechSphereNode[] = RAW_TECH_ITEMS.map((item, idx) => {
  const n = RAW_TECH_ITEMS.length;
  const y0 = 1 - ((idx + 0.5) / n) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y0 * y0));
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) * idx;
  return {
    ...item,
    x0: Math.cos(goldenAngle) * radiusAtY,
    y0,
    z0: Math.sin(goldenAngle) * radiusAtY,
  };
});

const FIELD_MODES: { id: CloudFieldMode; label: string }[] = [
  { id: 'mixed', label: 'Mixed Field' },
  { id: 'attract', label: 'Attract' },
  { id: 'repel', label: 'Repel' },
];

const FORCE_RADIUS = 175;
const NODE_SPRING = { stiffness: 220, damping: 18, mass: 0.55 };
const SCALE_SPRING = { stiffness: 320, damping: 22, mass: 0.5 };
const CURSOR_RING_SPRING = { stiffness: 280, damping: 28, mass: 0.4 };
const MERIDIAN_OFFSETS = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

interface NodeMotionState {
  projX: MotionValue<number>;
  projY: MotionValue<number>;
  depthScale: MotionValue<number>;
  depthOpacity: MotionValue<number>;
  zIndexMV: MotionValue<number>;
  forceX: MotionValue<number>;
  forceY: MotionValue<number>;
  forceScale: MotionValue<number>;
}

interface GlobeNodeItemProps {
  node: TechSphereNode;
  motionState: NodeMotionState;
  mode: CloudFieldMode;
  isSelected: boolean;
  isInfluenced: boolean;
  onSelect: (id: string) => void;
  prefersReducedMotion: boolean;
}

const GlobeNodeItem: React.FC<GlobeNodeItemProps> = ({
  node,
  motionState,
  mode,
  isSelected,
  isInfluenced,
  onSelect,
  prefersReducedMotion,
}) => {
  const Icon = node.icon;
  const effectivePolarity: Polarity = mode === 'mixed' ? node.polarity : mode;
  const isAttractor = effectivePolarity === 'attract';

  const springForceX = useSpring(motionState.forceX, NODE_SPRING);
  const springForceY = useSpring(motionState.forceY, NODE_SPRING);
  const springForceScale = useSpring(motionState.forceScale, SCALE_SPRING);

  return (
    <motion.div
      style={{
        x: motionState.projX,
        y: motionState.projY,
        scale: motionState.depthScale,
        opacity: motionState.depthOpacity,
        zIndex: motionState.zIndexMV,
        willChange: 'transform, opacity',
      }}
      className="absolute top-1/2 left-1/2"
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : {
                  x: springForceX,
                  y: springForceY,
                  scale: springForceScale,
                  willChange: 'transform',
                }
          }
        >
          <motion.button
            type="button"
            onClick={() => onSelect(node.id)}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
            aria-pressed={isSelected}
            className={`group/node inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-medium transition-colors duration-150 shadow-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
              isSelected || isInfluenced
                ? isAttractor
                  ? 'border-[#FF721A] bg-white dark:bg-[#141414] text-[#0A0A0A] dark:text-white shadow-md'
                  : 'border-[#0A0A0A] dark:border-white bg-white dark:bg-[#141414] text-[#0A0A0A] dark:text-white shadow-md'
                : 'border-[#E5E5E5] dark:border-[#262626] bg-white/95 dark:bg-[#111111]/95 text-[#0A0A0A] dark:text-white hover:border-[#FF721A]'
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg shrink-0 transition-colors ${
                isAttractor
                  ? 'bg-[#FF721A]/12 text-[#C94B00] dark:text-[#FF721A]'
                  : 'bg-[#0A0A0A]/[0.06] dark:bg-white/[0.08] text-[#0A0A0A] dark:text-white'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">{node.name}</span>
            <span
              aria-hidden="true"
              title={isAttractor ? 'Attracts to cursor' : 'Repels from cursor'}
              className={`w-1.5 h-1.5 shrink-0 ${
                isAttractor
                  ? 'bg-[#FF721A]'
                  : 'border border-[#C94B00] dark:border-[#FF721A] bg-transparent'
              }`}
            />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const TechnologyCloud: React.FC = () => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [pointerFine, setPointerFine] = useState(false);
  const [fieldMode, setFieldMode] = useState<CloudFieldMode>('mixed');
  const [selectedId, setSelectedId] = useState<string>(TECH_SPHERE_NODES[0].id);
  const [isCursorInside, setIsCursorInside] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [influencedMap, setInfluencedMap] = useState<Record<string, boolean>>({});
  const [globeRadius, setGlobeRadius] = useState(148);

  const stageRef = useRef<HTMLDivElement>(null);
  const stageSizeRef = useRef({ width: 900, height: 420 });

  // Spherical rotation & drag momentum state (mutated inside 60fps animation frame)
  const yawRef = useRef(0.45);
  const pitchRef = useRef(0.24);
  const velYawRef = useRef(0);
  const velPitchRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const dragPointerRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, moved: 0 });
  const cursorRelRef = useRef({ x: -9999, y: -9999 });
  const influencedPrevRef = useRef<Record<string, boolean>>({});

  // Wireframe SVG refs for zero-React-rerender 3D rotation
  const meridianRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const equatorRef = useRef<SVGEllipseElement | null>(null);
  const northTropicRef = useRef<SVGEllipseElement | null>(null);
  const southTropicRef = useRef<SVGEllipseElement | null>(null);

  const cursorPxX = useMotionValue(-9999);
  const cursorPxY = useMotionValue(-9999);
  const smoothCursorX = useSpring(cursorPxX, CURSOR_RING_SPRING);
  const smoothCursorY = useSpring(cursorPxY, CURSOR_RING_SPRING);

  // Persistent per-node MotionValues (fixed array length matching TECH_SPHERE_NODES)
  const nodeMotions = useMemo<NodeMotionState[]>(
    () =>
      TECH_SPHERE_NODES.map(() => ({
        projX: new MotionValue(0),
        projY: new MotionValue(0),
        depthScale: new MotionValue(1),
        depthOpacity: new MotionValue(1),
        zIndexMV: new MotionValue(20),
        forceX: new MotionValue(0),
        forceY: new MotionValue(0),
        forceScale: new MotionValue(1),
      })),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        stageSizeRef.current = { width: rect.width, height: rect.height };
        const nextRadius = Math.max(
          96,
          Math.min(162, Math.min(rect.width * 0.34, rect.height * 0.37))
        );
        setGlobeRadius(Math.round(nextRadius));
      }
    };

    updateSize();
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateSize)
        : null;
    ro?.observe(el);
    window.addEventListener('resize', updateSize, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const allowPointerField = pointerFine && !prefersReducedMotion;

  const projectAndApplyForces = (radius: number) => {
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const perspective = 680;

    // Update SVG 3D wireframe meridians & latitude parallels
    MERIDIAN_OFFSETS.forEach((offset, idx) => {
      const el = meridianRefs.current[idx];
      if (!el) return;
      const rx = Math.max(1.5, Math.abs(Math.sin(yaw + offset)) * 180);
      el.setAttribute('rx', rx.toFixed(1));
    });

    if (equatorRef.current) {
      const eqRy = Math.max(2, Math.abs(sinP) * 180);
      equatorRef.current.setAttribute('ry', eqRy.toFixed(1));
    }

    const tropicLat = 0.62; // ~35.5 deg
    const tropicRadius = Math.cos(tropicLat) * 180;
    const tropicOffset = Math.sin(tropicLat) * 180 * cosP;
    const tropicRy = Math.max(2, Math.abs(sinP) * tropicRadius);

    if (northTropicRef.current) {
      northTropicRef.current.setAttribute('cy', (200 - tropicOffset).toFixed(1));
      northTropicRef.current.setAttribute('rx', tropicRadius.toFixed(1));
      northTropicRef.current.setAttribute('ry', tropicRy.toFixed(1));
    }
    if (southTropicRef.current) {
      southTropicRef.current.setAttribute('cy', (200 + tropicOffset).toFixed(1));
      southTropicRef.current.setAttribute('rx', tropicRadius.toFixed(1));
      southTropicRef.current.setAttribute('ry', tropicRy.toFixed(1));
    }

    const { width, height } = stageSizeRef.current;
    const cx = cursorRelRef.current.x;
    const cy = cursorRelRef.current.y;
    const pointerActive =
      allowPointerField &&
      !isDraggingRef.current &&
      cx > -1000 &&
      cy > -1000 &&
      width > 0 &&
      height > 0;

    let changedInfluence = false;
    const nextInfluence: Record<string, boolean> = {};

    TECH_SPHERE_NODES.forEach((node, idx) => {
      const state = nodeMotions[idx];

      // Rotate around Y (yaw) then X (pitch)
      const x1 = node.x0 * cosY - node.z0 * sinY;
      const z1 = node.x0 * sinY + node.z0 * cosY;
      const y2 = node.y0 * cosP - z1 * sinP;
      const z2 = node.y0 * sinP + z1 * cosP;

      const worldX = x1 * radius;
      const worldY = y2 * radius;
      const worldZ = z2 * radius;

      const depthRatio = perspective / (perspective - worldZ);
      const sx = worldX * depthRatio;
      const sy = worldY * depthRatio;
      const normZ = (z2 + 1) * 0.5; // 0 (back) -> 1 (front)

      state.projX.set(sx);
      state.projY.set(sy);
      state.depthScale.set(0.72 + normZ * 0.36);
      state.depthOpacity.set(0.32 + normZ * 0.68);
      state.zIndexMV.set(Math.round(normZ * 30) + 1);

      let influenced = false;
      if (pointerActive) {
        const vx = cx - sx;
        const vy = cy - sy;
        const dist = Math.hypot(vx, vy);

        if (dist < FORCE_RADIUS && dist > 0.001) {
          const falloff = Math.pow(1 - dist / FORCE_RADIUS, 1.25);
          const effectivePolarity: Polarity =
            fieldMode === 'mixed' ? node.polarity : fieldMode;
          const isAttractor = effectivePolarity === 'attract';
          influenced = falloff > 0.14;

          if (isAttractor) {
            const pull = Math.min(dist * 0.44, 38) * falloff;
            state.forceX.set((vx / dist) * pull);
            state.forceY.set((vy / dist) * pull);
            state.forceScale.set(1 + 0.16 * falloff);
          } else {
            const push = 52 * falloff;
            const halfW = width * 0.5 - 52;
            const halfH = height * 0.5 - 28;
            const targetFx = -(vx / dist) * push;
            const targetFy = -(vy / dist) * push;
            state.forceX.set(
              Math.max(-halfW - sx, Math.min(halfW - sx, targetFx))
            );
            state.forceY.set(
              Math.max(-halfH - sy, Math.min(halfH - sy, targetFy))
            );
            state.forceScale.set(1 - 0.06 * falloff);
          }
        } else {
          state.forceX.set(0);
          state.forceY.set(0);
          state.forceScale.set(1);
        }
      } else {
        state.forceX.set(0);
        state.forceY.set(0);
        state.forceScale.set(1);
      }

      nextInfluence[node.id] = influenced;
      if (Boolean(influencedPrevRef.current[node.id]) !== influenced) {
        changedInfluence = true;
      }
    });

    if (changedInfluence) {
      influencedPrevRef.current = nextInfluence;
      setInfluencedMap(nextInfluence);
    }
  };

  useEffect(() => {
    projectAndApplyForces(globeRadius);
  }, [globeRadius, fieldMode]);

  useAnimationFrame((_time, deltaMs) => {
    const dt = Math.min(deltaMs, 48) / 1000;

    if (!prefersReducedMotion && !isDraggingRef.current) {
      const hasMomentum =
        Math.abs(velYawRef.current) > 0.002 ||
        Math.abs(velPitchRef.current) > 0.002;

      if (hasMomentum) {
        yawRef.current += velYawRef.current * dt;
        pitchRef.current = Math.max(
          -1.05,
          Math.min(1.05, pitchRef.current + velPitchRef.current * dt)
        );
        const damping = Math.pow(0.06, dt);
        velYawRef.current *= damping;
        velPitchRef.current *= damping;
      } else {
        // Gentle orbital rotation (slows softly when inspecting/hovering)
        const baseSpeed = isHoveringRef.current ? 0.1 : 0.28;
        yawRef.current += baseSpeed * dt;
      }
    }

    projectAndApplyForces(globeRadius);
  });

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = false;
    dragPointerRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: 0,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    stageSizeRef.current = { width: rect.width, height: rect.height };
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    if (allowPointerField) {
      cursorPxX.set(relX);
      cursorPxY.set(relY);
      cursorRelRef.current = {
        x: relX - rect.width * 0.5,
        y: relY - rect.height * 0.5,
      };
      isHoveringRef.current = true;
      if (!isCursorInside) setIsCursorInside(true);
    }

    // Track drag spin if primary button held
    if (e.buttons === 1) {
      const dx = e.clientX - dragPointerRef.current.lastX;
      const dy = e.clientY - dragPointerRef.current.lastY;
      dragPointerRef.current.moved += Math.hypot(dx, dy);
      dragPointerRef.current.lastX = e.clientX;
      dragPointerRef.current.lastY = e.clientY;

      if (dragPointerRef.current.moved > 6) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          setIsDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // ignore capture error
          }
        }
        const sensitivity = 0.0065;
        yawRef.current += dx * sensitivity;
        pitchRef.current = Math.max(
          -1.05,
          Math.min(1.05, pitchRef.current - dy * sensitivity)
        );
        velYawRef.current = dx * 0.24;
        velPitchRef.current = -dy * 0.24;
        projectAndApplyForces(globeRadius);
      }
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore capture error
      }
    }
  };

  const handleStagePointerLeave = () => {
    isHoveringRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
    setIsCursorInside(false);
    cursorPxX.set(-9999);
    cursorPxY.set(-9999);
    cursorRelRef.current = { x: -9999, y: -9999 };
  };

  const selectedNode =
    TECH_SPHERE_NODES.find((item) => item.id === selectedId) ??
    TECH_SPHERE_NODES[0];
  const selectedPolarity: Polarity =
    fieldMode === 'mixed' ? selectedNode.polarity : fieldMode;
  const svgSize = globeRadius * 2 + 36;

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: 24, filter: 'blur(8px)' }
      }
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.72, ease: ARTCRAFT_EASE }}
      className="mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-[#E5E5E5] dark:border-[#262626] space-y-5"
    >
      {/* Header Row with Polarity Field Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A]">
            <span className="inline-block w-3.5 h-[2px] bg-[#FF721A]" aria-hidden="true" />
            <span>3D Orbital Stack</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Technology Globe
          </h3>
          <p className="text-xs sm:text-sm text-[#525252] dark:text-[#A3A3A3]">
            Drag to spin the 3D sphere or sweep your cursor nearby — software &amp; design icons attract while hardware &amp; RF icons repel.
          </p>
        </div>

        <div
          role="group"
          aria-label="Technology globe cursor polarity"
          className="inline-flex items-center p-1 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] self-start sm:self-auto"
        >
          {FIELD_MODES.map((item) => {
            const active = fieldMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFieldMode(item.id)}
                aria-pressed={active}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
                  active
                    ? 'text-white dark:text-[#0A0A0A]'
                    : 'text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tech-globe-mode-bg"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-[#0A0A0A] dark:bg-white"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Interactive Technology Globe Stage */}
      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerLeave}
        onPointerLeave={handleStagePointerLeave}
        className={`relative w-full h-[350px] sm:h-[420px] lg:h-[440px] rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA]/80 dark:bg-[#0A0A0A]/85 overflow-hidden select-none touch-pan-y ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Synchronized 3D Architectural Wireframe Sphere */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 400"
          style={{ width: svgSize, height: svgSize }}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {/* Outer Limb Circle */}
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-[#E5E5E5] dark:text-[#262626]"
          />

          {/* Latitude Tropics & Accent Equator */}
          <ellipse
            ref={northTropicRef}
            cx="200"
            cy="102"
            rx="147"
            ry="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeDasharray="3 5"
            className="text-[#D4D4D4] dark:text-[#262626]"
          />
          <ellipse
            ref={southTropicRef}
            cx="200"
            cy="298"
            rx="147"
            ry="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeDasharray="3 5"
            className="text-[#D4D4D4] dark:text-[#262626]"
          />
          <ellipse
            ref={equatorRef}
            cx="200"
            cy="200"
            rx="180"
            ry="42"
            fill="none"
            stroke="#FF721A"
            strokeOpacity="0.28"
            strokeWidth="1.15"
          />

          {/* Rotating Longitude Meridians */}
          {MERIDIAN_OFFSETS.map((offset, idx) => (
            <ellipse
              key={offset}
              ref={(el) => {
                meridianRefs.current[idx] = el;
              }}
              cx="200"
              cy="200"
              rx={Math.max(2, Math.abs(Math.sin(0.45 + offset)) * 180)}
              ry="180"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.9"
              strokeDasharray={idx % 2 === 0 ? undefined : '4 5'}
              className="text-[#E5E5E5] dark:text-[#262626]"
            />
          ))}

          {/* Polar Core Crosshair */}
          <line
            x1="200"
            y1="186"
            x2="200"
            y2="214"
            stroke="#FF721A"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <line
            x1="186"
            y1="200"
            x2="214"
            y2="200"
            stroke="#FF721A"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        </svg>

        {/* Cursor Magnetic Influence Ring */}
        {allowPointerField && (
          <motion.div
            aria-hidden="true"
            animate={{
              opacity: isCursorInside && !isDragging ? 1 : 0,
              scale: isCursorInside && !isDragging ? 1 : 0.72,
            }}
            transition={{ duration: 0.18 }}
            style={{
              x: smoothCursorX,
              y: smoothCursorY,
            }}
            className="pointer-events-none absolute top-0 left-0 -ml-[88px] -mt-[88px] w-44 h-44 rounded-full border border-dashed border-[#FF721A]/35 bg-[#FF721A]/[0.03]"
          />
        )}

        {/* 3D Projected Orbital Technology Nodes */}
        {TECH_SPHERE_NODES.map((node, idx) => (
          <GlobeNodeItem
            key={node.id}
            node={node}
            motionState={nodeMotions[idx]}
            mode={fieldMode}
            isSelected={selectedId === node.id}
            isInfluenced={Boolean(influencedMap[node.id])}
            onSelect={setSelectedId}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      {/* Legend & Selected Node Readout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#525252] dark:text-[#A3A3A3]">
        <div className="flex flex-wrap items-center gap-4 font-mono">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#FF721A] inline-block" aria-hidden="true" />
            <span>Attract</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 border border-[#C94B00] dark:border-[#FF721A] inline-block"
              aria-hidden="true"
            />
            <span>Repel</span>
          </span>
          <span className="text-[#737373] dark:text-[#737373]">
            · Drag sphere to orbit
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={`${selectedNode.id}-${selectedPolarity}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="font-mono text-xs text-[#0A0A0A] dark:text-white"
          >
            <span className="text-[#C94B00] dark:text-[#FF721A] font-semibold">
              {selectedNode.name}
            </span>{' '}
            · {selectedNode.discipline} ({selectedPolarity})
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
