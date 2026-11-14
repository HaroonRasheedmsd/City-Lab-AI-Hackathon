import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  FileCheck2,
  HelpCircle,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import type {
  ClassificationResult,
  SupportedLanguage,
  TestExplanationItem,
} from '../types';
import { StatusBadge } from './StatusBadge';
import { RangeBar } from './RangeBar';
import { translations } from '../i18n/translations';

interface ResultsListProps {
  results: ClassificationResult[];
  explanations: TestExplanationItem[];
  language: SupportedLanguage;
}

export const ResultsList: React.FC<ResultsListProps> = ({
  results,
  explanations,
  language,
}) => {
  const t = translations[language];

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Expanded "How we checked" accordions
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // "Explain like I'm 10" mode toggle
  const [simpleMode, setSimpleMode] = useState(false);

  // Web Speech API state
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);

  const toggleExpand = (canonical: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [canonical]: !prev[canonical],
    }));
  };

  const handleSpeak = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }

    if (activeSpeechIndex === index) {
      window.speechSynthesis.cancel();
      setActiveSpeechIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setActiveSpeechIndex(null);
    utterance.onerror = () => setActiveSpeechIndex(null);
    setActiveSpeechIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // Find explanation for a test
  const getExplanation = (canonical: string): TestExplanationItem | undefined => {
    return explanations.find(
      (e) => e.test_canonical.toLowerCase() === canonical.toLowerCase()
    );
  };

  // Filtered results
  const filteredResults = results.filter((res) => {
    const matchesSearch =
      res.test_canonical.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.test_as_reported.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ABNORMAL') {
      return (
        res.status === 'LOW' ||
        res.status === 'HIGH' ||
        res.status === 'URGENT' ||
        res.status === 'NEEDS_INFO'
      );
    }
    return res.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search + Filter + Explain Like I'm 10 toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-card border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test by name or alias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filters & Toggles */}
        <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setStatusFilter('ABNORMAL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ABNORMAL'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Attention Needed
            </button>
            <button
              onClick={() => setStatusFilter('NORMAL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'NORMAL'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Normal
            </button>
          </div>

          {/* Simple Mode Toggle */}
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              simpleMode
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Toggle simplified child-friendly explanations"
          >
            <Sparkles size={14} className={simpleMode ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} />
            <span>{simpleMode ? t.explainLikeIm10 : t.standardExplanation}</span>
          </button>
        </div>
      </div>

      {/* Results List Bento Cards */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200/80 dark:border-slate-800 text-slate-500">
            <HelpCircle size={36} className="mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-sm">No laboratory tests match the current filter.</p>
          </div>
        ) : (
          filteredResults.map((result, idx) => {
            const isExpanded = !!expandedCards[result.test_canonical];
            const explanation = getExplanation(result.test_canonical);
            const isAliased =
              result.test_as_reported.toLowerCase() !==
              result.test_canonical.toLowerCase();
            const isSpeaking = activeSpeechIndex === idx;

            // Simple explanation text for read-aloud or simple mode
            const speechText = explanation
              ? `${result.test_canonical}. Result is ${result.value} ${result.unit_reported || ''}. Status is ${result.status}. ${explanation.simple_summary}. What it measures: ${explanation.what_it_measures}`
              : `${result.test_canonical}: ${result.value} ${result.unit_reported || ''}. Status is ${result.status}.`;

            return (
              <div
                key={`${result.test_canonical}-${idx}`}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-card border transition-all ${
                  result.status === 'URGENT'
                    ? 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/20 shadow-urgent'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Canonical Name, Alias Badge, Status, Reported Value */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                        {result.test_canonical}
                      </h3>

                      {/* Alias Badge if reported under another synonym */}
                      {isAliased && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <span>{result.test_as_reported}</span>
                          <ArrowRight size={10} className="text-slate-400" />
                          <span className="text-teal-700 dark:text-teal-400">{result.test_canonical}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Evaluated test parameter from lab report
                    </p>
                  </div>

                  {/* Value and Status Chip */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                        {result.value}{' '}
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {result.unit_reported || ''}
                        </span>
                      </div>
                      {result.converted_value && (
                        <div className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
                          Converted: {result.converted_value} {result.converted_unit}
                        </div>
                      )}
                    </div>

                    <StatusBadge status={result.status} size="md" />
                  </div>
                </div>

                {/* Range Bar Visualizer */}
                {result.range_used && (
                  <div className="mt-4">
                    <RangeBar
                      value={result.converted_value ?? result.value}
                      low={result.range_used.low}
                      high={result.range_used.high}
                      unit={result.range_used.unit}
                      status={result.status}
                    />
                  </div>
                )}

                {/* Plain-Language Explanation */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                      <FileCheck2 size={14} />
                      <span>{simpleMode ? 'Simple Explanation' : 'Plain-Language Explanation'}</span>
                    </span>

                    {/* Read-Aloud Button */}
                    <button
                      onClick={() => handleSpeak(speechText, idx)}
                      className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                        isSpeaking
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-teal-600 border border-slate-200 dark:border-slate-700'
                      }`}
                      title="Read aloud explanation using Web Speech API"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX size={13} className="text-rose-600" />
                          <span>{t.stopAudio}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>{t.listenExplanation}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {explanation ? (
                    <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {explanation.simple_summary}
                      </p>
                      {!simpleMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                            <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                              What it measures:
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {explanation.what_it_measures}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                            <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                              Clinical significance:
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {explanation.what_low_or_high_can_mean}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {result.reason_code}
                    </p>
                  )}
                </div>

                {/* "How We Checked" Accordion Expander */}
                <div className="mt-3">
                  <button
                    onClick={() => toggleExpand(result.test_canonical)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 transition py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Calculator size={13} />
                      <span>{t.howWeChecked}</span>
                    </span>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {t.referenceRange}:
                          </span>
                          <span>
                            {result.range_used
                              ? `${result.range_used.low} – ${result.range_used.high} ${result.range_used.unit} (${result.range_used.age_bracket}, ${result.range_used.sex_bracket})`
                              : 'None in CityLab catalog'}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {t.sourceFile}:
                          </span>
                          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400">
                            {result.source_refs.join(', ') || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {result.conversion_steps && (
                        <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-200">
                          <span className="font-bold block mb-0.5">{t.conversionSteps}:</span>
                          <span className="font-mono text-[11px]">{result.conversion_steps}</span>
                        </div>
                      )}

                      {result.boundary_note && (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {t.boundaryRule}:
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {result.boundary_note}
                          </span>
                        </div>
                      )}

                      {result.missing_fields && result.missing_fields.length > 0 && (
                        <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300 font-medium">
                          <AlertCircle size={14} />
                          <span>Missing demographics needed for selection: {result.missing_fields.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
