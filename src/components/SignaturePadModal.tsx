import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ARTCRAFT_EASE, RfButtonFlickerText } from './MotionPrimitives';

export interface SignaturePoint {
  x: number; // normalized [0..1]
  y: number; // normalized [0..1]
  t: number; // ms timestamp
}

export type SignatureStrokes = SignaturePoint[][];

interface SignaturePadModalProps {
  open: boolean;
  initialStrokes: SignatureStrokes;
  onClose: () => void;
  onDone: (strokes: SignatureStrokes) => void;
}

export function drawSignatureStrokes(
  canvas: HTMLCanvasElement,
  strokes: SignatureStrokes,
  inkColor: string,
  baseWidth = 2.4
) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  if (strokes.length === 0) return;

  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;

    if (stroke.length === 1) {
      const pt = stroke[0];
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, baseWidth * 0.55, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    for (let i = 1; i < stroke.length; i++) {
      const p0 = stroke[i - 1];
      const p1 = stroke[i];
      const p2 = stroke[i + 1];

      const x0 = p0.x * w;
      const y0 = p0.y * h;
      const x1 = p1.x * w;
      const y1 = p1.y * h;

      const dist = Math.hypot(x1 - x0, y1 - y0);
      const dt = Math.max(1, p1.t - p0.t);
      const speed = dist / dt;
      const width = Math.max(
        baseWidth * 0.62,
        Math.min(baseWidth * 1.28, baseWidth * (1.15 - speed * 0.22))
      );

      ctx.lineWidth = width;
      ctx.beginPath();

      if (i === 1) {
        ctx.moveTo(x0, y0);
      } else {
        const prev = stroke[i - 2];
        ctx.moveTo(((prev.x + p0.x) / 2) * w, ((prev.y + p0.y) / 2) * h);
      }

      if (p2) {
        const midX = ((p1.x + p2.x) / 2) * w;
        const midY = ((p1.y + p2.y) / 2) * h;
        ctx.quadraticCurveTo(x1, y1, midX, midY);
      } else {
        ctx.lineTo(x1, y1);
      }

      ctx.stroke();
    }
  }
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  open,
  initialStrokes,
  onClose,
  onDone,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const drawingRef = useRef(false);
  const strokesRef = useRef<SignatureStrokes>(initialStrokes);
  const onCloseRef = useRef(onClose);
  const [hasInk, setHasInk] = useState(initialStrokes.length > 0);

  onCloseRef.current = onClose;

  const getInkColor = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? '#F5F5F5' : '#1B2440';
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawSignatureStrokes(canvas, strokesRef.current, getInkColor(), 2.6);
  };

  useEffect(() => {
    if (!open) return;
    strokesRef.current = initialStrokes.map((s) => s.map((p) => ({ ...p })));
    setHasInk(initialStrokes.length > 0);

    const frame = window.requestAnimationFrame(() => {
      redraw();
    });

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      }
    };

    const handleResize = () => redraw();

    window.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  const toNormPoint = (e: React.PointerEvent<HTMLCanvasElement>): SignaturePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      t: performance.now(),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const pt = toNormPoint(e);
    if (!pt) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current = [...strokesRef.current, [pt]];
    setHasInk(true);
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pt = toNormPoint(e);
    if (!pt || strokesRef.current.length === 0) return;

    const currentStroke = strokesRef.current[strokesRef.current.length - 1];
    const last = currentStroke[currentStroke.length - 1];
    if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 0.0025) return;

    currentStroke.push(pt);
    redraw();
  };

  const handlePointerEnd = () => {
    drawingRef.current = false;
  };

  const handleClear = () => {
    strokesRef.current = [];
    setHasInk(false);
    redraw();
  };

  const handleConfirm = () => {
    onDone(strokesRef.current.map((s) => s.map((p) => ({ ...p }))));
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sign your name"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0A0A]/55 dark:bg-black/75 backdrop-blur-xs"
          />

          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 18, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 10, scale: 0.98 }
            }
            transition={{ duration: 0.24, ease: ARTCRAFT_EASE }}
            className="relative z-10 w-[min(92vw,600px)] rounded-[2px] border border-[#E5E5E5] dark:border-[#2A2A2A] bg-[#F4F3EF] dark:bg-[#141414] text-[#1A1A1A] dark:text-[#F5F5F5] font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_30px_80px_rgba(0,0,0,0.45)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.75)] p-5 sm:p-7"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-[11px] tracking-[0.06em]">
              <span className="font-semibold">SIGN HERE</span>
              <span className="text-[#525252] dark:text-[#A3A3A3]">
                WITH YOUR FINGER, MOUSE OR PEN
              </span>
            </div>

            <div className="relative mt-3 h-[190px] sm:h-[220px] border-b border-[#1A1A1A]/25 dark:border-white/25 touch-none cursor-crosshair">
              <canvas
                ref={canvasRef}
                aria-label="Signature pad"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                className="absolute inset-0 block w-full h-full"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0.5 bottom-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]"
              >
                ✕
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-2 text-[11px] tracking-[0.06em] uppercase text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                Cancel
              </button>

              <div className="flex items-center gap-4">
                {hasInk && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="min-h-[40px] px-2 text-[11px] tracking-[0.06em] uppercase text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                  >
                    Clear
                  </button>
                )}

                <button
                  ref={doneButtonRef}
                  type="button"
                  onClick={handleConfirm}
                  className="rf-btn-flicker min-h-[44px] inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#0A0A0A] text-white dark:bg-[#FF721A] dark:text-[#0A0A0A] text-xs font-semibold tracking-[0.04em] hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#E56212] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                >
                  <RfButtonFlickerText text="Done" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
