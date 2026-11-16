import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ProjectId, ProjectSummary } from '../data/portfolio';
import { ARTCRAFT_EASE } from './MotionPrimitives';

interface ProjectTimelineChartProps {
  projects: ProjectSummary[];
  onOpenProject: (id: ProjectId) => void;
  activeFilterLabel?: string;
}

function parseMonthDate(ym: string): Date {
  const [yearStr, monthStr] = ym.split('-');
  const year = Number(yearStr) || 2023;
  const month = (Number(monthStr) || 1) - 1;
  return new Date(year, month, 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function diffMonths(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

export const ProjectTimelineChart: React.FC<ProjectTimelineChartProps> = ({
  projects,
  onOpenProject,
  activeFilterLabel,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const rawUid = useId();
  const chartUid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const onOpenProjectRef = useRef(onOpenProject);
  onOpenProjectRef.current = onOpenProject;

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<ProjectId | null>(
    () => projects[0]?.id ?? null
  );
  const [hoveredLayerIndex, setHoveredLayerIndex] = useState<number | null>(null);

  // Order matching projects chronologically left-to-right across the timeline
  const orderedProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) =>
        parseMonthDate(a.timeline.startDate).getTime() -
        parseMonthDate(b.timeline.startDate).getTime()
    );
  }, [projects]);

  // Synchronously resolve active project so filter switches never flash stale inspector details
  const activeProject = useMemo(() => {
    if (orderedProjects.length === 0) return null;
    return orderedProjects.find((p) => p.id === selectedId) ?? orderedProjects[0];
  }, [orderedProjects, selectedId]);

  const activeId = activeProject?.id ?? null;

  useEffect(() => {
    setHoveredLayerIndex(null);
    if (orderedProjects.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) =>
      prev && orderedProjects.some((p) => p.id === prev)
        ? prev
        : orderedProjects[0].id
    );
  }, [orderedProjects]);

  // Synchronously measure container width before paint so D3 draws once at exact pixel width
  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const measured = node.clientWidth || Math.floor(node.getBoundingClientRect().width);
      if (measured > 0) {
        setContainerWidth(Math.max(280, measured));
      }
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const effectiveWidth = containerWidth > 0 ? containerWidth : 920;
  const isCompact = effectiveWidth < 660;
  const rowHeight = isCompact ? 108 : 88;

  const margin = useMemo(
    () =>
      isCompact
        ? { top: 38, right: 12, bottom: 24, left: 8 }
        : { top: 44, right: 156, bottom: 28, left: 238 },
    [isCompact]
  );

  const chartHeight =
    margin.top + margin.bottom + Math.max(1, orderedProjects.length) * rowHeight;

  // Compute dynamic time domain & tick granularity based on active filtered projects
  const { domainStart, domainEnd, spanMonths } = useMemo(() => {
    if (orderedProjects.length === 0) {
      const fallbackStart = new Date(2022, 11, 1);
      const fallbackEnd = new Date(2026, 11, 15);
      return {
        domainStart: fallbackStart,
        domainEnd: fallbackEnd,
        spanMonths: 48,
      };
    }

    let minDate = parseMonthDate(orderedProjects[0].timeline.startDate);
    let maxDate = parseMonthDate(orderedProjects[0].timeline.endDate);

    for (const project of orderedProjects) {
      const s = parseMonthDate(project.timeline.startDate);
      const e = parseMonthDate(project.timeline.endDate);
      if (s < minDate) minDate = s;
      if (e > maxDate) maxDate = e;
    }

    const rawSpan = Math.max(1, diffMonths(minDate, maxDate));
    const padBefore = rawSpan <= 12 ? 1 : 1;
    const padAfter = rawSpan <= 12 ? 1 : 2;
    const start = addMonths(minDate, -padBefore);
    const end = addMonths(maxDate, padAfter);

    return {
      domainStart: start,
      domainEnd: end,
      spanMonths: Math.max(2, diffMonths(start, end)),
    };
  }, [orderedProjects]);

  // Effect 1: Build D3 scales, grid, axis, and project tracks cleanly on data/filter/resize updates
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || orderedProjects.length === 0 || containerWidth <= 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const innerWidth = Math.max(160, effectiveWidth - margin.left - margin.right);

    const xScale = d3
      .scaleTime()
      .domain([domainStart, domainEnd])
      .range([margin.left, margin.left + innerWidth]);

    const yScale = d3
      .scaleBand<ProjectId>()
      .domain(orderedProjects.map((p) => p.id))
      .range([margin.top, chartHeight - margin.bottom])
      .padding(isCompact ? 0.24 : 0.3);

    const maxLayers = Math.max(
      6,
      ...orderedProjects.map((p) => p.timeline.stackLayers.length)
    );
    const barThicknessScale = d3
      .scaleLinear()
      .domain([1, maxLayers])
      .range([14, isCompact ? 34 : 42]);

    const tickInterval = isCompact
      ? spanMonths <= 12
        ? d3.timeMonth.every(2)!
        : spanMonths <= 24
          ? d3.timeMonth.every(6)!
          : d3.timeYear.every(1)!
      : spanMonths <= 10
        ? d3.timeMonth.every(1)!
        : spanMonths <= 22
          ? d3.timeMonth.every(3)!
          : d3.timeMonth.every(6)!;

    let tickDates = xScale.ticks(tickInterval);
    if (tickDates.length < 2) {
      tickDates = [domainStart, domainEnd];
    }

    // 1. Hairline Grid Layer
    const gridGroup = svg.append('g').attr('class', 'grid-layer');

    gridGroup
      .selectAll('line.v-grid')
      .data(tickDates)
      .enter()
      .append('line')
      .attr('class', 'v-grid text-[#E5E5E5] dark:text-[#262626]')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', margin.top)
      .attr('y2', chartHeight - margin.bottom)
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 4');

    gridGroup
      .selectAll('line.h-lane')
      .data(orderedProjects)
      .enter()
      .append('line')
      .attr('class', 'h-lane text-[#E5E5E5]/80 dark:text-[#262626]/80')
      .attr('x1', 0)
      .attr('x2', effectiveWidth)
      .attr('y1', (d) => (yScale(d.id) ?? 0) + yScale.bandwidth() + (isCompact ? 10 : 12))
      .attr('y2', (d) => (yScale(d.id) ?? 0) + yScale.bandwidth() + (isCompact ? 10 : 12))
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1);

    // 2. Top Time Axis (D3 axisTop)
    const axisFormat = d3.timeFormat(
      isCompact && spanMonths > 24 ? '%Y' : "%b '%y"
    );
    const xAxis = d3
      .axisTop(xScale)
      .tickValues(tickDates)
      .tickFormat((d) => axisFormat(d as Date))
      .tickSize(6);

    const axisGroup = svg
      .append('g')
      .attr('transform', `translate(0, ${margin.top - 4})`)
      .call(xAxis);

    axisGroup
      .select('.domain')
      .classed('text-[#E5E5E5] dark:text-[#262626]', true)
      .attr('stroke', 'currentColor');

    axisGroup
      .selectAll('.tick line')
      .classed('text-[#A3A3A3] dark:text-[#525252]', true)
      .attr('stroke', 'currentColor');

    axisGroup
      .selectAll('.tick text')
      .attr('fill', null)
      .classed('fill-[#525252] dark:fill-[#A3A3A3]', true)
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '11px')
      .style('font-variant-numeric', 'tabular-nums');

    // 3. Hover Crosshair Guide Line
    const guideLine = svg
      .append('line')
      .attr('class', 'hover-guide text-[#FF721A]/55')
      .attr('y1', margin.top)
      .attr('y2', chartHeight - margin.bottom)
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 3')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    // 4. Project Rows Layer
    const rowsGroup = svg.append('g').attr('class', 'rows-layer');

    orderedProjects.forEach((project, idx) => {
      const bandTop = yScale(project.id) ?? margin.top;
      const bandHeight = yScale.bandwidth();
      const startX = xScale(parseMonthDate(project.timeline.startDate));
      const endX = xScale(parseMonthDate(project.timeline.endDate));
      const barWidth = Math.max(24, endX - startX);
      const layers = project.timeline.stackLayers;
      const barHeight = barThicknessScale(layers.length);
      const barY = isCompact
        ? bandTop + bandHeight - barHeight - 2
        : bandTop + (bandHeight - barHeight) / 2;

      const row = rowsGroup
        .append('g')
        .attr('class', 'project-row cursor-pointer focus:outline-none')
        .attr('data-project-id', project.id)
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr(
          'aria-label',
          `${project.title}: ${project.timeline.durationLabel}, ${layers.length} stack layers. Press Enter to open case study.`
        )
        .style('transition', 'opacity 180ms ease')
        .on('mouseenter', () => {
          setSelectedId(project.id);
          guideLine
            .attr('x1', startX)
            .attr('x2', startX)
            .style('opacity', 1);
        })
        .on('focus', () => {
          setSelectedId(project.id);
          guideLine
            .attr('x1', startX)
            .attr('x2', startX)
            .style('opacity', 1);
        })
        .on('mouseleave', () => {
          guideLine.style('opacity', 0);
          setHoveredLayerIndex(null);
        })
        .on('blur', () => {
          guideLine.style('opacity', 0);
        })
        .on('click', () => {
          setSelectedId(project.id);
          onOpenProjectRef.current(project.id);
        })
        .on('keydown', (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenProjectRef.current(project.id);
          }
        });

      // Invisible hit target across full lane
      row
        .append('rect')
        .attr('x', 0)
        .attr('y', bandTop - 4)
        .attr('width', effectiveWidth)
        .attr('height', bandHeight + 8)
        .attr('fill', 'transparent');

      // Labels
      if (isCompact) {
        row
          .append('text')
          .attr('x', margin.left)
          .attr('y', bandTop + 14)
          .attr('class', 'fill-[#0A0A0A] dark:fill-white')
          .style('font-family', 'var(--font-display)')
          .style('font-size', '13px')
          .style('font-weight', '700')
          .text(`${project.indexNumber}. ${project.title}`);

        row
          .append('text')
          .attr('x', effectiveWidth - margin.right)
          .attr('y', bandTop + 14)
          .attr('text-anchor', 'end')
          .attr('class', 'row-duration-label fill-[#525252] dark:fill-[#A3A3A3]')
          .attr('data-project-id', project.id)
          .style('font-family', 'var(--font-mono)')
          .style('font-size', '11px')
          .style('font-variant-numeric', 'tabular-nums')
          .text(`${project.timeline.durationLabel} · ${layers.length} layers`);
      } else {
        row
          .append('text')
          .attr('x', 0)
          .attr('y', bandTop + bandHeight / 2 - 4)
          .attr('class', 'fill-[#C94B00] dark:fill-[#FF721A]')
          .style('font-family', 'var(--font-mono)')
          .style('font-size', '11px')
          .style('font-weight', '600')
          .style('font-variant-numeric', 'tabular-nums')
          .text(project.indexNumber);

        row
          .append('text')
          .attr('x', 24)
          .attr('y', bandTop + bandHeight / 2 - 4)
          .attr('class', 'fill-[#0A0A0A] dark:fill-white')
          .style('font-family', 'var(--font-display)')
          .style('font-size', '14px')
          .style('font-weight', '700')
          .text(project.title);

        row
          .append('text')
          .attr('x', 24)
          .attr('y', bandTop + bandHeight / 2 + 13)
          .attr('class', 'fill-[#525252] dark:fill-[#A3A3A3]')
          .style('font-family', 'var(--font-sans)')
          .style('font-size', '11px')
          .text(project.discipline);
      }

      // Baseline rail across active domain
      row
        .append('line')
        .attr('x1', margin.left)
        .attr('x2', margin.left + innerWidth)
        .attr('y1', barY + barHeight / 2)
        .attr('y2', barY + barHeight / 2)
        .attr('class', 'text-[#E5E5E5] dark:text-[#262626]')
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 1);

      // Static rounded-corner clipPath (full target barWidth) so browsers never stall repaints
      const clipId = `timeline-clip-${chartUid}-${project.id}`;
      defs
        .append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('x', startX)
        .attr('y', barY)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('width', barWidth)
        .attr('height', barHeight);

      // Segmented Stack Complexity Layers inside Bar (width animated directly)
      const barGroup = row.append('g').attr('clip-path', `url(#${clipId})`);
      const layerSliceHeight = barHeight / layers.length;

      layers.forEach((_, layerIdx) => {
        const slice = barGroup
          .append('rect')
          .attr('class', 'stack-slice fill-[#0A0A0A] dark:fill-white transition-opacity duration-150')
          .attr('data-project-id', project.id)
          .attr('data-layer-idx', String(layerIdx))
          .attr('data-layer-total', String(layers.length))
          .attr('x', startX)
          .attr('y', barY + layerIdx * layerSliceHeight)
          .attr('width', prefersReducedMotion ? barWidth : 0)
          .attr('height', Math.max(1.5, layerSliceHeight - 1))
          .on('mouseenter', () => {
            setSelectedId(project.id);
            setHoveredLayerIndex(layerIdx);
          })
          .on('mouseleave', () => {
            setHoveredLayerIndex(null);
          });

        if (!prefersReducedMotion) {
          slice
            .transition()
            .duration(580)
            .delay(idx * 80 + layerIdx * 24)
            .ease(d3.easeCubicOut)
            .attr('width', barWidth);
        }
      });

      // Outer Frame Outline
      const outline = row
        .append('rect')
        .attr('class', 'bar-outline stroke-[#0A0A0A]/25 dark:stroke-white/25')
        .attr('data-project-id', project.id)
        .attr('x', startX)
        .attr('y', barY)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('height', barHeight)
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .attr('width', prefersReducedMotion ? barWidth : 0);

      if (!prefersReducedMotion) {
        outline
          .transition()
          .duration(580)
          .delay(idx * 80)
          .ease(d3.easeCubicOut)
          .attr('width', barWidth);
      }

      // Start Registration Square Tick
      row
        .append('rect')
        .attr('x', startX - 2.5)
        .attr('y', barY + barHeight / 2 - 2.5)
        .attr('width', 5)
        .attr('height', 5)
        .attr('fill', '#FF721A');

      // Right Annotation (Desktop)
      if (!isCompact) {
        const labelGroup = row
          .append('g')
          .style('opacity', prefersReducedMotion ? 1 : 0);

        labelGroup
          .append('text')
          .attr('x', endX + 12)
          .attr('y', barY + barHeight / 2 - 2)
          .attr('class', 'row-duration-label fill-[#0A0A0A] dark:fill-white')
          .attr('data-project-id', project.id)
          .style('font-family', 'var(--font-mono)')
          .style('font-size', '11px')
          .style('font-weight', '600')
          .style('font-variant-numeric', 'tabular-nums')
          .text(project.timeline.durationLabel);

        labelGroup
          .append('text')
          .attr('x', endX + 12)
          .attr('y', barY + barHeight / 2 + 12)
          .attr('class', 'fill-[#525252] dark:fill-[#A3A3A3]')
          .style('font-family', 'var(--font-mono)')
          .style('font-size', '10px')
          .style('font-variant-numeric', 'tabular-nums')
          .text(`${layers.length} stack layers`);

        if (!prefersReducedMotion) {
          labelGroup
            .transition()
            .duration(340)
            .delay(idx * 80 + 260)
            .style('opacity', 1);
        }
      }
    });

    return () => {
      svg.selectAll('*').interrupt();
    };
  }, [
    orderedProjects,
    containerWidth,
    effectiveWidth,
    chartHeight,
    margin,
    isCompact,
    domainStart,
    domainEnd,
    spanMonths,
    prefersReducedMotion,
    chartUid,
  ]);

  // Effect 2: Instantaneous 60fps hover/selection styling without restarting bar transitions
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || containerWidth <= 0) return;

    const svg = d3.select(svgEl);

    svg
      .selectAll<SVGGElement, unknown>('.project-row')
      .style('opacity', function () {
        const rowId = this.getAttribute('data-project-id');
        return !activeId || rowId === activeId ? 1 : 0.6;
      });

    svg
      .selectAll<SVGRectElement, unknown>('.stack-slice')
      .attr('class', function () {
        const rowId = this.getAttribute('data-project-id');
        return rowId === activeId
          ? 'stack-slice fill-[#FF721A] transition-opacity duration-150'
          : 'stack-slice fill-[#0A0A0A] dark:fill-white transition-opacity duration-150';
      })
      .style('opacity', function () {
        const rowId = this.getAttribute('data-project-id');
        const layerIdx = Number(this.getAttribute('data-layer-idx') ?? 0);
        const total = Math.max(1, Number(this.getAttribute('data-layer-total') ?? 1));
        const isRowActive = rowId === activeId;
        const isSliceHovered = isRowActive && hoveredLayerIndex === layerIdx;
        if (isRowActive) {
          return isSliceHovered ? 1 : 0.68 + (layerIdx / total) * 0.26;
        }
        return 0.22 + (layerIdx / total) * 0.24;
      });

    svg
      .selectAll<SVGRectElement, unknown>('.bar-outline')
      .attr('class', function () {
        const rowId = this.getAttribute('data-project-id');
        return rowId === activeId
          ? 'bar-outline stroke-[#C94B00] dark:stroke-[#FF721A]'
          : 'bar-outline stroke-[#0A0A0A]/25 dark:stroke-white/25';
      })
      .attr('stroke-width', function () {
        const rowId = this.getAttribute('data-project-id');
        return rowId === activeId ? 1.5 : 1;
      });

    svg
      .selectAll<SVGTextElement, unknown>('.row-duration-label')
      .attr('class', function () {
        const rowId = this.getAttribute('data-project-id');
        return rowId === activeId
          ? 'row-duration-label fill-[#C94B00] dark:fill-[#FF721A]'
          : 'row-duration-label fill-[#0A0A0A] dark:fill-white';
      });
  }, [activeId, hoveredLayerIndex, orderedProjects, containerWidth]);

  if (orderedProjects.length === 0) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: ARTCRAFT_EASE }}
        className="mt-8 sm:mt-12 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] px-6 py-12 text-center"
      >
        <p className="font-mono text-xs text-[#C94B00] dark:text-[#FF721A]">
          No Matching Timeline Tracks
        </p>
        <p className="mt-2 text-sm text-[#525252] dark:text-[#A3A3A3]">
          Select another discipline filter to plot matching project durations and stack layers.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: 18, filter: 'blur(6px)' }
      }
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: -12, filter: 'blur(4px)' }
      }
      transition={{ duration: 0.36, ease: ARTCRAFT_EASE }}
      className="mt-8 sm:mt-12 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] overflow-hidden"
    >
      {/* Visual Legend Header */}
      <div className="px-5 sm:px-7 py-4 border-b border-[#E5E5E5] dark:border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#525252] dark:text-[#A3A3A3]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
          <span className="inline-flex items-center gap-2 text-[#0A0A0A] dark:text-white font-semibold">
            <span className="w-2 h-2 bg-[#FF721A]" aria-hidden="true" />
            <span>Width = Development Duration</span>
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-[#A3A3A3]">
            ·
          </span>
          <span>Thickness &amp; Slices = Stack Complexity (Verified Layers)</span>
        </div>

        <span className="font-mono text-[11px] tabular-nums text-[#737373] dark:text-[#A3A3A3]">
          {activeFilterLabel ? `${activeFilterLabel} · ` : ''}
          {String(orderedProjects.length).padStart(2, '0')} Project
          {orderedProjects.length === 1 ? '' : 's'} Plotted
        </span>
      </div>

      {/* Responsive D3 Horizontal Chart Canvas */}
      <div className="px-4 sm:px-7 pt-5 pb-4">
        <div ref={containerRef} className="w-full min-h-[160px]">
          {containerWidth > 0 && (
            <svg
              ref={svgRef}
              width={effectiveWidth}
              height={chartHeight}
              viewBox={`0 0 ${effectiveWidth} ${chartHeight}`}
              className="w-full h-auto block overflow-visible"
              role="region"
              aria-label="D3 horizontal project timeline and technology stack complexity chart"
            />
          )}
        </div>
      </div>

      {/* Active Project Stack Complexity Inspector */}
      {activeProject && (
        <div className="px-5 sm:px-7 py-5 sm:py-6 border-t border-[#E5E5E5] dark:border-[#262626] bg-white/80 dark:bg-black/45 space-y-5">
          {orderedProjects.length > 1 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-3 border-b border-[#E5E5E5] dark:border-[#262626]">
              <span className="font-mono text-[11px] text-[#737373]">
                Inspect Track:
              </span>
              {orderedProjects.map((proj) => {
                const isInspected = proj.id === activeProject.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(proj.id);
                      setHoveredLayerIndex(null);
                    }}
                    className={`min-h-[36px] py-1 text-xs font-mono border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
                      isInspected
                        ? 'border-[#FF721A] text-[#0A0A0A] dark:text-white font-semibold'
                        : 'border-transparent text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white'
                    }`}
                  >
                    {proj.indexNumber}. {proj.title}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-[#525252] dark:text-[#A3A3A3]">
                <span className="font-semibold text-[#C94B00] dark:text-[#FF721A]">
                  {activeProject.indexNumber}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {activeProject.timeline.startDate} →{' '}
                  {activeProject.timeline.isOngoing ? 'Present' : activeProject.timeline.endDate}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#0A0A0A] dark:text-white font-semibold">
                  {activeProject.timeline.durationLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeProject.timeline.stackLayers.length} Stack Layers</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A0A0A] dark:text-white">
                {activeProject.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onOpenProject(activeProject.id)}
              className="invert-block w-full md:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] text-sm font-semibold hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
            >
              <span>Read Case Study</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Segmented Layer Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
            {activeProject.timeline.stackLayers.map((layerItem, layerIdx) => {
              const isLayerActive = hoveredLayerIndex === layerIdx;
              return (
                <div
                  key={layerItem.layer}
                  onMouseEnter={() => setHoveredLayerIndex(layerIdx)}
                  onMouseLeave={() => setHoveredLayerIndex(null)}
                  className={`py-2.5 border-b transition-colors duration-150 ${
                    isLayerActive
                      ? 'border-[#FF721A]'
                      : 'border-[#E5E5E5]/75 dark:border-[#262626]/75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[#C94B00] dark:text-[#FF721A]">
                      L{String(layerIdx + 1).padStart(2, '0')} · {layerItem.layer}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs sm:text-sm text-[#0A0A0A] dark:text-[#E5E5E5]">
                    {layerItem.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
