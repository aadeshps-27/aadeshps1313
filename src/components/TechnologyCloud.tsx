import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Atom,
  Bot,
  Braces,
  Compass,
  Layers,
  PenTool,
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
    id: 'typescript',
    name: 'TypeScript',
    discipline: 'Type-Safe Engineering',
    polarity: 'attract',
    icon: Braces,
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

// Precompute geodesic constellation edges between nearest neighbors on the unit sphere
const GEODESIC_EDGES: [number, number][] = (() => {
  const edges: [number, number][] = [];
  for (let i = 0; i < TECH_SPHERE_NODES.length; i++) {
    for (let j = i + 1; j < TECH_SPHERE_NODES.length; j++) {
      const a = TECH_SPHERE_NODES[i];
      const b = TECH_SPHERE_NODES[j];
      const dist = Math.hypot(a.x0 - b.x0, a.y0 - b.y0, a.z0 - b.z0);
      if (dist < 1.42) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
})();

const FIELD_MODES: { id: CloudFieldMode; label: string }[] = [
  { id: 'mixed', label: 'Mixed Field' },
  { id: 'attract', label: 'Attract' },
  { id: 'repel', label: 'Repel' },
];

const FORCE_RADIUS = 180;
const NODE_SPRING = { stiffness: 220, damping: 18, mass: 0.55 };
const SCALE_SPRING = { stiffness: 320, damping: 22, mass: 0.5 };
const CURSOR_RING_SPRING = { stiffness: 280, damping: 28, mass: 0.4 };
const MERIDIAN_OFFSETS = [0, Math.PI / 5, (2 * Math.PI) / 5, (3 * Math.PI) / 5, (4 * Math.PI) / 5];

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

interface LiveSpringPair {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

interface GlobeNodeItemProps {
  index: number;
  node: TechSphereNode;
  motionState: NodeMotionState;
  mode: CloudFieldMode;
  isSelected: boolean;
  isInfluenced: boolean;
  onSelect: (id: string) => void;
  onRegisterSprings: (index: number, x: MotionValue<number>, y: MotionValue<number>) => void;
  prefersReducedMotion: boolean;
}

const GlobeNodeItem: React.FC<GlobeNodeItemProps> = ({
  index,
  node,
  motionState,
  mode,
  isSelected,
  isInfluenced,
  onSelect,
  onRegisterSprings,
  prefersReducedMotion,
}) => {
  const Icon = node.icon;
  const effectivePolarity: Polarity = mode === 'mixed' ? node.polarity : mode;
  const isAttractor = effectivePolarity === 'attract';

  const springForceX = useSpring(motionState.forceX, NODE_SPRING);
  const springForceY = useSpring(motionState.forceY, NODE_SPRING);
  const springForceScale = useSpring(motionState.forceScale, SCALE_SPRING);

  useEffect(() => {
    onRegisterSprings(index, springForceX, springForceY);
  }, [index, onRegisterSprings, springForceX, springForceY]);

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
            whileHover={prefersReducedMotion ? undefined : { scale: 1.09 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
            aria-pressed={isSelected}
            className={`group/node relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
              isSelected
                ? 'border-[#FF721A] bg-white dark:bg-[#141414] text-[#0A0A0A] dark:text-white shadow-[0_8px_24px_-4px_rgba(255,114,26,0.35)] ring-1 ring-[#FF721A]/35'
                : isInfluenced
                  ? isAttractor
                    ? 'border-[#FF721A] bg-white dark:bg-[#141414] text-[#0A0A0A] dark:text-white shadow-[0_8px_22px_-4px_rgba(255,114,26,0.28)]'
                    : 'border-[#0A0A0A] dark:border-white bg-white dark:bg-[#141414] text-[#0A0A0A] dark:text-white shadow-md'
                  : 'border-[#E5E5E5]/95 dark:border-[#2A2A2A] bg-white/95 dark:bg-[#111111]/95 text-[#0A0A0A] dark:text-white shadow-sm hover:border-[#FF721A]'
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg shrink-0 transition-colors ${
                isAttractor
                  ? 'bg-[#FF721A]/15 text-[#C94B00] dark:text-[#FF721A]'
                  : 'bg-[#0A0A0A]/[0.06] dark:bg-white/[0.09] text-[#0A0A0A] dark:text-white'
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
  const [stageDims, setStageDims] = useState({ width: 900, height: 430, radius: 158 });

  const stageRef = useRef<HTMLDivElement>(null);
  const stageSizeRef = useRef({ width: 900, height: 430 });

  // Spherical rotation & drag momentum state (updated at 60fps without React re-renders)
  const yawRef = useRef(0.48);
  const pitchRef = useRef(0.28);
  const velYawRef = useRef(0);
  const velPitchRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const dragPointerRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, moved: 0 });
  const cursorRelRef = useRef({ x: -9999, y: -9999 });
  const influencedPrevRef = useRef<Record<string, boolean>>({});
  const liveSpringsRef = useRef<Record<number, LiveSpringPair>>({});

  // Wireframe & Geodesic SVG element refs for 60fps direct attribute mutation
  const meridianRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const equatorRef = useRef<SVGEllipseElement | null>(null);
  const northTropicRef = useRef<SVGEllipseElement | null>(null);
  const southTropicRef = useRef<SVGEllipseElement | null>(null);
  const edgeLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const tetherLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const outerRingGroupRef = useRef<SVGGElement | null>(null);

  const cursorPxX = useMotionValue(-9999);
  const cursorPxY = useMotionValue(-9999);
  const smoothCursorX = useSpring(cursorPxX, CURSOR_RING_SPRING);
  const smoothCursorY = useSpring(cursorPxY, CURSOR_RING_SPRING);

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

  const registerSprings = useMemo(
    () => (idx: number, x: MotionValue<number>, y: MotionValue<number>) => {
      liveSpringsRef.current[idx] = { x, y };
    },
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
          104,
          Math.min(170, Math.min(rect.width * 0.35, rect.height * 0.38))
        );
        setStageDims({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          radius: Math.round(nextRadius),
        });
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
  const selectedIndex = TECH_SPHERE_NODES.findIndex((n) => n.id === selectedId);

  const projectAndApplyForces = (radius: number) => {
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const perspective = 680;

    // 1) Synchronize 3D wireframe meridians & parallels
    MERIDIAN_OFFSETS.forEach((offset, idx) => {
      const el = meridianRefs.current[idx];
      if (!el) return;
      const rx = Math.max(1.5, Math.abs(Math.sin(yaw + offset)) * 180);
      el.setAttribute('rx', rx.toFixed(1));
    });

    if (equatorRef.current) {
      const eqRy = Math.max(3, Math.abs(sinP) * 180);
      equatorRef.current.setAttribute('ry', eqRy.toFixed(1));
    }

    const tropicLat = 0.62;
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

    if (outerRingGroupRef.current) {
      const deg = ((yaw * 180) / Math.PI) * 0.45;
      outerRingGroupRef.current.setAttribute(
        'transform',
        `rotate(${deg.toFixed(2)} 200 200)`
      );
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
    const liveCoords: { x: number; y: number; normZ: number; influenced: boolean; isAttractor: boolean }[] =
      new Array(TECH_SPHERE_NODES.length);

    // 2) Project every node in 3D and apply cursor attract/repel springs
    TECH_SPHERE_NODES.forEach((node, idx) => {
      const state = nodeMotions[idx];

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
      const normZ = (z2 + 1) * 0.5;

      state.projX.set(sx);
      state.projY.set(sy);
      state.depthScale.set(0.68 + normZ * 0.42);
      state.depthOpacity.set(0.28 + normZ * 0.72);
      state.zIndexMV.set(Math.round(normZ * 30) + 1);

      const effectivePolarity: Polarity =
        fieldMode === 'mixed' ? node.polarity : fieldMode;
      const isAttractor = effectivePolarity === 'attract';

      let influenced = false;
      if (pointerActive) {
        const vx = cx - sx;
        const vy = cy - sy;
        const dist = Math.hypot(vx, vy);

        if (dist < FORCE_RADIUS && dist > 0.001) {
          const falloff = Math.pow(1 - dist / FORCE_RADIUS, 1.25);
          influenced = falloff > 0.14;

          if (isAttractor) {
            const pull = Math.min(dist * 0.45, 38) * falloff;
            state.forceX.set((vx / dist) * pull);
            state.forceY.set((vy / dist) * pull);
            state.forceScale.set(1 + 0.16 * falloff);
          } else {
            const push = 52 * falloff;
            const halfW = width * 0.5 - 54;
            const halfH = height * 0.5 - 30;
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

      const springPair = liveSpringsRef.current[idx];
      const liveFx = springPair ? springPair.x.get() : 0;
      const liveFy = springPair ? springPair.y.get() : 0;

      liveCoords[idx] = {
        x: sx + liveFx,
        y: sy + liveFy,
        normZ,
        influenced,
        isAttractor,
      };

      // Update interactive magnetic tether beam between cursor and nearby node
      const tetherEl = tetherLineRefs.current[idx];
      if (tetherEl) {
        if (pointerActive && influenced) {
          tetherEl.setAttribute('x1', cx.toFixed(1));
          tetherEl.setAttribute('y1', cy.toFixed(1));
          tetherEl.setAttribute('x2', (sx + liveFx).toFixed(1));
          tetherEl.setAttribute('y2', (sy + liveFy).toFixed(1));
          tetherEl.setAttribute(
            'stroke',
            isAttractor ? '#FF721A' : 'currentColor'
          );
          tetherEl.setAttribute(
            'stroke-opacity',
            (0.22 + normZ * 0.36).toFixed(2)
          );
          tetherEl.setAttribute(
            'stroke-dasharray',
            isAttractor ? 'none' : '3 4'
          );
        } else {
          tetherEl.setAttribute('stroke-opacity', '0');
        }
      }

      nextInfluence[node.id] = influenced;
      if (Boolean(influencedPrevRef.current[node.id]) !== influenced) {
        changedInfluence = true;
      }
    });

    // 3) Update geodesic constellation edges connecting neighboring 3D nodes
    GEODESIC_EDGES.forEach(([i, j], edgeIdx) => {
      const lineEl = edgeLineRefs.current[edgeIdx];
      if (!lineEl) return;
      const a = liveCoords[i];
      const b = liveCoords[j];
      if (!a || !b) return;

      lineEl.setAttribute('x1', a.x.toFixed(1));
      lineEl.setAttribute('y1', a.y.toFixed(1));
      lineEl.setAttribute('x2', b.x.toFixed(1));
      lineEl.setAttribute('y2', b.y.toFixed(1));

      const avgDepth = (a.normZ + b.normZ) * 0.5;
      const touchesSelected = i === selectedIndex || j === selectedIndex;
      const isActiveEdge = touchesSelected || a.influenced || b.influenced;

      lineEl.setAttribute(
        'stroke',
        isActiveEdge ? '#FF721A' : 'currentColor'
      );
      lineEl.setAttribute(
        'stroke-opacity',
        isActiveEdge
          ? (0.28 + avgDepth * 0.45).toFixed(2)
          : (0.06 + avgDepth * 0.16).toFixed(2)
      );
      lineEl.setAttribute('stroke-width', isActiveEdge ? '1.25' : '0.85');
    });

    if (changedInfluence) {
      influencedPrevRef.current = nextInfluence;
      setInfluencedMap(nextInfluence);
    }
  };

  useEffect(() => {
    projectAndApplyForces(stageDims.radius);
  }, [stageDims.radius, fieldMode, selectedIndex]);

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
        const baseSpeed = isHoveringRef.current ? 0.1 : 0.28;
        yawRef.current += baseSpeed * dt;
      }
    }

    projectAndApplyForces(stageDims.radius);
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
        projectAndApplyForces(stageDims.radius);
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

  const orbDiameter = stageDims.radius * 2;
  const svgSize = orbDiameter + 44;

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
        className={`relative w-full h-[360px] sm:h-[430px] lg:h-[460px] rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#050505] overflow-hidden select-none touch-pan-y ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Minimal Architectural Drafting Corner Marks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 left-3.5 w-3 h-3 border-t border-l border-[#D4D4D4] dark:border-[#333333]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 right-3.5 w-3 h-3 border-t border-r border-[#D4D4D4] dark:border-[#333333]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3.5 left-3.5 w-3 h-3 border-b border-l border-[#D4D4D4] dark:border-[#333333]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3.5 right-3.5 w-3 h-3 border-b border-r border-[#D4D4D4] dark:border-[#333333]"
        />

        {/* Volumetric Ambient Stage Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-75 dark:opacity-90"
          style={{
            width: orbDiameter + 120,
            height: orbDiameter + 120,
            background:
              'radial-gradient(circle, rgba(255,114,26,0.12) 0%, rgba(255,114,26,0.03) 48%, transparent 72%)',
          }}
        />

        {/* Light Mode 3D Sculptural Shaded Sphere Volume */}
        <div
          aria-hidden="true"
          className="block dark:hidden pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E5E5E5]"
          style={{
            width: orbDiameter,
            height: orbDiameter,
            background:
              'radial-gradient(circle at 33% 27%, rgba(255,255,255,0.98) 0%, rgba(244,244,245,0.9) 50%, rgba(224,224,228,0.85) 84%, rgba(255,114,26,0.14) 100%)',
            boxShadow:
              '0 28px 64px -18px rgba(10,10,10,0.14), inset -18px -22px 44px rgba(10,10,10,0.06), inset 14px 14px 32px rgba(255,255,255,0.9)',
          }}
        />

        {/* Dark Mode 3D Sculptural Shaded Sphere Volume */}
        <div
          aria-hidden="true"
          className="hidden dark:block pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#262626]"
          style={{
            width: orbDiameter,
            height: orbDiameter,
            background:
              'radial-gradient(circle at 33% 27%, rgba(48,48,54,0.85) 0%, rgba(16,16,19,0.95) 54%, rgba(4,4,6,0.98) 85%, rgba(255,114,26,0.22) 100%)',
            boxShadow:
              '0 28px 72px -14px rgba(255,114,26,0.18), inset -18px -22px 48px rgba(0,0,0,0.75), inset 14px 14px 36px rgba(255,255,255,0.05)',
          }}
        />

        {/* Tilted Precision Outer Calibration Orbital Ring */}
        <div
          aria-hidden="true"
          style={{
            width: orbDiameter + 48,
            height: orbDiameter + 48,
          }}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 scale-y-[0.34] rounded-full border border-dashed border-[#FF721A]/35"
        />

        {/* Synchronized 3D Architectural Wireframe Sphere */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 400"
          style={{ width: svgSize, height: svgSize }}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {/* Rotating Outer Calibrated Bezel Ticks */}
          <g ref={outerRingGroupRef}>
            <circle
              cx="200"
              cy="200"
              r="192"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 12"
              className="text-[#D4D4D4] dark:text-[#333333]"
            />
          </g>

          {/* Outer Limb Circle */}
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-[#E5E5E5] dark:text-[#2A2A2A]"
          />

          {/* Latitude Tropics & Glowing Orange Equator */}
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
            className="text-[#D4D4D4] dark:text-[#2E2E2E]"
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
            className="text-[#D4D4D4] dark:text-[#2E2E2E]"
          />
          <ellipse
            ref={equatorRef}
            cx="200"
            cy="200"
            rx="180"
            ry="42"
            fill="none"
            stroke="#FF721A"
            strokeOpacity="0.42"
            strokeWidth="1.25"
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
              rx={Math.max(2, Math.abs(Math.sin(0.48 + offset)) * 180)}
              ry="180"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.85"
              strokeDasharray={idx % 2 === 0 ? undefined : '4 5'}
              className="text-[#E5E5E5] dark:text-[#262626]"
            />
          ))}

          {/* Polar Core Crosshair */}
          <circle cx="200" cy="200" r="3.5" fill="#FF721A" fillOpacity="0.8" />
          <line
            x1="200"
            y1="184"
            x2="200"
            y2="216"
            stroke="#FF721A"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <line
            x1="184"
            y1="200"
            x2="216"
            y2="200"
            stroke="#FF721A"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        </svg>

        {/* Live 3D Geodesic Constellation Mesh & Magnetic Cursor Force Tethers */}
        <svg
          aria-hidden="true"
          viewBox={`${-stageDims.width / 2} ${-stageDims.height / 2} ${stageDims.width} ${stageDims.height}`}
          className="pointer-events-none absolute inset-0 w-full h-full text-[#737373] dark:text-[#A3A3A3]"
        >
          {GEODESIC_EDGES.map(([i, j], edgeIdx) => (
            <line
              key={`${i}-${j}`}
              ref={(el) => {
                edgeLineRefs.current[edgeIdx] = el;
              }}
              stroke="currentColor"
              strokeOpacity="0.14"
              strokeWidth="0.85"
            />
          ))}
          {TECH_SPHERE_NODES.map((node, idx) => (
            <line
              key={`tether-${node.id}`}
              ref={(el) => {
                tetherLineRefs.current[idx] = el;
              }}
              stroke="#FF721A"
              strokeOpacity="0"
              strokeWidth="1"
            />
          ))}
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
            className="pointer-events-none absolute top-0 left-0 -ml-[88px] -mt-[88px] w-44 h-44 rounded-full border border-dashed border-[#FF721A]/40 bg-[#FF721A]/[0.035]"
          />
        )}

        {/* 3D Projected Orbital Technology Nodes */}
        {TECH_SPHERE_NODES.map((node, idx) => (
          <GlobeNodeItem
            key={node.id}
            index={idx}
            node={node}
            motionState={nodeMotions[idx]}
            mode={fieldMode}
            isSelected={selectedId === node.id}
            isInfluenced={Boolean(influencedMap[node.id])}
            onSelect={setSelectedId}
            onRegisterSprings={registerSprings}
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
