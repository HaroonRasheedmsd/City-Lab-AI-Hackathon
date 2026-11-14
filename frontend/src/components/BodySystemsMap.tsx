import React from 'react';
import {
  ShieldAlert,
  Info,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import type { ClassificationResult, ClassificationStatus } from '../types';
import {
  ORGAN_SYSTEMS,
  mapTestToOrgan,
  type OrganSystemKey,
} from '../types/organSystems';

interface BodySystemsMapProps {
  results: ClassificationResult[];
  selectedOrgan: OrganSystemKey | null;
  onSelectOrgan: (organKey: OrganSystemKey | null) => void;
  selectedTestCanonical?: string | null;
}

export const BodySystemsMap: React.FC<BodySystemsMapProps> = ({
  results,
  selectedOrgan,
  onSelectOrgan,
  selectedTestCanonical,
}) => {
  // If a test is selected in the parent, determine which organ it maps to
  const activeOrganFromTest = selectedTestCanonical
    ? mapTestToOrgan(selectedTestCanonical, '')
    : null;

  const currentHighlightedOrgan = selectedOrgan || activeOrganFromTest;

  // Calculate highest severity per organ
  const organStatusMap: Record<
    OrganSystemKey,
    {
      tests: ClassificationResult[];
      highestStatus: ClassificationStatus | 'NONE';
      hasUrgent: boolean;
      hasAbnormal: boolean;
    }
  > = {
    thyroid: { tests: [], highestStatus: 'NONE', hasUrgent: false, hasAbnormal: false },
    heart: { tests: [], highestStatus: 'NONE', hasUrgent: false, hasAbnormal: false },
    liver: { tests: [], highestStatus: 'NONE', hasUrgent: false, hasAbnormal: false },
    pancreas: { tests: [], highestStatus: 'NONE', hasUrgent: false, hasAbnormal: false },
    kidney: { tests: [], highestStatus: 'NONE', hasUrgent: false, hasAbnormal: false },
    blood: { tests: [], highestStatus: 'NONE', hasUrgent: false, hasAbnormal: false },
  };

  results.forEach((r) => {
    const organKey: OrganSystemKey | null = mapTestToOrgan(r.test_canonical, r.test_as_reported);
    if (organKey && organKey in organStatusMap) {
      organStatusMap[organKey].tests.push(r);
    }
  });

  // Severity hierarchy: URGENT > HIGH > LOW > NEEDS_INFO > CANNOT_BE_CLASSIFIED > NORMAL
  (Object.keys(organStatusMap) as OrganSystemKey[]).forEach((key) => {
    const organTests = organStatusMap[key].tests;
    if (organTests.length === 0) return;

    if (organTests.some((t) => t.status === 'URGENT')) {
      organStatusMap[key].highestStatus = 'URGENT';
      organStatusMap[key].hasUrgent = true;
      organStatusMap[key].hasAbnormal = true;
    } else if (organTests.some((t) => t.status === 'HIGH')) {
      organStatusMap[key].highestStatus = 'HIGH';
      organStatusMap[key].hasAbnormal = true;
    } else if (organTests.some((t) => t.status === 'LOW')) {
      organStatusMap[key].highestStatus = 'LOW';
      organStatusMap[key].hasAbnormal = true;
    } else if (organTests.some((t) => t.status === 'NEEDS_INFO')) {
      organStatusMap[key].highestStatus = 'NEEDS_INFO';
    } else if (organTests.some((t) => t.status === 'CANNOT BE CLASSIFIED FROM THE FILES')) {
      organStatusMap[key].highestStatus = 'CANNOT BE CLASSIFIED FROM THE FILES';
    } else {
      organStatusMap[key].highestStatus = 'NORMAL';
    }
  });

  const getStatusColor = (status: ClassificationStatus | 'NONE', isSelected: boolean) => {
    switch (status) {
      case 'URGENT':
        return {
          fill: '#EF4444',
          stroke: '#B91C1C',
          glow: 'rgba(239, 68, 68, 0.45)',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200',
        };
      case 'HIGH':
        return {
          fill: '#F59E0B',
          stroke: '#D97706',
          glow: 'rgba(245, 158, 11, 0.4)',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200',
        };
      case 'LOW':
        return {
          fill: '#3B82F6',
          stroke: '#2563EB',
          glow: 'rgba(59, 130, 246, 0.4)',
          badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200',
        };
      case 'NORMAL':
        return {
          fill: '#10B981',
          stroke: '#059669',
          glow: 'rgba(16, 185, 129, 0.35)',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200',
        };
      case 'NEEDS_INFO':
        return {
          fill: '#8B5CF6',
          stroke: '#6D28D9',
          glow: 'rgba(139, 92, 246, 0.35)',
          badgeBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200',
        };
      case 'CANNOT BE CLASSIFIED FROM THE FILES':
        return {
          fill: '#64748B',
          stroke: '#475569',
          glow: 'rgba(100, 116, 139, 0.3)',
          badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200',
        };
      default:
        return {
          fill: isSelected ? '#94A3B8' : '#CBD5E1',
          stroke: '#94A3B8',
          glow: 'transparent',
          badgeBg: 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200',
        };
    }
  };

  const getStatusIcon = (status: ClassificationStatus | 'NONE') => {
    switch (status) {
      case 'URGENT':
        return <ShieldAlert size={12} className="text-rose-600 animate-pulse" />;
      case 'HIGH':
        return <ArrowUpCircle size={12} className="text-amber-600" />;
      case 'LOW':
        return <ArrowDownCircle size={12} className="text-blue-600" />;
      case 'NORMAL':
        return <CheckCircle2 size={12} className="text-emerald-600" />;
      case 'NEEDS_INFO':
        return <Info size={12} className="text-violet-600" />;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />;
    }
  };

  return (
    <div className="bg-white dark:bg-healthcare-darkCard border border-zendenta-border dark:border-slate-800 rounded-2xl p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-zendenta-slate-dark dark:text-white flex items-center gap-2">
            <span>Body Systems Map</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400">
              Interactive
            </span>
          </h3>
          <p className="text-xs text-zendenta-slate-muted dark:text-slate-400">
            Click an organ zone to filter results
          </p>
        </div>

        {currentHighlightedOrgan && (
          <button
            onClick={() => onSelectOrgan(null)}
            className="text-xs font-semibold text-zendenta-blue hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60"
          >
            Show All
          </button>
        )}
      </div>

      {/* SVG Canvas and Interactive Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-4">
        {/* SVG Outline (Left 5 cols) */}
        <div className="md:col-span-5 flex justify-center items-center py-2 relative">
          <svg
            viewBox="0 0 300 420"
            className="w-full max-w-[220px] h-auto drop-shadow-sm select-none"
          >
            <defs>
              <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subtle Human Silhouette Outline */}
            <g
              className="transition-colors duration-300"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth="2"
            >
              {/* Head */}
              <circle cx="150" cy="40" r="24" className="dark:fill-slate-900 dark:stroke-slate-700" />
              {/* Neck */}
              <path
                d="M 142 63 L 142 80 L 158 80 L 158 63 Z"
                className="dark:fill-slate-900 dark:stroke-slate-700"
              />
              {/* Torso & Shoulders */}
              <path
                d="M 105 92 C 105 85, 120 80, 150 80 C 180 80, 195 85, 195 92 L 205 155 C 205 170, 185 240, 175 255 L 125 255 C 115 240, 95 170, 95 155 Z"
                className="dark:fill-slate-900 dark:stroke-slate-700"
              />
              {/* Arms */}
              <path
                d="M 103 94 L 72 170 C 70 178, 62 215, 60 230 C 58 240, 68 245, 73 235 L 88 175 L 100 130 Z"
                className="dark:fill-slate-900 dark:stroke-slate-700"
              />
              <path
                d="M 197 94 L 228 170 C 230 178, 238 215, 240 230 C 242 240, 232 245, 227 235 L 212 175 L 200 130 Z"
                className="dark:fill-slate-900 dark:stroke-slate-700"
              />
              {/* Legs */}
              <path
                d="M 125 255 L 115 360 C 113 380, 108 405, 122 410 C 132 410, 134 380, 137 360 L 146 265 Z"
                className="dark:fill-slate-900 dark:stroke-slate-700"
              />
              <path
                d="M 175 255 L 185 360 C 187 380, 192 405, 178 410 C 168 410, 166 380, 163 360 L 154 265 Z"
                className="dark:fill-slate-900 dark:stroke-slate-700"
              />
            </g>

            {/* Organ Hotspot Zones */}
            {ORGAN_SYSTEMS.map((organ) => {
              const statusInfo = organStatusMap[organ.key];
              const isSelected = currentHighlightedOrgan === organ.key;
              const hasTests = statusInfo.tests.length > 0;
              const colorInfo = getStatusColor(statusInfo.highestStatus, isSelected);

              return (
                <g
                  key={organ.key}
                  onClick={() => onSelectOrgan(isSelected ? null : organ.key)}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse ring for urgent or selected */}
                  {(statusInfo.hasUrgent || isSelected) && hasTests && (
                    <circle
                      cx={organ.cx}
                      cy={organ.cy}
                      r={organ.r + 6}
                      fill="none"
                      stroke={colorInfo.fill}
                      strokeWidth="2"
                      opacity="0.6"
                      className={statusInfo.hasUrgent ? 'animate-ping origin-center' : ''}
                    />
                  )}

                  {/* Organ Node Base */}
                  <circle
                    cx={organ.cx}
                    cy={organ.cy}
                    r={organ.r}
                    fill={hasTests ? colorInfo.fill : '#E2E8F0'}
                    fillOpacity={hasTests ? (isSelected ? '0.9' : '0.75') : '0.4'}
                    stroke={isSelected ? '#1E293B' : colorInfo.stroke}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    filter={hasTests ? 'url(#soft-glow)' : undefined}
                    className="transition-all duration-200 group-hover:scale-110 origin-center"
                  />

                  {/* Test count indicator badge */}
                  {hasTests && (
                    <text
                      x={organ.cx}
                      y={organ.cy + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {statusInfo.tests.length}
                    </text>
                  )}

                  {/* Subtitle Label */}
                  <text
                    x={organ.cx}
                    y={organ.cy + organ.r + 11}
                    textAnchor="middle"
                    fill={isSelected ? '#2F54EB' : '#64748B'}
                    fontSize="9"
                    fontWeight={isSelected ? '700' : '500'}
                    className="pointer-events-none select-none transition-colors"
                  >
                    {organ.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Organ Status Pills & Details (Right 7 cols) */}
        <div className="md:col-span-7 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ORGAN_SYSTEMS.map((organ) => {
              const statusInfo = organStatusMap[organ.key];
              const isSelected = currentHighlightedOrgan === organ.key;
              const hasTests = statusInfo.tests.length > 0;
              const colorInfo = getStatusColor(statusInfo.highestStatus, isSelected);

              return (
                <button
                  key={organ.key}
                  type="button"
                  onClick={() => onSelectOrgan(isSelected ? null : organ.key)}
                  className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-zendenta-blue bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                  } ${!hasTests ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hasTests ? colorInfo.fill : '#CBD5E1' }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zendenta-slate-dark dark:text-white truncate">
                        {organ.name}
                      </p>
                      <p className="text-[10px] text-zendenta-slate-muted dark:text-slate-400">
                        {hasTests ? `${statusInfo.tests.length} tests` : 'No tests recorded'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {getStatusIcon(statusInfo.highestStatus)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Organ Detail Inset */}
          {currentHighlightedOrgan && (
            (() => {
              const activeOrganData = organStatusMap[currentHighlightedOrgan];
              return (
                <div className="mt-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zendenta-slate-dark dark:text-white">
                      Filtered to:{' '}
                      {ORGAN_SYSTEMS.find((o) => o.key === currentHighlightedOrgan)?.name}
                    </span>
                    <span className="text-[11px] font-medium text-zendenta-blue">
                      {activeOrganData?.tests.length || 0} test(s) in this organ
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {activeOrganData?.tests.map((t: ClassificationResult, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        <span>{t.test_as_reported}</span>
                        <span className="text-slate-400">({t.value} {t.unit_reported || ''})</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Required Clinical Context Caption */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <Info size={12} className="text-slate-400" />
          <span>This map illustrates anatomical context, not a medical diagnosis.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> High/Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Urgent
          </span>
        </div>
      </div>
    </div>
  );
};
