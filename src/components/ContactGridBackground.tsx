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
 * Draws a pixel-snapped square tile matrix with 4-directional neighbor orange glow bleed
 * on pointer hover/tap and seamless 4-edge vignette fade masks.
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
    let lastPointerCell: { col: number; row: number } | null = null;
    let inView = true;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let ambientAccumulator = 0;

    const isDarkMode = () => document.documentElement.classList.contains('dark');
    const randomDelay = () => 0.1 + Math.random() * 0.28;

    const buildGrid = (preserveState = false) => {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));

      const prevByKey = preserveState
        ? new Map<string, GridCell>(cells.map((c) => [`${c.col}:${c.row}`, c]))
        : null;

      width = nextWidth;
      height = nextHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = window.innerWidth < 768 ? MOBILE_COLS : DESKTOP_COLS;
      cellSize = width / cols;
      rows = Math.max(1, Math.ceil(height / cellSize));

      const nextCells: GridCell[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          const prev = prevByKey?.get(`${c}:${r}`);
          nextCells.push({
            x,
            y,
            cx: x + cellSize / 2,
            cy: y + cellSize / 2,
            col: c,
            row: r,
            alpha: prev ? prev.alpha : 0,
            targetAlpha: prev ? prev.targetAlpha : 0,
            decayDelay: prev ? prev.decayDelay : 0,
            decaySpeed: prev ? prev.decaySpeed : 1.4,
            neighbors: prev
              ? { ...prev.neighbors }
              : { above: 0, below: 0, left: 0, right: 0 },
            neighborTarget: prev
              ? { ...prev.neighborTarget }
              : { above: 0, below: 0, left: 0, right: 0 },
            neighborDelay: prev
              ? { ...prev.neighborDelay }
              : { above: 0, below: 0, left: 0, right: 0 },
          });
        }
      }
      cells = nextCells;
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

    const igniteAmbientInnerCell = () => {
      if (cells.length === 0) return;
      const minRow = rows >= 3 ? 1 : 0;
      const maxRow = rows >= 3 ? rows - 2 : rows - 1;
      const minCol = cols >= 4 ? 1 : 0;
      const maxCol = cols >= 4 ? cols - 2 : cols - 1;

      const r = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
      const c = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));
      igniteCell(r * cols + c);
    };

    const stepAndDraw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const dark = isDarkMode();
      const baseBorder = dark
        ? 'rgba(255, 255, 255, 0.095)'
        : 'rgba(10, 10, 10, 0.08)';

      ctx.clearRect(0, 0, width, height);

      // Gentle ambient cell ignition inside visible area
      if (!prefersReducedMotion) {
        ambientAccumulator += dt;
        if (ambientAccumulator >= 1.25 && cells.length > 0) {
          ambientAccumulator = 0;
          igniteAmbientInnerCell();
        }
      }

      // Update cell & neighbor decay physics
      if (!prefersReducedMotion) {
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];

          if (cell.targetAlpha > 0) {
            cell.alpha += (1 - cell.alpha) * Math.min(1, dt * 11);
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

          const dirs = ['above', 'below', 'left', 'right'] as const;
          for (let d = 0; d < 4; d++) {
            const key = dirs[d];
            if (cell.neighborTarget[key] > 0) {
              cell.neighbors[key] +=
                (1 - cell.neighbors[key]) * Math.min(1, dt * 9.5);
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

      // Pass 1: Single-pass pixel-snapped orthogonal mesh (no double-drawn borders)
      ctx.strokeStyle = baseBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const px = Math.round(c * cellSize) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
      }
      for (let r = 0; r <= rows; r++) {
        const py = Math.round(r * cellSize) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
      }
      ctx.stroke();

      if (!prefersReducedMotion) {
        // Pass 2: 4-directional neighbor orange edge bleed gradients
        const bleedDist = cellSize * 0.45;
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
            grad.addColorStop(0, `rgba(255, 114, 26, ${(0.32 * val).toFixed(3)})`);
            grad.addColorStop(0.6, `rgba(255, 114, 26, ${(0.1 * val).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(255, 114, 26, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(cell.x, cell.y, cellSize, cellSize);
          }

          ctx.restore();
          ctx.strokeStyle = `rgba(255, 114, 26, ${(maxNeighbor * 0.24).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(
            Math.round(cell.x) + 0.5,
            Math.round(cell.y) + 0.5,
            Math.max(1, Math.round(cellSize)),
            Math.max(1, Math.round(cellSize))
          );
        }

        // Pass 3: Active hovered/ignited cells with radial #FF721A rim glow
        const glowRadius = cellSize * 0.88;
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
          radial.addColorStop(0, 'rgba(255, 114, 26, 0.03)');
          radial.addColorStop(
            0.55,
            `rgba(255, 114, 26, ${(0.22 * cell.alpha).toFixed(3)})`
          );
          radial.addColorStop(
            1,
            `rgba(255, 114, 26, ${(0.44 * cell.alpha).toFixed(3)})`
          );
          ctx.fillStyle = radial;
          ctx.fillRect(cell.x, cell.y, cellSize, cellSize);
          ctx.restore();

          ctx.strokeStyle = `rgba(255, 114, 26, ${(0.56 * cell.alpha).toFixed(3)})`;
          ctx.lineWidth = 1.25;
          ctx.strokeRect(
            Math.round(cell.x) + 0.5,
            Math.round(cell.y) + 0.5,
            Math.max(1, Math.round(cellSize)),
            Math.max(1, Math.round(cellSize))
          );
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
        lastPointerCell = null;
        return;
      }

      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const col = Math.max(0, Math.min(cols - 1, Math.floor(localX / cellSize)));
      const row = Math.max(0, Math.min(rows - 1, Math.floor(localY / cellSize)));

      if (
        lastPointerCell &&
        lastPointerCell.col === col &&
        lastPointerCell.row === row
      ) {
        return;
      }

      if (lastPointerCell) {
        // Interpolate along fast cursor movement so the trail stays continuous
        const dCol = col - lastPointerCell.col;
        const dRow = row - lastPointerCell.row;
        const steps = Math.min(10, Math.max(Math.abs(dCol), Math.abs(dRow)));
        for (let s = 1; s <= steps; s++) {
          const ic = Math.round(lastPointerCell.col + (dCol * s) / steps);
          const ir = Math.round(lastPointerCell.row + (dRow * s) / steps);
          igniteCell(ir * cols + ic);
        }
      } else {
        igniteCell(row * cols + col);
      }

      lastPointerCell = { col, row };
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

    buildGrid(false);
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
            buildGrid(true);
            if (prefersReducedMotion) {
              stepAndDraw(performance.now());
            }
          })
        : null;
    resizeObserver?.observe(container);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    const themeObserver = new MutationObserver(() => {
      if (rafId === null) {
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
      className="pointer-events-none select-none absolute inset-0 z-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* 4-edge vignette fade masks blending seamlessly into section bg-white / dark:bg-black */}
      <div className="absolute inset-x-0 top-0 h-16 sm:h-24 bg-gradient-to-b from-white via-white/75 dark:from-black dark:via-black/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-white via-white/75 dark:from-black dark:via-black/75 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-white dark:from-black to-transparent" />
      <div className="absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-white dark:from-black to-transparent" />
    </div>
  );
};
