import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { ProjectId } from '../data/portfolio';
import { useLanguage } from './LanguageProvider';

type CompetencyAxisKey =
  | 'systemsArch'
  | 'frontendUi'
  | 'visualDesign'
  | 'rfTelemetry'
  | 'sensorsDsp'
  | 'embeddedFirmware';

type CategoryNameKey =
  | 'visualVector'
  | 'frontendMotion'
  | 'architectureCraft'
  | 'embeddedActuation'
  | 'sensorsVision'
  | 'commsOperator'
  | 'rfCompute'
  | 'inertialDsp'
  | 'simulationFirmware';

interface StackCategoryGroup {
  id: string;
  titleKey: CategoryNameKey;
  axis: CompetencyAxisKey;
  tags: string[];
}

interface ProjectCompetencyProfile {
  scores: Record<CompetencyAxisKey, number>;
  categories: StackCategoryGroup[];
}

const AXES_ORDER: CompetencyAxisKey[] = [
  'systemsArch',
  'frontendUi',
  'visualDesign',
  'rfTelemetry',
  'sensorsDsp',
  'embeddedFirmware',
];

const PROJECT_COMPETENCIES: Record<ProjectId, ProjectCompetencyProfile> = {
  creative: {
    scores: {
      systemsArch: 94,
      frontendUi: 96,
      visualDesign: 98,
      rfTelemetry: 32,
      sensorsDsp: 42,
      embeddedFirmware: 38,
    },
    categories: [
      {
        id: 'creative-visual',
        titleKey: 'visualVector',
        axis: 'visualDesign',
        tags: ['Adobe Illustrator', 'Affinity Designer', 'Bezier Architecture', 'Brand Systems'],
      },
      {
        id: 'creative-frontend',
        titleKey: 'frontendMotion',
        axis: 'frontendUi',
        tags: ['React', 'TypeScript', 'Tailwind CSS', 'Motion Springs'],
      },
      {
        id: 'creative-arch',
        titleKey: 'architectureCraft',
        axis: 'systemsArch',
        tags: ['Editorial Grid', 'WCAG AA Contrast', 'Reduced Motion'],
      },
    ],
  },
  robot: {
    scores: {
      systemsArch: 84,
      frontendUi: 58,
      visualDesign: 48,
      rfTelemetry: 88,
      sensorsDsp: 90,
      embeddedFirmware: 95,
    },
    categories: [
      {
        id: 'robot-embedded',
        titleKey: 'embeddedActuation',
        axis: 'embeddedFirmware',
        tags: ['Arduino', 'Raspberry Pi', 'L298N H-Bridge', 'Embedded C', 'PWM Traction'],
      },
      {
        id: 'robot-sensors',
        titleKey: 'sensorsVision',
        axis: 'sensorsDsp',
        tags: ['Night-Vision Optics', 'Ultrasonic Array', 'IR Proximity', 'OpenCV'],
      },
      {
        id: 'robot-comms',
        titleKey: 'commsOperator',
        axis: 'rfTelemetry',
        tags: ['RF Transceiver', 'Wi-Fi Stream', 'Python Telemetry'],
      },
    ],
  },
  geolocation: {
    scores: {
      systemsArch: 86,
      frontendUi: 52,
      visualDesign: 44,
      rfTelemetry: 97,
      sensorsDsp: 96,
      embeddedFirmware: 92,
    },
    categories: [
      {
        id: 'geo-rf',
        titleKey: 'rfCompute',
        axis: 'rfTelemetry',
        tags: ['ESP32', 'SX1278 LoRa', 'Sub-GHz Beacons', 'OLED 0.96"'],
      },
      {
        id: 'geo-dsp',
        titleKey: 'inertialDsp',
        axis: 'sensorsDsp',
        tags: ['Kalman Filter', 'MPU6050 IMU', 'HMC5883L Compass', 'RSSI Path-Loss'],
      },
      {
        id: 'geo-sim',
        titleKey: 'simulationFirmware',
        axis: 'embeddedFirmware',
        tags: ['MATLAB', 'Python', 'Arduino IDE', 'Proteus'],
      },
    ],
  },
};

