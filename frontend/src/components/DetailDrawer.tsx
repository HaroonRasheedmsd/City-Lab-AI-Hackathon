import React from 'react';
import {
  X,
  FileText,
  Calculator,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Scale,
} from 'lucide-react';
import type {
  ClassificationResult,
  TestExplanationItem,
} from '../types';
import { StatusBadge } from './StatusBadge';
import { RangeBar } from './RangeBar';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  result: ClassificationResult | null;
  explanation?: TestExplanationItem | null;
  onAskAi: (question: string) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  result,
  explanation,
  onAskAi,
}) => {
  if (!isOpen || !result) return null;

  const isAliased =
    result.test_canonical.toLowerCase() !== result.test_as_reported.toLowerCase();

  const handleAskAboutTest = () => {
    const question = `Can you explain my ${result.test_as_reported} result of ${result.value} ${
      result.unit_reported || ''
    } in simple terms?`;
    onAskAi(question);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-healthcare-darkCard h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-zendenta-border dark:border-slate-800 animate-slideLeft">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zendenta-border dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zendenta-blue dark:text-blue-400">
                How We Checked
              </span>
              {isAliased && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Alias: {result.test_as_reported} → {result.test_canonical}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-zendenta-slate-dark dark:text-white mt-1">
              {result.test_canonical}
            </h2>
            <div className="mt-2">
              <StatusBadge status={result.status} size="sm" />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Urgent Warning Banner if triggered */}
          {result.urgent_info && result.urgent_info.is_urgent && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 space-y-2 urgent-ring">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-300">
                <ShieldAlert size={18} className="animate-pulse" />
                <span>Urgent Clinical Alert: See a Doctor Immediately</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-200">
                {result.urgent_info.severe_warning}
              </p>
              <div className="text-[10px] text-rose-600 dark:text-rose-400 pt-1 border-t border-rose-200 dark:border-rose-900">
                Trigger: {result.urgent_info.threshold_trigger} ({result.urgent_info.threshold_value} {result.urgent_info.threshold_unit}) • Source: {result.urgent_info.source_file}
              </div>
            </div>
          )}

          {/* 1. Value Visualizer & Range */}
          <div className="p-4 rounded-xl border border-zendenta-border dark:border-slate-800 bg-white dark:bg-slate-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reported Value
                </span>
                <div className="text-2xl font-black text-zendenta-slate-dark dark:text-white mt-0.5">
                  {result.value}{' '}
                  <span className="text-sm font-semibold text-slate-500">
                    {result.unit_reported || ''}
                  </span>
                </div>
              </div>

              {result.range_used && (
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Normal Reference
                  </span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {result.range_used.low !== null && result.range_used.high !== null
                      ? `${result.range_used.low} - ${result.range_used.high} ${result.range_used.unit || ''}`
                      : result.range_used.qualitative_normal || 'Not specified'}
                  </div>
                </div>
              )}
            </div>

            {/* Range Bar */}
            <RangeBar
              value={result.converted_value ?? result.value}
              low={result.range_used?.low}
              high={result.range_used?.high}
              unit={result.converted_unit ?? result.unit_reported}
              status={result.status}
            />
          </div>

          {/* 2. Unit Conversion Step (if any) */}
          {result.conversion_steps && (
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-zendenta-blue dark:text-blue-400">
                <Calculator size={14} />
                <span>Exact Unit Conversion Formula</span>
              </div>
              <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                {result.conversion_steps}
              </p>
              {result.conversion_source && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Source: {result.conversion_source}
                </p>
              )}
            </div>
          )}

          {/* 3. Boundary Rule & Reason */}
          <div className="p-4 rounded-xl border border-zendenta-border dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zendenta-slate-dark dark:text-white">
              <Scale size={14} className="text-zendenta-blue" />
              <span>Boundary &amp; Classification Logic</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {result.boundary_note || result.reason_code}
            </p>
            {result.range_used && (
              <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Demographic Bracket:</span>{' '}
                  Age {result.range_used.age_bracket || 'All'}, Sex {result.range_used.sex_bracket || 'Any'}
                </div>
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">File Reference:</span>{' '}
                  {result.range_used.source_file} ({result.range_used.row_ref})
                </div>
              </div>
            )}
          </div>

          {/* 4. Plain-Language Explanation (from backend Glossary) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-zendenta-border dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zendenta-slate-dark dark:text-white">
              <BookOpen size={14} className="text-zendenta-teal" />
              <span>What This Test Measures (From Lab Glossary)</span>
            </div>

            {explanation ? (
              <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Definition:</strong>{' '}
                  {explanation.what_it_measures}
                </p>
                {explanation.what_low_or_high_can_mean && (
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Clinical Context:</strong>{' '}
                    {explanation.what_low_or_high_can_mean}
                  </p>
                )}
                {explanation.simple_summary && (
                  <p className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border border-teal-100 dark:border-teal-900">
                    <strong className="font-semibold">Summary:</strong> {explanation.simple_summary}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Glossary summary: Evaluated according to CityLab normal range guidelines.
              </p>
            )}
          </div>

          {/* 5. Data Provenance & Source Files */}
          <div className="p-4 rounded-xl border border-zendenta-border dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zendenta-slate-dark dark:text-white">
              <FileText size={14} className="text-slate-500" />
              <span>Auditable Source Citations</span>
            </div>
            <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              {result.source_refs && result.source_refs.length > 0 ? (
                result.source_refs.map((src, i) => (
                  <li key={i} className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-zendenta-blue shrink-0" />
                    <span>{src}</span>
                  </li>
                ))
              ) : (
                <li className="text-[11px] text-slate-400">Lab_Reference_Ranges.xlsx</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zendenta-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
          <button
            onClick={handleAskAboutTest}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zendenta-blue hover:bg-zendenta-blue-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Sparkles size={15} />
            <span>Ask AI Assistant About This</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
