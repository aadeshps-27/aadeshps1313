import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface GridCell {
  x: number;
  y: number;
  cx: number;
  cy: number;
  col: number;
  row: number;
  alpha: number;
  targetAlpha: number;
  decayDelay: number;
  decaySpeed: number;
  neighbors: {
    above: number;
    below: number;
    left: number;
    right: number;
  };
  neighborTarget: {
    above: number;
    below: number;
    left: number;
    right: number;
  };
  neighborDelay: {
    above: number;
    below: number;
    left: number;
    right: number;
  };
}

const DESKTOP_COLS = 26;
const MOBILE_COLS = 8;

/**
 * Interactive ReFactory-style tile-grid background for the Contact section.
 * Draws a square tile matrix with 4-directional neighbor orange glow bleed on pointer hover/tap
 * and soft vignette fade masks along all four edges.
 */
export const ContactGridBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cells: GridCell[] = [];
    let cols = DESKTOP_COLS;
    let rows = 1;
    let cellSize = 48;
    let width = 0;
    let height = 0;
    let activeIdx: number | null = null;
    let inView = true;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let ambientAccumulator = 0;

    const isDarkMode = () => document.documentElement.classList.contains('dark');

    const randomDelay = () => 0.1 + Math.random() * 0.28;

    const buildGrid = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = window.innerWidth < 768 ? MOBILE_COLS : DESKTOP_COLS;
      cellSize = width / cols;
      rows = Math.max(1, Math.ceil(height / cellSize));

      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          cells.push({
            x,
            y,
            cx: x + cellSize / 2,
            cy: y + cellSize / 2,
            col: c,
            row: r,
            alpha: 0,
            targetAlpha: 0,
            decayDelay: 0,
            decaySpeed: 1.4,
            neighbors: { above: 0, below: 0, left: 0, right: 0 },
            neighborTarget: { above: 0, below: 0, left: 0, right: 0 },
            neighborDelay: { above: 0, below: 0, left: 0, right: 0 },
          });
        }
      }
      activeIdx = null;
    };

    const getCellAt = (col: number, row: number): GridCell | undefined => {
      if (col < 0 || col >= cols || row < 0 || row >= rows) return undefined;
      return cells[row * cols + col];
    };

    const igniteCell = (idx: number) => {
      const cell = cells[idx];
      if (!cell) return;

      cell.targetAlpha = 1;
      cell.decayDelay = randomDelay();
      cell.decaySpeed = 1.05 + Math.random() * 0.55;

      const { col, row } = cell;
      const above = getCellAt(col, row - 1);
      const below = getCellAt(col, row + 1);
      const left = getCellAt(col - 1, row);
      const right = getCellAt(col + 1, row);

      if (above) {
        above.neighborTarget.above = 1;
        above.neighborDelay.above = randomDelay();
      }
      if (below) {
        below.neighborTarget.below = 1;
        below.neighborDelay.below = randomDelay();
      }
      if (left) {
        left.neighborTarget.left = 1;
        left.neighborDelay.left = randomDelay();
      }
      if (right) {
        right.neighborTarget.right = 1;
        right.neighborDelay.right = randomDelay();
      }
    };

    const stepAndDraw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const dark = isDarkMode();
      const baseBorder = dark
        ? 'rgba(168, 168, 168, 0.14)'
        : 'rgba(10, 10, 10, 0.08)';

      ctx.clearRect(0, 0, width, height);

      // Gentle ambient cell ignition so the architectural grid breathes even before cursor interaction
      if (!prefersReducedMotion) {
        ambientAccumulator += dt;
        if (ambientAccumulator >= 1.35 && cells.length > 0) {
          ambientAccumulator = 0;
          const randIdx = Math.floor(Math.random() * cells.length);
          igniteCell(randIdx);
        }
      }

      // Update animation physics
      if (!prefersReducedMotion) {
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];

          // Main cell alpha
          if (cell.targetAlpha > 0) {
            cell.alpha += (1 - cell.alpha) * Math.min(1, dt * 10);
            if (cell.alpha > 0.92) {
              cell.targetAlpha = 0;
            }
          } else if (cell.alpha > 0.004) {
            if (cell.decayDelay > 0) {
              cell.decayDelay -= dt;
            } else {
              cell.alpha = Math.max(0, cell.alpha - dt * cell.decaySpeed);
            }
          } else {
            cell.alpha = 0;
          }

          // 4-neighbor edge bleed physics
          const dirs = ['above', 'below', 'left', 'right'] as const;
          for (let d = 0; d < 4; d++) {
            const key = dirs[d];
            if (cell.neighborTarget[key] > 0) {
              cell.neighbors[key] +=
                (1 - cell.neighbors[key]) * Math.min(1, dt * 9);
              if (cell.neighbors[key] > 0.9) {
                cell.neighborTarget[key] = 0;
              }
            } else if (cell.neighbors[key] > 0.004) {
              if (cell.neighborDelay[key] > 0) {
                cell.neighborDelay[key] -= dt;
              } else {
                cell.neighbors[key] = Math.max(0, cell.neighbors[key] - dt * 1.35);
              }
            } else {
              cell.neighbors[key] = 0;
            }
          }
        }
      }

      // Pass 1: Base grid lines
      ctx.strokeStyle = baseBorder;
      ctx.lineWidth = 1;
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        ctx.strokeRect(cell.x, cell.y, cellSize, cellSize);
      }

      if (!prefersReducedMotion) {
        // Pass 2: Neighbor directional orange edge bleed gradients
        const bleedDist = cellSize * 0.42;
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const n = cell.neighbors;
          const maxNeighbor = Math.max(n.above, n.below, n.left, n.right);
          if (maxNeighbor <= 0.005) continue;

          ctx.save();
          ctx.beginPath();
          ctx.rect(cell.x, cell.y, cellSize, cellSize);
          ctx.clip();

          const edges: [number, number, number, number, number][] = [
            [n.above, cell.cx, cell.y + cellSize, cell.cx, cell.y + cellSize - bleedDist],
            [n.below, cell.cx, cell.y, cell.cx, cell.y + bleedDist],
            [n.left, cell.x + cellSize, cell.cy, cell.x + cellSize - bleedDist, cell.cy],
            [n.right, cell.x, cell.cy, cell.x + bleedDist, cell.cy],
          ];

          for (let e = 0; e < edges.length; e++) {
            const [val, x0, y0, x1, y1] = edges[e];
            if (val <= 0.005) continue;
            const grad = ctx.createLinearGradient(x0, y0, x1, y1);
            grad.addColorStop(0, `rgba(255, 114, 26, ${(0.28 * val).toFixed(3)})`);
            grad.addColorStop(0.6, `rgba(255, 114, 26, ${(0.09 * val).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(255, 114, 26, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(cell.x, cell.y, cellSize, cellSize);
          }

          ctx.restore();
          ctx.strokeStyle = `rgba(255, 114, 26, ${(maxNeighbor * 0.2).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(cell.x, cell.y, cellSize, cellSize);
        }

        // Pass 3: Active hovered/ignited cells with radial rim glow
        const glowRadius = cellSize * 0.85;
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          if (cell.alpha <= 0.005) continue;

          ctx.save();
          ctx.beginPath();
          ctx.rect(cell.x, cell.y, cellSize, cellSize);
          ctx.clip();

          const radial = ctx.createRadialGradient(
            cell.cx,
            cell.cy,
            0,
            cell.cx,
            cell.cy,
            glowRadius
          );
          radial.addColorStop(0, 'rgba(255, 114, 26, 0)');
          radial.addColorStop(
            0.58,
            `rgba(255, 114, 26, ${(0.18 * cell.alpha).toFixed(3)})`
          );
          radial.addColorStop(
            1,
            `rgba(255, 114, 26, ${(0.38 * cell.alpha).toFixed(3)})`
          );
          ctx.fillStyle = radial;
          ctx.fillRect(cell.x, cell.y, cellSize, cellSize);
          ctx.restore();

          ctx.strokeStyle = `rgba(255, 114, 26, ${(0.48 * cell.alpha).toFixed(3)})`;
          ctx.lineWidth = 1.1;
          ctx.strokeRect(cell.x, cell.y, cellSize, cellSize);
        }
      }

      if (inView && !prefersReducedMotion) {
        rafId = window.requestAnimationFrame(stepAndDraw);
      } else {
        rafId = null;
      }
    };

    const startLoop = () => {
      if (rafId !== null) return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(stepAndDraw);
    };

    const stopLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion || e.pointerType === 'touch') return;
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        activeIdx = null;
        return;
      }

      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const col = Math.floor(localX / cellSize);
      const row = Math.floor(localY / cellSize);
      const idx = row * cols + col;

      if (col >= 0 && col < cols && row >= 0 && row < rows && idx !== activeIdx) {
        activeIdx = idx;
        igniteCell(idx);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      const col = Math.floor((e.clientX - rect.left) / cellSize);
      const row = Math.floor((e.clientY - rect.top) / cellSize);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        igniteCell(row * cols + col);
      }
    };

    buildGrid();
    stepAndDraw(performance.now());

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = Boolean(entries[0]?.isIntersecting);
              if (inView && !prefersReducedMotion) {
                startLoop();
              } else {
                stopLoop();
              }
            },
            { threshold: 0.01 }
          )
        : null;

    observer?.observe(container);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            buildGrid();
            if (prefersReducedMotion) {
              stepAndDraw(performance.now());
            }
          })
        : null;
    resizeObserver?.observe(container);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    // Redraw static grid immediately if theme toggles during reduced motion
    const themeObserver = new MutationObserver(() => {
      if (prefersReducedMotion) {
        stepAndDraw(performance.now());
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      stopLoop();
      observer?.disconnect();
      resizeObserver?.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-grid="contact"
      className="pointer-events-none select-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-7xl z-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full opacity-90 dark:opacity-75" />

      {/* 4-edge ReFactory vignette fade masks blending seamlessly into light/dark canvas */}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white dark:from-black to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white dark:from-black to-transparent" />
      <div className="absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-white dark:from-black to-transparent" />
      <div className="absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-white dark:from-black to-transparent" />
    </div>
  );
};