// Overall cross-project peak proficiency per axis for optional envelope comparison
const PORTFOLIO_ENVELOPE: number[] = AXES_ORDER.map((axis) =>
  Math.max(
    PROJECT_COMPETENCIES.creative.scores[axis],
    PROJECT_COMPETENCIES.robot.scores[axis],
    PROJECT_COMPETENCIES.geolocation.scores[axis]
  )
);

const SVG_W = 420;
const SVG_H = 300;
const CX = 210;
const CY = 150;
const RADIUS = 82;
const RING_LEVELS = [0.25, 0.5, 0.75, 1.0];

function getAxisPoint(index: number, normalizedRadius: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / AXES_ORDER.length;
  return {
    x: CX + Math.cos(angle) * RADIUS * normalizedRadius,
    y: CY + Math.sin(angle) * RADIUS * normalizedRadius,
  };
}

function buildPolygonPoints(values: number[]): string {
  return values
    .map((val, idx) => {
      const pt = getAxisPoint(idx, Math.max(0, Math.min(1, val / 100)));
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');
}

interface CaseStudyRadarStackProps {
  projectId: ProjectId;
  prefersReducedMotion: boolean;
}

export const CaseStudyRadarStack: React.FC<CaseStudyRadarStackProps> = ({
  projectId,
  prefersReducedMotion,
}) => {
  const { t } = useLanguage();
  const profile = PROJECT_COMPETENCIES[projectId] ?? PROJECT_COMPETENCIES.creative;

  const targetScores = useMemo(
    () => AXES_ORDER.map((axis) => profile.scores[axis]),
    [profile]
  );

  const [displayScores, setDisplayScores] = useState<number[]>(targetScores);
  const currentScoresRef = useRef<number[]>(targetScores);
  const [hoveredAxis, setHoveredAxis] = useState<CompetencyAxisKey | null>(null);
  const [pinnedAxis, setPinnedAxis] = useState<CompetencyAxisKey | null>(null);
  const [showEnvelope, setShowEnvelope] = useState(true);

  const activeAxis = hoveredAxis ?? pinnedAxis;

  useEffect(() => {
    setHoveredAxis(null);
    setPinnedAxis(null);
  }, [projectId]);

  // Smoothly morph radar polygon vertices on project switch (zero loop when idle)
  useEffect(() => {
    if (prefersReducedMotion) {
      currentScoresRef.current = targetScores;
      setDisplayScores(targetScores);
      return;
    }

    const from = currentScoresRef.current.slice();
    const startTime = performance.now();
    const duration = 320;
    let rafId = 0;

    const step = (now: number) => {
      const tNorm = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - tNorm, 3);
      const next = targetScores.map((target, idx) => {
        const base = from[idx] ?? target;
        return base + (target - base) * eased;
      });
      currentScoresRef.current = next;
      setDisplayScores(next);
      if (tNorm < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [targetScores, prefersReducedMotion]);

  const activePolygonPoints = buildPolygonPoints(displayScores);
  const envelopePolygonPoints = useMemo(
    () => buildPolygonPoints(PORTFOLIO_ENVELOPE),
    []
  );

  const handleAxisSelect = (axis: CompetencyAxisKey) => {
    const next = pinnedAxis === axis ? null : axis;
    setPinnedAxis(next);
  };

  return (
    <section
      aria-label={t.caseStudy.competency.title}
      className="p-5 sm:p-6 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#C94B00] dark:text-[#FF721A]">
            <span className="inline-block w-3.5 h-[2px] bg-[#FF721A]" aria-hidden="true" />
            <span>{t.caseStudy.competency.eyebrow}</span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#0A0A0A] dark:text-white">
            {t.caseStudy.competency.title}
          </h2>
          <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
            {t.caseStudy.competency.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowEnvelope((prev) => !prev)}
          aria-pressed={showEnvelope}
          className={`inline-flex items-center gap-2 self-start sm:self-center min-h-[34px] px-3 py-1.5 rounded-lg border font-mono text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
            showEnvelope
              ? 'border-[#FF721A] bg-[#FF721A]/10 text-[#C94B00] dark:text-[#FF721A]'
              : 'border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414] text-[#525252] dark:text-[#A3A3A3] hover:border-[#FF721A]'
          }`}
        >
          <Layers size={13} aria-hidden="true" />
          <span>{t.caseStudy.competency.envelopeToggle}</span>
        </button>
      </div>

      {/* Main Split: Interactive SVG Radar + Categorized Tag Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: SVG 6-Axis Radar Chart */}
        <div className="lg:col-span-6 p-3 sm:p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#111111]">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label={t.caseStudy.competency.radarAria}
            className="w-full h-auto max-h-[290px] overflow-visible select-none"
          >
            {/* Concentric Hexagonal Grid Rings */}
            {RING_LEVELS.map((lvl) => (
              <polygon
                key={lvl}
                points={AXES_ORDER.map((_, idx) => {
                  const pt = getAxisPoint(idx, lvl);
                  return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                }).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth={lvl === 1 ? 1.15 : 0.85}
                strokeDasharray={lvl < 1 ? '3 4' : undefined}
                className="text-[#E5E5E5] dark:text-[#262626]"
              />
            ))}

            {/* Axis Spokes */}
            {AXES_ORDER.map((axis, idx) => {
              const outer = getAxisPoint(idx, 1);
              const isHighlighted = activeAxis === axis;
              return (
                <line
                  key={axis}
                  x1={CX}
                  y1={CY}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={isHighlighted ? '#FF721A' : 'currentColor'}
                  strokeWidth={isHighlighted ? 1.5 : 0.9}
                  className={
                    isHighlighted ? '' : 'text-[#E5E5E5] dark:text-[#262626]'
                  }
                />
              );
            })}

            {/* Scale Ring Reference Readouts along Top Spoke */}
            {[50, 100].map((tick) => {
              const pt = getAxisPoint(0, tick / 100);
              return (
                <text
                  key={tick}
                  x={pt.x + 6}
                  y={pt.y + 3}
                  className="fill-[#737373] dark:fill-[#737373] font-mono text-[8.5px]"
                >
                  {tick}
                </text>
              );
            })}

            {/* Portfolio Overall Footprint Envelope (dashed polygon) */}
            {showEnvelope && (
              <polygon
                points={envelopePolygonPoints}
                fill="rgba(163, 163, 163, 0.06)"
                stroke="currentColor"
                strokeWidth={1.15}
                strokeDasharray="4 4"
                className="text-[#737373] dark:text-[#525252] transition-opacity duration-200"
              />
            )}

            {/* Active Project Competency Polygon */}
            <polygon
              points={activePolygonPoints}
              fill="rgba(255, 114, 26, 0.16)"
              stroke="#FF721A"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Interactive Axis Vertices & Labels */}
            {AXES_ORDER.map((axis, idx) => {
              const value = Math.round(displayScores[idx] ?? 0);
              const targetValue = profile.scores[axis];
              const pt = getAxisPoint(idx, Math.max(0, Math.min(1, (displayScores[idx] ?? 0) / 100)));
              const labelPt = getAxisPoint(idx, 1.24);
              const isHighlighted = activeAxis === axis;

              let textAnchor: 'start' | 'middle' | 'end' = 'middle';
              let dyOffset = 0;
              if (idx === 0) {
                textAnchor = 'middle';
                dyOffset = -6;
              } else if (idx === 3) {
                textAnchor = 'middle';
                dyOffset = 10;
              } else if (idx === 1 || idx === 2) {
                textAnchor = 'start';
                dyOffset = idx === 1 ? -1 : 5;
              } else {
                textAnchor = 'end';
                dyOffset = idx === 5 ? -1 : 5;
              }

              const axisLabel = t.caseStudy.competency.axes[axis];

              return (
                <g
                  key={axis}
                  role="button"
                  tabIndex={0}
                  aria-pressed={pinnedAxis === axis}
                  aria-label={`${axisLabel}: ${targetValue}%`}
                  onMouseEnter={() => setHoveredAxis(axis)}
                  onMouseLeave={() => setHoveredAxis((prev) => (prev === axis ? null : prev))}
                  onFocus={() => setHoveredAxis(axis)}
                  onBlur={() => setHoveredAxis((prev) => (prev === axis ? null : prev))}
                  onClick={() => handleAxisSelect(axis)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAxisSelect(axis);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {/* Active Halo Ring on Vertex */}
                  {isHighlighted && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={7.5}
                      fill="rgba(255, 114, 26, 0.22)"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHighlighted ? 4.4 : 3.4}
                    fill={isHighlighted ? '#FD6701' : '#FF721A'}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="text-white dark:text-[#111111]"
                  />

                  <text
                    x={labelPt.x}
                    y={labelPt.y + dyOffset}
                    textAnchor={textAnchor}
                    className={`font-sans text-[10.5px] font-semibold transition-colors ${
                      isHighlighted
                        ? 'fill-[#C94B00] dark:fill-[#FF721A]'
                        : 'fill-[#0A0A0A] dark:fill-white'
                    }`}
                  >
                    <tspan x={labelPt.x}>{axisLabel}</tspan>
                    <tspan
                      x={labelPt.x}
                      dy="13"
                      className={`font-mono text-[10px] font-bold ${
                        isHighlighted
                          ? 'fill-[#C94B00] dark:fill-[#FF721A]'
                          : 'fill-[#737373] dark:fill-[#A3A3A3]'
                      }`}
                    >
                      {value}%
                    </tspan>
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Compact Legend Bar */}
          <div className="mt-2 pt-2.5 border-t border-[#E5E5E5] dark:border-[#262626] flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#0A0A0A] dark:text-white">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FF721A]" aria-hidden="true" />
                {t.caseStudy.competency.activeLegend}
              </span>
              {showEnvelope && (
                <span className="inline-flex items-center gap-1.5 text-[#525252] dark:text-[#A3A3A3]">
                  <span
                    className="w-3 h-0 border-t border-dashed border-[#737373] dark:border-[#737373]"
                    aria-hidden="true"
                  />
                  {t.caseStudy.competency.envelopeLegend}
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-[#737373] dark:text-[#737373]">
              0 — 100%
            </span>
          </div>
        </div>

        {/* Right: Category-Based Tech Stack Tag Cloud */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-semibold text-[#0A0A0A] dark:text-white">
              {t.caseStudy.competency.stackHeading}
            </h3>
            <span className="text-[11px] text-[#737373] dark:text-[#737373] truncate">
              {t.caseStudy.competency.focusHint}
            </span>
          </div>

          <div className="space-y-2.5">
            {profile.categories.map((group) => {
              const axisScore = profile.scores[group.axis];
              const isSelected = activeAxis === group.axis;

              return (
                <div
                  key={group.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={pinnedAxis === group.axis}
                  onMouseEnter={() => setHoveredAxis(group.axis)}
                  onMouseLeave={() =>
                    setHoveredAxis((prev) => (prev === group.axis ? null : prev))
                  }
                  onFocus={() => setHoveredAxis(group.axis)}
                  onBlur={() =>
                    setHoveredAxis((prev) => (prev === group.axis ? null : prev))
                  }
                  onClick={() => handleAxisSelect(group.axis)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAxisSelect(group.axis);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
                    isSelected
                      ? 'border-[#FF721A] bg-white dark:bg-[#141414]'
                      : 'border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#111111] hover:border-[#FF721A]/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-semibold text-[#0A0A0A] dark:text-white">
                      {t.caseStudy.competency.categories[group.titleKey]}
                    </span>
                    <div className="inline-flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] tabular-nums font-bold text-[#C94B00] dark:text-[#FF721A]">
                        {axisScore}%
                      </span>
                    </div>
                  </div>

                  {/* Thin Proportional Competency Bar */}
                  <div
                    aria-hidden="true"
                    className="h-1 w-full rounded-full bg-[#F0F0F0] dark:bg-[#1F1F1F] overflow-hidden mb-3"
                  >
                    <div
                      className="h-full bg-[#FF721A] transition-all duration-300"
                      style={{ width: `${axisScore}%` }}
                    />
                  </div>

                  {/* Categorized Architectural Stack Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2.5 py-1 rounded-md border font-mono text-[11px] font-medium transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'border-[#FF721A]/50 bg-[#FF721A]/10 text-[#0A0A0A] dark:text-white'
                            : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#525252] dark:text-[#A3A3A3]'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
