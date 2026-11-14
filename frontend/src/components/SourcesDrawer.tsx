import React from 'react';
import { X, BookOpen, ExternalLink, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import type { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface SourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
}

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  const sources = [
    {
      title: '1_lab_safety_rules.md',
      category: 'Clinical Governance & Safety Directives',
      description:
        'Contains 5 strict clinical directives: (1) Patient privacy context-lock, (2) Prohibition against automated medical diagnosis, (3) Tone calibration at Class 8 reading level, (4) Mandatory physician consultation disclaimers, and (5) Non-maleficence principles.',
      tags: ['Safety', 'Privacy', 'Class 8 Reading Level'],
    },
    {
      title: '2_normal_ranges.md',
      category: 'Standard Clinical Reference Intervals',
      description:
        'Comprehensive clinical reference intervals for 9 core lab tests across age brackets (18-100 yrs) and biological sex (Male / Female). Specifies inclusive interval boundaries: if Value == Low or Value == High, status is NORMAL.',
      tags: ['Reference Intervals', 'Inclusive Boundaries', 'Sex/Age Brackets'],
    },
    {
      title: '3_dangerous_urgent_values.md',
      category: 'Critical Panic Thresholds',
      description:
        'Authoritative emergency limit cutoffs (e.g. Hemoglobin < 7.0 g/dL or > 20.0 g/dL, Fasting Blood Sugar < 50 mg/dL or > 300 mg/dL). Mandates overriding normal/high/low classification with URGENT and displaying: "see a doctor today".',
      tags: ['Urgent Limits', 'Critical Overrides', 'Same-day Medical Care'],
    },
    {
      title: '4_test_glossary.md',
      category: 'Biochemical Definitions & Canonical Synonyms',
      description:
        'Biochemical test descriptions, clinical functions, and established lab synonyms/aliases (e.g. SGPT = ALT, SGOT = AST, Fasting Blood Sugar = Glucose, Hemoglobin = Hb).',
      tags: ['Canonical Aliases', 'Biochemical Context', 'Explanations'],
    },
    {
      title: 'config/conversions.json',
      category: 'Standard Unit Conversion Factors',
      description:
        'Biochemical unit conversions (e.g. mmol/L to mg/dL for blood glucose with factor 18.0182) flagged with source="standard", ensuring deterministic conversions with auditable mathematical steps.',
      tags: ['Unit Conversion', 'Traceable Math'],
    },
    {
      title: 'patient_reports/*.txt',
      category: 'Encounter Reports (P001 - P014)',
      description:
        'Corpus of 14 clinical reports covering clean normals, female/male boundary cases, missing demographics, critical urgent panics, mmol/L unit conversions, unclassified tests (ferritin), and synonym variations.',
      tags: ['Test Corpus', '14 Clinical Scenarios'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  {t.sourcesTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authoritative files powering the rules engine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t.close}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-teal-900 dark:text-teal-200 text-xs flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">100% Deterministic Engine</span>
                <p className="text-teal-800 dark:text-teal-300 mt-0.5 leading-relaxed">
                  Every result, range, alias, and conversion is directly traced to these files. No outside medical knowledge is hallucinated.
                </p>
              </div>
            </div>

            {sources.map((src, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-teal-600" />
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {src.title}
                    </span>
                  </div>
                  <ExternalLink size={12} className="text-slate-400" />
                </div>
                <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  {src.category}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {src.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {src.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
