import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { ClassificationStatus } from '../types';

interface RangeBarProps {
  value: number | string;
  low?: number | null;
  high?: number | null;
  unit?: string | null;
  status: ClassificationStatus;
}

export const RangeBar: React.FC<RangeBarProps> = ({
  value,
  low,
  high,
  unit,
  status,
}) => {
  const markerRef = useRef<HTMLDivElement>(null);

  // Parse numeric value if possible
  const numericVal = typeof value === 'number' ? value : parseFloat(String(value));
  const hasNumeric = !isNaN(numericVal) && low !== null && low !== undefined && high !== null && high !== undefined;

  let targetPercent = 50;

  if (hasNumeric && low !== null && high !== null) {
    if (high === low) {
      targetPercent = 50;
    } else if (numericVal <= low) {
      // Map from [low - (high - low)*0.5, low] to [5%, 25%]
      const span = high - low;
      const dist = (low - numericVal) / (span || 1);
      targetPercent = Math.max(5, 25 - dist * 20);
    } else if (numericVal >= high) {
      // Map from [high, high + (high - low)*0.5] to [75%, 95%]
      const span = high - low;
      const dist = (numericVal - high) / (span || 1);
      targetPercent = Math.min(95, 75 + dist * 20);
    } else {
      // Inside normal range: map [low, high] to [25%, 75%]
      const ratio = (numericVal - low) / (high - low);
      targetPercent = 25 + ratio * 50;
    }
  }

  useEffect(() => {
    if (markerRef.current) {
      gsap.fromTo(
        markerRef.current,
        { left: '0%' },
        {
          left: `${targetPercent}%`,
          duration: 0.9,
          ease: 'power2.out',
        }
      );
    }
  }, [targetPercent, numericVal]);

  if (!hasNumeric) {
    return (
      <div className="py-2">
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 w-full" />
        <p className="text-[11px] text-slate-400 mt-1 italic">
          Qualitative or non-numeric range
        </p>
      </div>
    );
  }

  const getMarkerColor = () => {
    switch (status) {
      case 'NORMAL':
        return 'bg-emerald-500 border-emerald-200 ring-emerald-300';
      case 'LOW':
        return 'bg-blue-500 border-blue-200 ring-blue-300';
      case 'HIGH':
        return 'bg-amber-500 border-amber-200 ring-amber-300';
      case 'URGENT':
        return 'bg-rose-600 border-rose-200 ring-rose-400 urgent-ring';
      default:
        return 'bg-slate-500 border-slate-200 ring-slate-300';
    }
  };

  return (
    <div className="w-full pt-1 pb-2">
      {/* Visual Bar Track */}
      <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-visible flex items-center">
        {/* Low segment (0% to 25%) */}
        <div className="h-full w-1/4 rounded-l-full bg-blue-100 dark:bg-blue-950/60" />

        {/* Normal segment (25% to 75%) */}
        <div className="h-full w-2/4 bg-emerald-100 dark:bg-emerald-950/70 border-x border-emerald-300 dark:border-emerald-700" />

        {/* High segment (75% to 100%) */}
        <div className="h-full w-1/4 rounded-r-full bg-amber-100 dark:bg-amber-950/60" />

        {/* Sliding Marker Needle */}
        <div
          ref={markerRef}
          style={{ left: `${targetPercent}%` }}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 ring-2 shadow-md transition-shadow ${getMarkerColor()}`}
          title={`Value: ${numericVal} ${unit || ''}`}
        />
      </div>

      {/* Boundary labels */}
      <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 px-0.5">
        <span>Low (&lt;{low})</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
          Normal: {low} – {high} {unit || ''}
        </span>
        <span>High (&gt;{high})</span>
      </div>
    </div>
  );
};
