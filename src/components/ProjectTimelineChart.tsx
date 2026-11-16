import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ProjectId, ProjectSummary } from '../data/portfolio';
import { ARTCRAFT_EASE } from './MotionPrimitives';

interface ProjectTimelineChartProps {
  projects: ProjectSummary[];
  onOpenProject: (id: ProjectId) => void;
}

function parseMonthDate(ym: string): Date {
  const [yearStr, monthStr] = ym.split('-');
  const year = Number(yearStr) || 2023;
  const month = (Number(monthStr) || 1) - 1;
  return new Date(year, month, 1);
}

export const ProjectTimelineChart: React.FC<ProjectTimelineChartProps> = ({
  projects,
  onOpenProject,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const rawUid = useId();
  const chartUid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const onOpenProjectRef = useRef(onOpenProject);
  onOpenProjectRef.current = onOpenProject;

  const [containerWidth, setContainerWidth] = useState<number>(920);
  const [selectedId, setSelectedId] = useState<ProjectId | null>(
    () => projects[0]?.id ?? null
  );
  const [hoveredLayerIndex, setHoveredLayerIndex] = useState<number | null>(null);

  // Order projects chronologically left-to-right across the timeline
  const orderedProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) =>
        parseMonthDate(a.timeline.startDate).getTime() -
        parseMonthDate(b.timeline.startDate).getTime()
    );
  }, [projects]);

  useEffect(() => {
    if (orderedProjects.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) =>
      prev && orderedProjects.some((p) => p.id === prev)
        ? prev
        : orderedProjects[0].id
    );
    setHoveredLayerIndex(null);
  }, [orderedProjects]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const measured = node.clientWidth || Math.floor(node.getBoundingClientRect().width);
      const nextWidth = Math.max(280, measured);
      setContainerWidth(nextWidth);
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeProject =
    orderedProjects.find((p) => p.id === selectedId) ?? orderedProjects[0] ?? null;
  const activeId = activeProject?.id ?? null;

  const isCompact = containerWidth < 660;
  const rowHeight = isCompact ? 106 : 86;
  const margin = useMemo(
    () =>
      isCompact
        ? { top: 38, right: 12, bottom: 24, left: 8 }
        : { top: 44, right: 156, bottom: 28, left: 238 },
    [isCompact]
  );

  const chartHeight =
    margin.top + margin.bottom + Math.max(1, orderedProjects.length) * rowHeight;

  // Effect 1: Build D3 axes, grid, bars, and run entry transitions only on data/resize changes
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || orderedProjects.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const innerWidth = Math.max(160, containerWidth - margin.left - margin.right);

    const domainStart = new Date(2022, 11, 1);
    const domainEnd = new Date(2026, 11, 15);

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
      .range([12, isCompact ? 34 : 42]);

    const tickDates = xScale.ticks(
      isCompact ? d3.timeYear.every(1)! : d3.timeMonth.every(6)!
    );

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
      .attr('x2', containerWidth)
      .attr('y1', (d) => (yScale(d.id) ?? 0) + yScale.bandwidth() + (isCompact ? 10 : 12))
      .attr('y2', (d) => (yScale(d.id) ?? 0) + yScale.bandwidth() + (isCompact ? 10 : 12))
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1);

    // 2. Top Time Axis (D3 axisTop)
    const axisFormat = d3.timeFormat(isCompact ? '%Y' : "%b '%y");
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
      const barWidth = Math.max(20, endX - startX);
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
        .attr('width', containerWidth)
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
          .attr('x', containerWidth - margin.right)
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

      // Animated Clip-Path for Horizontal Duration Growth
      const clipId = `timeline-clip-${chartUid}-${project.id}`;
      const clipRect = defs
        .append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('x', startX)
        .attr('y', barY)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('width', prefersReducedMotion ? barWidth : 0)
        .attr('height', barHeight);

      if (!prefersReducedMotion) {
        clipRect
          .transition()
          .duration(650)
          .delay(idx * 95)
          .ease(d3.easeCubicOut)
          .attr('width', barWidth);
      }

      // Segmented Stack Complexity Layers inside Bar
      const barGroup = row.append('g').attr('clip-path', `url(#${clipId})`);
      const layerSliceHeight = barHeight / layers.length;

      layers.forEach((_, layerIdx) => {
        barGroup
          .append('rect')
          .attr('class', 'stack-slice transition-opacity duration-150')
          .attr('data-project-id', project.id)
          .attr('data-layer-idx', String(layerIdx))
          .attr('data-layer-total', String(layers.length))
          .attr('x', startX)
          .attr('y', barY + layerIdx * layerSliceHeight)
          .attr('width', barWidth)
          .attr('height', Math.max(1, layerSliceHeight - 1))
          .on('mouseenter', () => {
            setSelectedId(project.id);
            setHoveredLayerIndex(layerIdx);
          })
          .on('mouseleave', () => {
            setHoveredLayerIndex(null);
          });
      });

      // Outer Frame Outline
      const outline = row
        .append('rect')
        .attr('class', 'bar-outline')
        .attr('data-project-id', project.id)
        .attr('x', startX)
        .attr('y', barY)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('height', barHeight)
        .attr('fill', 'none')
        .attr('width', prefersReducedMotion ? barWidth : 0);

      if (!prefersReducedMotion) {
        outline
          .transition()
          .duration(650)
          .delay(idx * 95)
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
            .duration(360)
            .delay(idx * 95 + 320)
            .style('opacity', 1);
        }
      }
    });
  }, [
    orderedProjects,
    containerWidth,
    chartHeight,
    margin,
    isCompact,
    prefersReducedMotion,
    chartUid,
  ]);

  // Effect 2: Instantaneous 60fps hover/selection updates without re-triggering bar reveal animation
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

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
        return 0.2 + (layerIdx / total) * 0.25;
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
    return null;
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
      transition={{ duration: 0.42, ease: ARTCRAFT_EASE }}
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

        <span className="font-mono text-[11px] tabular-nums text-[#737373]">
          {String(orderedProjects.length).padStart(2, '0')} Projects Plotted
        </span>
      </div>

      {/* Responsive D3 Horizontal Chart Canvas */}
      <div className="px-4 sm:px-7 pt-5 pb-4">
        <div ref={containerRef} className="w-full">
          <svg
            ref={svgRef}
            width={containerWidth}
            height={chartHeight}
            viewBox={`0 0 ${containerWidth} ${chartHeight}`}
            className="w-full h-auto block overflow-visible"
            role="region"
            aria-label="D3 horizontal project timeline and technology stack complexity chart"
          />
        </div>
      </div>

      {/* Active Project Stack Complexity Inspector */}
      {activeProject && (
        <div className="px-5 sm:px-7 py-5 sm:py-6 border-t border-[#E5E5E5] dark:border-[#262626] bg-white/80 dark:bg-black/45 space-y-5">
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
