import React from 'react';
import {
  FileText,
  Calculator,
  ChevronRight,
  Info,
} from 'lucide-react';
import type {
  ClassificationResult,
  ClassificationStatus,
  TestExplanationItem,
} from '../types';
import { StatusBadge } from './StatusBadge';
import { RangeBar } from './RangeBar';

interface ResultsTimelineProps {
  results: ClassificationResult[];
  explanations: TestExplanationItem[];
  selectedTest: ClassificationResult | null;
  onSelectTest: (result: ClassificationResult) => void;
  onInspectTest: (result: ClassificationResult) => void;
}

export const ResultsTimeline: React.FC<ResultsTimelineProps> = ({
  results,
  explanations,
  selectedTest,
  onSelectTest,
  onInspectTest,
}) => {
  if (results.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-healthcare-darkCard rounded-2xl border border-zendenta-border dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-500">
          No test results match the current filter.
        </p>
      </div>
    );
  }

  const getTimelineDotColor = (status: ClassificationStatus) => {
    switch (status) {
      case 'URGENT':
        return 'bg-rose-500 ring-rose-200 border-rose-600 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500 ring-amber-200 border-amber-600';
      case 'LOW':
        return 'bg-blue-500 ring-blue-200 border-blue-600';
      case 'NORMAL':
        return 'bg-emerald-500 ring-emerald-200 border-emerald-600';
      case 'NEEDS_INFO':
        return 'bg-violet-500 ring-violet-200 border-violet-600';
      default:
        return 'bg-slate-400 ring-slate-200 border-slate-500';
    }
  };

  return (
    <div className="relative pl-6 space-y-4">
      {/* Vertical Continuous Dotted Timeline Line */}
      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-slate-200 dark:border-slate-700/80 pointer-events-none" />

      {results.map((result, idx) => {
        const isSelected = selectedTest?.test_canonical === result.test_canonical;
        const explanation = explanations.find(
          (e) => e.test_canonical.toLowerCase() === result.test_canonical.toLowerCase()
        );
        const isAliased =
          result.test_canonical.toLowerCase() !== result.test_as_reported.toLowerCase();

        return (
          <div
            key={`${result.test_canonical}-${idx}`}
            className="relative group cursor-pointer"
            onClick={() => onSelectTest(result)}
          >
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-5 w-3.5 h-3.5 rounded-full border-2 ring-4 transition-transform group-hover:scale-125 z-10 ${getTimelineDotColor(
                result.status
              )}`}
            />

            {/* Test Card */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-white dark:bg-healthcare-darkCard border-zendenta-blue ring-2 ring-zendenta-blue/20 shadow-md'
                  : 'bg-white dark:bg-healthcare-darkCard border-zendenta-border dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-soft hover:shadow-card'
              }`}
            >
              {/* Card Header: Test Name, Alias, Value, and Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-zendenta-slate-dark dark:text-white">
                      {result.test_canonical}
                    </h4>

                    {/* Alias Pill (e.g. SGPT -> ALT) */}
                    {isAliased && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <span>Reported as</span>
                        <strong className="text-zendenta-blue dark:text-blue-400">
                          {result.test_as_reported}
                        </strong>
                      </span>
                    )}

                    {/* Converted indicator */}
                    {result.converted_value !== undefined &&
                      result.converted_value !== null &&
                      result.converted_unit && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-zendenta-blue border border-blue-200 dark:border-blue-800">
                          Converted
                        </span>
                      )}
                  </div>

                  {/* Reference Range Subtext */}
                  {result.range_used && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ref: {result.range_used.low ?? '?'} - {result.range_used.high ?? '?'}{' '}
                      {result.range_used.unit || ''}{' '}
                      <span className="text-slate-400">
                        [Age: {result.range_used.age_bracket}, Sex: {result.range_used.sex_bracket}]
                      </span>
                    </p>
                  )}
                </div>

                {/* Right: Value & Status Chip */}
                <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                  <div className="text-right">
                    <div className="text-lg font-black text-zendenta-slate-dark dark:text-white">
                      {result.value}{' '}
                      <span className="text-xs font-semibold text-slate-400">
                        {result.unit_reported || ''}
                      </span>
                    </div>

                    {result.converted_value !== null &&
                      result.converted_value !== undefined && (
                        <div className="text-[11px] font-medium text-zendenta-blue">
                          = {result.converted_value} {result.converted_unit}
                        </div>
                      )}
                  </div>

                  <StatusBadge status={result.status} size="sm" />
                </div>
              </div>

              {/* Range Visualizer Bar */}
              <div className="mt-3">
                <RangeBar
                  value={result.converted_value ?? result.value}
                  low={result.range_used?.low}
                  high={result.range_used?.high}
                  unit={result.converted_unit ?? result.unit_reported}
                  status={result.status}
                />
              </div>

              {/* Plain-Language Summary Excerpt */}
              {explanation?.simple_summary && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {explanation.simple_summary}
                </p>
              )}

              {/* Inset Box: Boundary Note or Conversion Steps */}
              {(result.boundary_note || result.conversion_steps) && (
                <div className="mt-3 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 text-xs space-y-1">
                  {result.conversion_steps && (
                    <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 font-mono text-[11px]">
                      <Calculator size={13} className="text-zendenta-blue shrink-0" />
                      <span>{result.conversion_steps}</span>
                    </div>
                  )}
                  {result.boundary_note && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                      <Info size={13} className="text-slate-400 shrink-0" />
                      <span>{result.boundary_note}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Card Footer: Source citation + Inspect Action Button */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <FileText size={12} />
                  <span>
                    {result.source_refs?.[0] || result.range_used?.source_file || 'Lab_Reference_Ranges.xlsx'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectTest(result);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zendenta-blue hover:text-zendenta-blue-hover hover:underline"
                >
                  <span>How we checked</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
